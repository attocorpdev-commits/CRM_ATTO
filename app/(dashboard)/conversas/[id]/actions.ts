"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"
import { createEvolutionClientFromConfig } from "@/lib/whatsapp/evolution-api"
import { revalidatePath } from "next/cache"

export async function sendMessageAction(
  conversaId: string,
  phoneNumber: string,
  text: string
): Promise<{ error?: string }> {
  if (!text.trim()) return { error: "Mensagem não pode ser vazia" }

  try {
    const evolution = await createEvolutionClientFromConfig()
    const supabase  = createServiceClient()

    // Send via Evolution API — capture the message ID to prevent webhook duplication
    const response = await evolution.sendText({ number: phoneNumber, text: text.trim() })
    const mid = response?.key?.id ?? undefined

    const now = new Date().toISOString()

    // Insert outbound message with mid so webhook idempotency check can detect it
    const { error: insertError } = await supabase
      .from("mensagens_whatsapp")
      .insert({
        conversa_id: conversaId,
        direcao:     "outbound",
        conteudo:    text.trim(),
        status:      "enviada",
        timestamp:   now,
        ...(mid ? { mid } : {}),
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

export async function sendMediaAction(
  conversaId: string,
  phoneNumber: string,
  formData: FormData
): Promise<{ error?: string }> {
  try {
    const file     = formData.get("file") as File | null
    const caption  = (formData.get("caption") as string) ?? ""

    if (!file) return { error: "Nenhum arquivo selecionado" }

    const evolution = await createEvolutionClientFromConfig()
    const supabase  = createServiceClient()

    // Convert file to base64
    const buffer   = Buffer.from(await file.arrayBuffer())
    const base64   = buffer.toString("base64")
    const mimetype = file.type
    const fileName = file.name

    // Determine media type
    let mediatype: "image" | "video" | "audio" | "document"
    if (mimetype.startsWith("image/")) mediatype = "image"
    else if (mimetype.startsWith("video/")) mediatype = "video"
    else if (mimetype.startsWith("audio/")) mediatype = "audio"
    else mediatype = "document"

    // Send via Evolution API — capture the message ID to prevent webhook duplication
    const response = await evolution.sendMedia({
      number:    phoneNumber,
      mediatype,
      mimetype,
      caption:   caption || undefined,
      media:     base64,
      fileName,
    })
    const mid = response?.key?.id ?? undefined

    const now = new Date().toISOString()

    const MEDIA_LABELS: Record<string, string> = {
      image:    "\ud83d\udcf7 Imagem",
      audio:    "\ud83c\udfa4 \u00c1udio",
      video:    "\ud83c\udfa5 V\u00eddeo",
      document: "\ud83d\udcc4 Documento",
    }
    const displayText = caption || MEDIA_LABELS[mediatype] || "[m\u00eddia]"

    const anexo = {
      type: mediatype,
      base64,
      mimetype,
      fileName,
      caption: caption || undefined,
    }

    // Insert outbound message
    const { error: insertError } = await supabase
      .from("mensagens_whatsapp")
      .insert({
        conversa_id: conversaId,
        direcao:     "outbound",
        conteudo:    displayText,
        status:      "enviada",
        timestamp:   now,
        anexos:      anexo,
        ...(mid ? { mid } : {}),
      })

    if (insertError) throw insertError

    // Update conversation last message
    await supabase
      .from("conversas_whatsapp")
      .update({
        ultima_mensagem:      displayText,
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
    revalidatePath("/kanban")
    return {}
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function reassignConversaAction(
  conversaId: string,
  newVendedorId: string
): Promise<{ error?: string }> {
  try {
    const supabase = createServiceClient()

    // Decrement old seller's counter first
    await supabase.rpc("unassign_conversation", {
      p_conversa_id: conversaId,
    })

    // Assign to new seller (increments their counter + sets vendedor_id)
    const { error: rpcError } = await supabase.rpc("assign_conversation", {
      p_conversa_id: conversaId,
      p_vendedor_id: newVendedorId,
    })

    if (rpcError) throw rpcError

    revalidatePath(`/conversas`)
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
