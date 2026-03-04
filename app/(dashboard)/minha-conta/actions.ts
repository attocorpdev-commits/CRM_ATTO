"use server"

import { createClient } from "@/lib/supabase/server"

export async function changePasswordAction(
  _prev: unknown,
  formData: FormData
) {
  const password = (formData.get("password") as string)?.trim()
  const confirmPassword = (formData.get("confirm_password") as string)?.trim()

  if (!password || password.length < 6) {
    return { error: "A senha deve ter no mínimo 6 caracteres" }
  }

  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem" }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
