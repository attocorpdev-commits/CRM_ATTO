import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { createEvolutionClientFromConfig } from "@/lib/whatsapp/evolution-api"

export async function POST(req: NextRequest) {
  const { disparoId } = await req.json()

  if (!disparoId) {
    return NextResponse.json({ error: "disparoId required" }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: disparo } = await supabase
    .from("disparos")
    .select("*")
    .eq("id", disparoId)
    .single()

  if (!disparo || disparo.status === "cancelado") {
    return NextResponse.json({ error: "Not found or cancelled" }, { status: 404 })
  }

  // Fire-and-forget: start broadcast in background, return immediately
  executeBroadcast(disparoId).catch((err) => {
    console.error("[disparos] broadcast error:", err)
  })

  return NextResponse.json({ ok: true, started: true })
}

async function executeBroadcast(disparoId: string) {
  const supabase = createServiceClient()
  const evolution = await createEvolutionClientFromConfig()

  // Mark as in progress
  await supabase
    .from("disparos")
    .update({ status: "em_andamento", started_at: new Date().toISOString() })
    .eq("id", disparoId)

  // Load the disparo to get the message template and delay
  const { data: disparo } = await supabase
    .from("disparos")
    .select("mensagem, delay_segundos")
    .eq("id", disparoId)
    .single()

  if (!disparo) return

  // Load all pending contacts
  const { data: contatos } = await supabase
    .from("disparo_contatos")
    .select("*")
    .eq("disparo_id", disparoId)
    .eq("status", "pendente")
    .order("created_at", { ascending: true })

  if (!contatos || contatos.length === 0) {
    await supabase
      .from("disparos")
      .update({ status: "concluido", finished_at: new Date().toISOString() })
      .eq("id", disparoId)
    return
  }

  const delayMs = disparo.delay_segundos * 1000

  for (let i = 0; i < contatos.length; i++) {
    const contato = contatos[i]

    // Check for cancellation every 10 contacts
    if (i % 10 === 0 && i > 0) {
      const { data: check } = await supabase
        .from("disparos")
        .select("status")
        .eq("id", disparoId)
        .single()
      if (check?.status === "cancelado") break
    }

    // Replace {nome} placeholder
    const personalizedMessage = disparo.mensagem.replace(
      /\{nome\}/gi,
      contato.nome
    )

    try {
      await evolution.sendText({
        number: contato.numero,
        text: personalizedMessage,
      })

      await supabase
        .from("disparo_contatos")
        .update({ status: "enviado", enviado_at: new Date().toISOString() })
        .eq("id", contato.id)

      await supabase.rpc("increment_disparo_enviados", {
        p_disparo_id: disparoId,
      })
    } catch (err) {
      await supabase
        .from("disparo_contatos")
        .update({
          status: "falha",
          erro_msg: (err as Error).message?.slice(0, 500),
        })
        .eq("id", contato.id)

      await supabase.rpc("increment_disparo_falhas", {
        p_disparo_id: disparoId,
      })
    }

    // Wait between messages (except after the last one)
    if (i < contatos.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  // Mark as completed (unless cancelled)
  const { data: finalState } = await supabase
    .from("disparos")
    .select("status")
    .eq("id", disparoId)
    .single()

  if (finalState?.status !== "cancelado") {
    await supabase
      .from("disparos")
      .update({ status: "concluido", finished_at: new Date().toISOString() })
      .eq("id", disparoId)
  }
}
