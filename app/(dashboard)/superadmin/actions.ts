"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import crypto from "crypto"

const adminSchema = z.object({
  nome:  z.string().min(2),
  email: z.string().email(),
})

function generateTempPassword(): string {
  return crypto.randomBytes(9).toString("base64url").slice(0, 12)
}

export async function createAdminAction(
  _prev: unknown,
  formData: FormData
) {
  const parsed = adminSchema.safeParse({
    nome:  formData.get("nome"),
    email: formData.get("email"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const serviceClient = createServiceClient()

  // 1. Insert vendedor row with role=admin
  const { data: vendedor, error: insertError } = await serviceClient
    .from("vendedores")
    .insert({
      nome:  parsed.data.nome,
      email: parsed.data.email,
      role:  "admin",
    })
    .select("id")
    .single()

  if (insertError) {
    if (insertError.code === "23505") return { error: "Este e-mail já está cadastrado" }
    return { error: insertError.message }
  }

  // 2. Create auth user
  const tempPassword = generateTempPassword()

  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email: parsed.data.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.nome,
      role: "admin",
    },
  })

  if (authError) {
    await serviceClient.from("vendedores").delete().eq("id", vendedor.id)
    return { error: `Erro ao criar conta de acesso: ${authError.message}` }
  }

  // 3. Safety net: link user_id
  await serviceClient
    .from("vendedores")
    .update({ user_id: authData.user.id })
    .eq("id", vendedor.id)

  revalidatePath("/superadmin")
  return {
    success: true,
    tempPassword,
    email: parsed.data.email,
  }
}

export async function updateAdminAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  const parsed = adminSchema.safeParse({
    nome:  formData.get("nome"),
    email: formData.get("email"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("vendedores")
    .update({ nome: parsed.data.nome, email: parsed.data.email })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/superadmin")
  return { success: true }
}

export async function toggleAdminStatusAction(
  id: string,
  currentStatus: string
) {
  const supabase = await createClient()
  const newStatus = currentStatus === "ativo" ? "pausado" : "ativo"

  const { error } = await supabase
    .from("vendedores")
    .update({ status: newStatus })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/superadmin")
  return { success: true }
}

export async function deleteAdminAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("vendedores")
    .update({ status: "inativo" })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/superadmin")
  return { success: true }
}

export async function resetPasswordAction(userId: string) {
  if (!userId) return { error: "Admin sem conta de acesso vinculada" }

  const serviceClient = createServiceClient()
  const newPassword = generateTempPassword()

  const { error } = await serviceClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) return { error: `Erro ao resetar senha: ${error.message}` }

  return { success: true, newPassword }
}
