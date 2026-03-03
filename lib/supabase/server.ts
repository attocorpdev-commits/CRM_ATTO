import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/database.types"

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
 * Respects RLS based on the authenticated user's JWT.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore in Server Components — cookies can only be set in Server Actions/Route Handlers
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase client with the service role key.
 * BYPASSES RLS — use ONLY in Route Handlers (webhook, etc.) and trusted Server Actions.
 * NEVER expose this client to the browser or pass to Client Components.
 *
 * Uses @supabase/supabase-js directly (no cookies needed for service role).
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession:  false,
        autoRefreshToken: false,
      },
    }
  )
}
