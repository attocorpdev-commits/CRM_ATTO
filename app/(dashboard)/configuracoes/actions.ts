"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { createEvolutionClientFromConfig, EvolutionApiClient } from "@/lib/whatsapp/evolution-api"
import { isAdminOrAbove } from "@/lib/roles"
import { revalidatePath } from "next/cache"

export async function saveConfigAction(
  _prev: unknown,
  formData: FormData
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: vendedor }  = await supabase
    .from("vendedores")
    .select("id, role")
    .eq("user_id", user!.id)
    .single()

  if (!isAdminOrAbove((vendedor as { role?: string } | null)?.role)) return { error: "Acesso negado" }

  const { data: vendedorFull } = await supabase
    .from("vendedores")
    .select("organization_id")
    .eq("user_id", user!.id)
    .single()

  const organizationId = (vendedorFull as { organization_id?: string | null } | null)?.organization_id
  if (!organizationId) return { error: "Organização não encontrada" }

  const n8nUrl = (formData.get("n8n_webhook_url") as string)?.trim() || null

  // API credentials come from env vars — not exposed to the UI
  const apiUrl = (process.env.EVOLUTION_API_URL ?? "").replace(/\/$/, "")
  const apiKey = process.env.EVOLUTION_API_KEY ?? ""

  const payload = {
    nome_conta:        formData.get("nome_conta") as string,
    evolution_api_url: apiUrl,
    evolution_api_key: apiKey,
    instance_name:     formData.get("instance_name") as string,
    n8n_webhook_url:   n8nUrl,
    organization_id:   organizationId,
  }

  if (!payload.nome_conta || !payload.instance_name) {
    return { error: "Nome da conta e nome da instância são obrigatórios" }
  }

  if (!apiUrl || !apiKey) {
    return { error: "Variáveis de ambiente EVOLUTION_API_URL ou EVOLUTION_API_KEY não configuradas no servidor" }
  }

  const serviceClient = createServiceClient()
  // Busca config da organização atual (não usa LIMIT 1 global)
  const { data: existing } = await serviceClient
    .from("configuracoes_whatsapp")
    .select("id")
    .eq("organization_id", organizationId)
    .single()

  let error
  if (existing) {
    ;({ error } = await serviceClient
      .from("configuracoes_whatsapp")
      .update(payload)
      .eq("id", existing.id))
  } else {
    ;({ error } = await serviceClient
      .from("configuracoes_whatsapp")
      .insert(payload))
  }

  if (error) return { error: error.message }

  const client = new EvolutionApiClient(apiUrl, apiKey, payload.instance_name)

  // Create instance (ignore 409 — already exists)
  try {
    await client.createInstance(payload.instance_name)
  } catch (err) {
    const msg = (err as Error).message ?? ""
    if (!msg.includes("409") && !msg.includes("already") && !msg.includes("exists")) {
      revalidatePath("/configuracoes")
      return { success: true, instanceError: msg }
    }
  }

  // Auto-register webhook
  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`
    await client.setWebhook({
      url:               webhookUrl,
      webhook_by_events: false,
      webhook_base64:    true,
      events: [
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "SEND_MESSAGE",
        "CONNECTION_UPDATE",
        "QRCODE_UPDATED",
      ],
    })

    // Persist webhook URL in DB (scoped to the org that was just saved)
    const { data: config } = await serviceClient
      .from("configuracoes_whatsapp")
      .select("id")
      .eq("organization_id", organizationId)
      .single()

    if (config) {
      await serviceClient
        .from("configuracoes_whatsapp")
        .update({ webhook_url: webhookUrl })
        .eq("id", config.id)
    }
  } catch (err) {
    const msg = (err as Error).message ?? ""
    revalidatePath("/configuracoes")
    return { success: true, webhookError: msg }
  }

  revalidatePath("/configuracoes")
  return { success: true }
}

export async function registerWebhookAction() {
  try {
    const evolution  = await createEvolutionClientFromConfig()
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`

    await evolution.setWebhook({
      url:                webhookUrl,
      webhook_by_events:  false,
      webhook_base64:     true,
      events: [
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "SEND_MESSAGE",
        "CONNECTION_UPDATE",
        "QRCODE_UPDATED",
      ],
    })

    // Store the webhook URL in DB (scoped to current user's org)
    const authSupabase = await createClient()
    const { data: { user: authUser } } = await authSupabase.auth.getUser()
    const { data: authVendedor } = await authSupabase
      .from("vendedores")
      .select("organization_id")
      .eq("user_id", authUser!.id)
      .single()
    const authOrgId = (authVendedor as { organization_id?: string | null } | null)?.organization_id

    const serviceSupabase = createServiceClient()
    const configQuery = serviceSupabase
      .from("configuracoes_whatsapp")
      .select("id")
    const { data: config } = await (authOrgId
      ? configQuery.eq("organization_id", authOrgId).single()
      : configQuery.limit(1).single())

    if (config) {
      await serviceSupabase
        .from("configuracoes_whatsapp")
        .update({ webhook_url: webhookUrl })
        .eq("id", config.id)
    }

    revalidatePath("/configuracoes")
    return { success: true, webhookUrl }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

