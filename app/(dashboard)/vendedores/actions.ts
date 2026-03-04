"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import crypto from "crypto"

const vendedorSchema = z.object({
  nome:              z.string().min(2),
  email:             z.string().email(),
  whatsapp_number:   z.string().optional(),
  status:            z.enum(["ativo", "inativo", "pausado"]).default("ativo"),
  role:              z.enum(["superadmin", "admin", "vendedor"]).default("vendedor"),
  capacidade_maxima: z.coerce.number().min(1).max(100).default(10),
  permissions:       z.array(z.string()).default(["conversas"]),
})

function generateTempPassword(): string {
  return crypto.randomBytes(9).toString("base64url").slice(0, 12)
}

export async function createVendedorAction(
  _prev: unknown,
  formData: FormData
) {
  const rawPermissions = formData.getAll("permissions") as string[]
  const permissions = rawPermissions.length > 0
    ? [...new Set(["conversas", ...rawPermissions])]
    : ["conversas"]

  const parsed = vendedorSchema.safeParse({
    nome:              formData.get("nome"),
    email:             formData.get("email"),
    whatsapp_number:   formData.get("whatsapp_number") || undefined,
    status:            formData.get("status") || "ativo",
    role:              formData.get("role") || "vendedor",
    capacidade_maxima: formData.get("capacidade_maxima") || 10,
    permissions,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // 1. Insert vendedor row (user_id = NULL for now)
  const supabase = await createClient()
  const { data: vendedor, error: insertError } = await supabase
    .from("vendedores")
    .insert(parsed.data)
    .select("id")
    .single()

  if (insertError) {
    if (insertError.code === "23505") return { error: "Este e-mail já está cadastrado" }
    return { error: insertError.message }
  }

  // 2. Create auth user via admin API (service client, bypasses RLS)
  const tempPassword = generateTempPassword()
  const serviceClient = createServiceClient()

  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email: parsed.data.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.nome,
      role: parsed.data.role,
    },
  })

  if (authError) {
    // Rollback: delete the vendedor row we just created
    await serviceClient.from("vendedores").delete().eq("id", vendedor.id)
    return { error: `Erro ao criar conta de acesso: ${authError.message}` }
  }

  // 3. Safety net: explicitly set user_id (trigger should have done this already)
  await serviceClient
    .from("vendedores")
    .update({ user_id: authData.user.id })
    .eq("id", vendedor.id)

  revalidatePath("/vendedores")
  return {
    success: true,
    tempPassword,
    email: parsed.data.email,
  }
}

export async function updateVendedorAction(
  id: string,
  _prev: unknown,
  formData: FormData
) {
  const parsed = vendedorSchema.safeParse({
    nome:              formData.get("nome"),
    email:             formData.get("email"),
    whatsapp_number:   formData.get("whatsapp_number") || undefined,
    status:            formData.get("status") || "ativo",
    role:              formData.get("role") || "vendedor",
    capacidade_maxima: formData.get("capacidade_maxima") || 10,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("vendedores")
    .update(parsed.data)
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/vendedores")
  return { success: true }
}

export async function toggleVendedorStatusAction(
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

  revalidatePath("/vendedores")
  return { success: true }
}

export async function deleteVendedorAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("vendedores")
    .update({ status: "inativo" }) // soft delete: mark as inactive
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/vendedores")
  return { success: true }
}
