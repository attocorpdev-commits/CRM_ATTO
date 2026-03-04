import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createEvolutionClient } from "@/lib/whatsapp/evolution-api"
import { isAdminOrAbove } from "@/lib/roles"

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

    if (!isAdminOrAbove(vendedor?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const evolution = createEvolutionClient()
    const result    = await evolution.fetchQRCode()

    // When instance is already connected, Evolution API returns { instance: { state: "open" } }
    const state = (result as Record<string, unknown>).instance
      ? ((result as Record<string, Record<string, string>>).instance.state ?? null)
      : null

    return NextResponse.json({
      base64: result.base64 ?? null,
      code:   result.code   ?? null,
      state:  state,
    })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
