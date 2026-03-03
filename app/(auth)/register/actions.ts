"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
})

export interface ActionResult {
  error?: string
}

export async function registerAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.name,
        role: "vendedor", // default role; admin must be set manually in DB
      },
    },
  })

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Este e-mail já está cadastrado" }
    }
    return { error: error.message }
  }

  // The handle_new_user() DB trigger creates the vendedores row automatically
  redirect("/")
}
