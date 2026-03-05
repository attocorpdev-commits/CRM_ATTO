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

  const n8nUrl = (formData.get("n8n_webhook_url") as string)?.trim() || null

  const payload = {
    nome_conta:        formData.get("nome_conta") as string,
    evolution_api_url: (formData.get("evolution_api_url") as string).replace(/\/$/, ""),
    evolution_api_key: formData.get("evolution_api_key") as string,
    instance_name:     formData.get("instance_name") as string,
    n8n_webhook_url:   n8nUrl,
  }

  if (!payload.nome_conta || !payload.evolution_api_url || !payload.evolution_api_key || !payload.instance_name) {
    return { error: "Todos os campos são obrigatórios" }
  }

  const serviceClient = createServiceClient()
  const { data: existing } = await serviceClient
    .from("configuracoes_whatsapp")
    .select("id")
    .limit(1)
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

  // Auto-create the instance in Evolution API
  try {
    const client = new EvolutionApiClient(
      payload.evolution_api_url,
      payload.evolution_api_key,
      payload.instance_name
    )
    await client.createInstance(payload.instance_name)
  } catch (err) {
    // Instance may already exist — ignore 409 conflict, surface other errors
    const msg = (err as Error).message ?? ""
    if (!msg.includes("409") && !msg.includes("already") && !msg.includes("exists")) {
      revalidatePath("/configuracoes")
      return { success: true, instanceError: msg }
    }
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

    // Store the webhook URL in DB
    const supabase = createServiceClient()
    const { data: config } = await supabase
      .from("configuracoes_whatsapp")
      .select("id")
      .limit(1)
      .single()

    if (config) {
      await supabase
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

