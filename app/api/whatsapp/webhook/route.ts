import { NextRequest, NextResponse } from "next/server"
import crypto from "node:crypto"
import { createServiceClient } from "@/lib/supabase/server"
import { distributeConversation } from "@/lib/distribution/conversation-distributor"
import { formatPhoneNumber, isGroupJid } from "@/lib/utils"
import {
  EvolutionApiClient,
  type EvolutionWebhookPayload,
} from "@/lib/whatsapp/evolution-api"

// ============================================================
// POST /api/whatsapp/webhook
// Receives all events from Evolution API
// This endpoint is intentionally PUBLIC (no auth) — protected by HMAC signature
// ============================================================
export async function POST(req: NextRequest) {
  // 1. Read raw body as text BEFORE any JSON parsing
  //    req.text() and req.json() both consume the stream — only call one
  const rawBody = await req.text()

  // 2. Verify HMAC-SHA256 signature
  const webhookSecret = process.env.WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[Webhook] WEBHOOK_SECRET is not configured")
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  const signature = req.headers.get("x-webhook-secret") ?? ""
  if (signature && webhookSecret) {
    try {
      const expected = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex")

      const sigBuffer  = Buffer.from(signature, "hex")
      const expBuffer  = Buffer.from(expected, "hex")

      if (
        sigBuffer.length !== expBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expBuffer)
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: "Invalid signature format" }, { status: 401 })
    }
  }

  // 3. Parse payload
  let payload: EvolutionWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const supabase = createServiceClient()
  // Webhook only uses extractTextContent/getMessageType — no API calls needed.
  // Use a dummy client to avoid DB lookup on every webhook event.
  const evolution = new EvolutionApiClient("", "", "")

  // Forward to n8n webhook (fire-and-forget, never blocks CRM processing)
  const { data: configRow } = await supabase
    .from("configuracoes_whatsapp")
    .select("n8n_webhook_url")
    .limit(1)
    .single()

  if (configRow?.n8n_webhook_url) {
    fetch(configRow.n8n_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: rawBody,
    }).catch((err) => {
      console.error("[Webhook] N8N forward failed:", err)
    })
  }

  try {
    switch (payload.event) {
      // --------------------------------------------------------
      // New message received (inbound) or sent (outbound echo)
      // --------------------------------------------------------
      case "messages.upsert": {
        const { key, message, messageTimestamp, pushName } = payload.data

        // Ignore outbound echo — we handle outbound in the sendMessageAction
        if (key.fromMe) break

        // Ignore group messages
        if (isGroupJid(key.remoteJid)) break

        const phoneNumber = formatPhoneNumber(key.remoteJid)
        const mid         = key.id
        const content     = evolution.extractTextContent(payload.data)
        const senderName  = pushName ?? phoneNumber
        const msgTimestamp = new Date(messageTimestamp * 1000).toISOString()

        // Idempotency check: skip if we already processed this message ID
        const { data: existingMsg } = await supabase
          .from("mensagens_whatsapp")
          .select("id")
          .eq("mid", mid)
          .single()

        if (existingMsg) break

        // Find or create the conversation
        let { data: conversa } = await supabase
          .from("conversas_whatsapp")
          .select("id, vendedor_id, status, unread_count")
          .eq("numero_cliente", phoneNumber)
          .in("status", ["ativa", "queued"])
          .single()

        if (!conversa) {
          // New conversation — insert and distribute
          const { data: newConversa, error: insertError } = await supabase
            .from("conversas_whatsapp")
            .insert({
              numero_cliente:       phoneNumber,
              nome_cliente:         senderName,
              ultima_mensagem:      content,
              ultima_mensagem_time: msgTimestamp,
              unread_count:         1,
            })
            .select()
            .single()

          if (insertError) {
            // Partial unique index violation: conversation was created by a concurrent request
            // Re-fetch the existing conversation
            const { data: existingConversa } = await supabase
              .from("conversas_whatsapp")
              .select("id, vendedor_id, status, unread_count")
              .eq("numero_cliente", phoneNumber)
              .in("status", ["ativa", "queued"])
              .single()

            conversa = existingConversa
          } else {
            conversa = newConversa

            // Distribute to available seller
            if (conversa) {
              await distributeConversation(supabase, conversa.id)
            }
          }
        } else {
          // Update existing conversation's last message + unread count
          await supabase
            .from("conversas_whatsapp")
            .update({
              ultima_mensagem:      content,
              ultima_mensagem_time: msgTimestamp,
              unread_count:         (conversa.unread_count ?? 0) + 1,
              ...(conversa.status === "encerrada" ? { status: "ativa" } : {}),
            })
            .eq("id", conversa.id)
        }

        // Insert the inbound message
        if (conversa) {
          await supabase.from("mensagens_whatsapp").insert({
            conversa_id: conversa.id,
            direcao:     "inbound",
            conteudo:    content,
            mid,
            status:      "entregue",
            timestamp:   msgTimestamp,
          })
        }
        break
      }

      // --------------------------------------------------------
      // Message status update (delivered, read, failed)
      // --------------------------------------------------------
      case "messages.update": {
        const mid       = payload.data.key?.id
        const newStatus = payload.data.update?.status?.toLowerCase()

        if (mid && newStatus) {
          const statusMap: Record<string, string> = {
            delivery_ack: "entregue",
            read:         "lida",
            played:       "lida",
            error:        "falha",
          }

          await supabase
            .from("mensagens_whatsapp")
            .update({ status: (statusMap[newStatus] ?? newStatus) as never })
            .eq("mid", mid)
        }
        break
      }

      // --------------------------------------------------------
      // Instance connection state changed
      // --------------------------------------------------------
      case "connection.update": {
        const state = (payload.data as Record<string, unknown>)["state"] as string | undefined
        if (state) {
          await supabase
            .from("configuracoes_whatsapp")
            .update({ status: state === "open" ? "ativo" : "inativo" })
            .eq("instance_name", payload.instance)
        }
        break
      }

      default:
        // Silently ignore other events (qrcode.updated, etc.)
        break
    }
  } catch (err) {
    console.error("[Webhook] Processing error:", err)
    // Return 200 to prevent Evolution API from retrying indefinitely
    // The error is logged for debugging but we don't want a retry storm
    return NextResponse.json({ ok: false, error: "Processing failed" }, { status: 200 })
  }

  return NextResponse.json({ ok: true })
}

// Evolution API sends a GET request to verify webhook URL during setup
export async function GET() {
  return NextResponse.json({ status: "webhook active" })
}
