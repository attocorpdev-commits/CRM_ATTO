"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  empresa: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
})

export interface ActionResult {
  error?: string
}

function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
    + "-" + Math.random().toString(36).slice(2, 7)
}

export async function registerAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    empresa: formData.get("empresa"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // 1. Criar a organização antes do signup (usa service client — sem auth ainda)
  const serviceClient = createServiceClient()
  const { data: org, error: orgError } = await serviceClient
    .from("organizacoes")
    .insert({
      nome: parsed.data.empresa,
      slug: generateSlug(parsed.data.empresa),
    })
    .select("id")
    .single()

  if (orgError) {
    return { error: "Erro ao criar organização: " + orgError.message }
  }

  // 2. Criar o usuário passando organization_id no metadata
  //    O trigger handle_new_user() cria o vendedor com role 'admin' e organization_id
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.name,
        organization_id: org.id,
      },
    },
  })

  if (error) {
    // Rollback: remover a organização criada
    await serviceClient.from("organizacoes").delete().eq("id", org.id)

    if (error.message.includes("already registered")) {
      return { error: "Este e-mail já está cadastrado" }
    }
    return { error: error.message }
  }

  // O trigger handle_new_user() cria o vendedor automaticamente como 'admin'
  redirect("/")
}
