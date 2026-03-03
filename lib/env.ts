const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "EVOLUTION_API_URL",
  "EVOLUTION_API_KEY",
  "EVOLUTION_INSTANCE_NAME",
  "WEBHOOK_SECRET",
] as const

/**
 * Validates that all required environment variables are set.
 * Call this at startup (e.g. in next.config.ts instrumentation or route handlers).
 */
export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
      "Copy .env.example to .env.local and fill in the values."
    )
  }
}
