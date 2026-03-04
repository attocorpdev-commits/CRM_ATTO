"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createListaAction(
  _prev: unknown,
  formData: FormData
) {
  const nome = (formData.get("nome") as string)?.trim()
  const contactsJson = formData.get("contacts") as string

  if (!nome) {
    return { error: "O nome da lista é obrigatório" }
  }

  let contacts: { nome: string; numero: string }[]
  try {
    contacts = JSON.parse(contactsJson)
  } catch {
    return { error: "Dados de contatos inválidos" }
  }

  if (!contacts || contacts.length === 0) {
    return { error: "Adicione pelo menos um contato" }
  }

  if (contacts.length > 1000) {
    return { error: "Máximo de 1000 contatos por lista" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { data: vendedor } = await supabase
    .from("vendedores")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!vendedor) return { error: "Vendedor não encontrado" }

  const serviceClient = createServiceClient()

  const { data: lista, error: insertError } = await serviceClient
    .from("listas_contatos")
    .insert({
      vendedor_id: vendedor.id,
      nome,
      total_contatos: contacts.length,
    })
    .select("id")
    .single()

  if (insertError) {
    return { error: insertError.message }
  }

  const items = contacts.map((c) => ({
    lista_id: lista.id,
    nome: c.nome,
    numero: c.numero,
  }))

  const { error: itemsError } = await serviceClient
    .from("lista_contatos_items")
    .insert(items)

  if (itemsError) {
    await serviceClient.from("listas_contatos").delete().eq("id", lista.id)
    return { error: itemsError.message }
  }

  revalidatePath("/contatos")
  return { success: true, listaId: lista.id }
}

export async function deleteListaAction(listaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const serviceClient = createServiceClient()

  const { error } = await serviceClient
    .from("listas_contatos")
    .delete()
    .eq("id", listaId)

  if (error) return { error: error.message }

  revalidatePath("/contatos")
  return { success: true }
}

export async function addContactsToListaAction(
  _prev: unknown,
  formData: FormData
) {
  const listaId = formData.get("lista_id") as string
  const contactsJson = formData.get("contacts") as string

  if (!listaId) return { error: "Lista não encontrada" }

  let contacts: { nome: string; numero: string }[]
  try {
    contacts = JSON.parse(contactsJson)
  } catch {
    return { error: "Dados de contatos inválidos" }
  }

  if (!contacts || contacts.length === 0) {
    return { error: "Adicione pelo menos um contato" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const serviceClient = createServiceClient()

  const items = contacts.map((c) => ({
    lista_id: listaId,
    nome: c.nome,
    numero: c.numero,
  }))

  const { error } = await serviceClient
    .from("lista_contatos_items")
    .insert(items)

  if (error) return { error: error.message }

  await serviceClient.rpc("update_lista_total", { p_lista_id: listaId })

  revalidatePath(`/contatos/${listaId}`)
  revalidatePath("/contatos")
  return { success: true }
}

export async function removeContactFromListaAction(itemId: string, listaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const serviceClient = createServiceClient()

  const { error } = await serviceClient
    .from("lista_contatos_items")
    .delete()
    .eq("id", itemId)

  if (error) return { error: error.message }

  await serviceClient.rpc("update_lista_total", { p_lista_id: listaId })

  revalidatePath(`/contatos/${listaId}`)
  revalidatePath("/contatos")
  return { success: true }
}
