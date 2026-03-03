"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
})

export interface ActionResult {
  error?: string
}

export async function loginAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: "E-mail ou senha incorretos" }
  }

  redirect("/")
}
