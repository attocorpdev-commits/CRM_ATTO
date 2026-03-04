import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: listas } = await supabase
    .from("listas_contatos")
    .select("id, nome, total_contatos")
    .order("nome", { ascending: true })

  return NextResponse.json(listas ?? [])
}
