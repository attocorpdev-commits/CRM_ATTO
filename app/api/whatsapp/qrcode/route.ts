import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createEvolutionClient } from "@/lib/whatsapp/evolution-api"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can get the QR code
    const { data: vendedor } = await supabase
      .from("vendedores")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (vendedor?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const evolution = createEvolutionClient()
    const result    = await evolution.fetchQRCode()

    return NextResponse.json({
      base64: result.base64 ?? null,
      code:   result.code   ?? null,
    })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
