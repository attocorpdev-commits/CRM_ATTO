"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface CreateDisparoInput {
  contacts: { nome: string; numero: string }[]
  mensagem: string
  delaySegundos: number
}

const ALLOWED_DELAYS = [5, 10, 15, 30, 60, 120, 180, 300, 600]

export async function createDisparoAction(
  _prev: unknown,
  formData: FormData
) {
  const mensagem = (formData.get("mensagem") as string)?.trim()
  const delaySegundos = Number(formData.get("delay_segundos")) || 300
  const contactsJson = formData.get("contacts") as string

  if (!mensagem) {
    return { error: "A mensagem é obrigatória" }
  }

  if (!ALLOWED_DELAYS.includes(delaySegundos)) {
    return { error: "Intervalo inválido" }
  }

  let contacts: CreateDisparoInput["contacts"]
  try {
    contacts = JSON.parse(contactsJson)
  } catch {
    return { error: "Dados de contatos inválidos" }
  }

  if (!contacts || contacts.length === 0) {
    return { error: "Nenhum contato válido encontrado" }
  }

  if (contacts.length > 1000) {
    return { error: "Máximo de 1000 contatos por disparo" }
  }

  // Get current user's vendedor_id
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { data: vendedor } = await supabase
    .from("vendedores")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!vendedor) return { error: "Vendedor não encontrado" }

  // Check for active broadcasts
  const { data: active } = await supabase
    .from("disparos")
    .select("id")
    .eq("vendedor_id", vendedor.id)
    .in("status", ["pendente", "em_andamento"])
    .limit(1)

  if (active && active.length > 0) {
    return { error: "Você já tem um disparo em andamento. Aguarde ou cancele antes de criar outro." }
  }

  // Use service client for inserts (bypasses RLS for bulk insert)
  const serviceClient = createServiceClient()

  // Insert the disparo
  const { data: disparo, error: insertError } = await serviceClient
    .from("disparos")
    .insert({
      vendedor_id: vendedor.id,
      mensagem,
      total_contatos: contacts.length,
      delay_segundos: delaySegundos,
    })
    .select("id")
    .single()

  if (insertError) {
    return { error: insertError.message }
  }

  // Bulk insert contacts
  const contactRows = contacts.map((c) => ({
    disparo_id: disparo.id,
    nome: c.nome,
    numero: c.numero,
  }))

  const { error: contactsError } = await serviceClient
    .from("disparo_contatos")
    .insert(contactRows)

  if (contactsError) {
    // Rollback the disparo
    await serviceClient.from("disparos").delete().eq("id", disparo.id)
    return { error: contactsError.message }
  }

  // Fire-and-forget: trigger the broadcast execution (use localhost for internal calls)
  fetch(`http://localhost:3000/api/disparos/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ disparoId: disparo.id }),
  }).catch((err) => {
    console.error("[disparos] failed to trigger execute:", err)
  })

  revalidatePath("/disparos")
  return { success: true, disparoId: disparo.id }
}
