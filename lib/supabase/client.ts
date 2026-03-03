import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database.types"

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Returns a singleton Supabase browser client.
 * Use ONLY in Client Components and React hooks ("use client").
 */
export function createClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
