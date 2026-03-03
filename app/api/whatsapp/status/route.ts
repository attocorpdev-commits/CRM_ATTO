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

    const evolution = createEvolutionClient()
    const result    = await evolution.getConnectionState()

    return NextResponse.json({ state: result.instance?.state ?? "unknown" })
  } catch {
    return NextResponse.json({ state: "unknown" })
  }
}
