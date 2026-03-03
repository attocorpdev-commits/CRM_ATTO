"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const vendedorSchema = z.object({
  nome:              z.string().min(2),
  email:             z.string().email(),
  whatsapp_number:   z.string().optional(),
  status:            z.enum(["ativo", "inativo", "pausado"]).default("ativo"),
  role:              z.enum(["admin", "vendedor"]).default("vendedor"),
  capacidade_maxima: z.coerce.number().min(1).max(100).default(10),
})

export async function createVendedorAction(
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
  const { error } = await supabase.from("vendedores").insert(parsed.data)

  if (error) {
    if (error.code === "23505") return { error: "Este e-mail já está cadastrado" }
    return { error: error.message }
  }

  revalidatePath("/vendedores")
  return { success: true }
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
