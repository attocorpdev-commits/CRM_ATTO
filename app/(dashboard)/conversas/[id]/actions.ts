"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"
import { createEvolutionClient } from "@/lib/whatsapp/evolution-api"
import { revalidatePath } from "next/cache"

export async function sendMessageAction(
  conversaId: string,
  phoneNumber: string,
  text: string
): Promise<{ error?: string }> {
  if (!text.trim()) return { error: "Mensagem não pode ser vazia" }

  try {
    const evolution = createEvolutionClient()
    const supabase  = createServiceClient()

    // Send via Evolution API
    await evolution.sendText({ number: phoneNumber, text: text.trim() })

    const now = new Date().toISOString()

    // Insert outbound message
    const { error: insertError } = await supabase
      .from("mensagens_whatsapp")
      .insert({
        conversa_id: conversaId,
        direcao:     "outbound",
        conteudo:    text.trim(),
        status:      "enviada",
        timestamp:   now,
      })

    if (insertError) throw insertError

    // Update conversation last message
    await supabase
      .from("conversas_whatsapp")
      .update({
        ultima_mensagem:      text.trim(),
        ultima_mensagem_time: now,
        status:               "ativa",
      })
      .eq("id", conversaId)

    revalidatePath(`/conversas/${conversaId}`)
    return {}
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function updateConversaEstagioAction(
  conversaId: string,
  estagio: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("conversas_whatsapp")
      .update({ estagio: estagio as never })
      .eq("id", conversaId)

    if (error) throw error
    revalidatePath(`/conversas/${conversaId}`)
    return {}
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function updateConversaStatusAction(
  conversaId: string,
  status: "ativa" | "encerrada" | "arquivada"
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("conversas_whatsapp")
      .update({ status })
      .eq("id", conversaId)

    if (error) throw error
    revalidatePath(`/conversas`)
    return {}
  } catch (err) {
    return { error: (err as Error).message }
  }
}
