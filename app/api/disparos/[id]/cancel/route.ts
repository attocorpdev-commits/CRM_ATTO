import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verify the user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  // Use service client to bypass RLS for the update
  const serviceClient = createServiceClient()

  const { data, error } = await serviceClient
    .from("disparos")
    .update({ status: "cancelado", finished_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["pendente", "em_andamento"])
    .select("id")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Disparo não encontrado ou já finalizado" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
