# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun dev          # Start dev server at http://localhost:3000
bun build        # Production build
bun lint         # ESLint

# Install a new package
bun add <package>
bun add -d <package>   # dev dependency

# shadcn/ui components
bunx shadcn@latest add <component-name>

# Supabase type generation (after DB schema changes)
bunx supabase gen types typescript --project-id YOUR_ID > types/database.types.ts
```

## Architecture

### Stack
- **Next.js 16** App Router, TypeScript, Tailwind v4
- **Supabase** — database (PostgreSQL), auth, realtime subscriptions
- **Evolution API** — self-hosted open-source WhatsApp gateway
- **shadcn/ui** — component library (Radix UI + Tailwind)

### Route Structure
```
app/
├── (auth)/          # Public auth pages (login, register) — no sidebar
├── (dashboard)/     # Protected app — requires auth, has sidebar layout
│   ├── page.tsx         → / (metrics overview)
│   ├── conversas/       → /conversas (conversation list + chat)
│   │   └── [id]/        → /conversas/:id (chat detail)
│   ├── vendedores/      → /vendedores (admin only)
│   ├── relatorios/      → /relatorios
│   └── configuracoes/   → /configuracoes (admin only)
└── api/whatsapp/
    ├── webhook/     → POST /api/whatsapp/webhook (Evolution API events)
    ├── status/      → GET  /api/whatsapp/status  (connection state)
    └── qrcode/      → GET  /api/whatsapp/qrcode  (QR code for connecting)
```

### Supabase Client Pattern (critical)
- `lib/supabase/client.ts` — browser singleton, use in `"use client"` components and hooks
- `lib/supabase/server.ts` — `createClient()` for Server Components/Actions; `createServiceClient()` bypasses RLS — only use in Route Handlers and trusted Server Actions
- `lib/supabase/middleware.ts` — session refresh; always uses `getUser()` not `getSession()`
- `proxy.ts` (root) — entry point for the auth proxy; in Next.js 16 this replaces the deprecated `middleware.ts`
- **Never** use `SUPABASE_SERVICE_ROLE_KEY` in client-side code

### Webhook Security
`/app/api/whatsapp/webhook/route.ts` — HMAC-SHA256 signature verification using `WEBHOOK_SECRET`.
Must call `req.text()` BEFORE any `JSON.parse()` — body stream can only be consumed once.

### Conversation Distribution
`lib/distribution/conversation-distributor.ts` — assigns inbound conversations to sellers with lowest load ratio. Uses the `assign_conversation` Postgres RPC with `SELECT FOR UPDATE SKIP LOCKED` to prevent race conditions. Only call from server-side (webhook route handler).

### Realtime Hooks
- `hooks/use-conversations.ts` — subscribes to `conversas_whatsapp` table
- `hooks/use-messages.ts` — subscribes to `mensagens_whatsapp` filtered by `conversa_id`
- Always cleanup channels in `useEffect` return (see existing hooks for pattern)

### Database Tables
`vendedores` → `conversas_whatsapp` → `mensagens_whatsapp`; `configuracoes_whatsapp` is standalone.
All tables have RLS enabled. `get_my_role()` and `get_my_vendedor_id()` are SECURITY DEFINER helper functions used in policies.

### Types
`types/database.types.ts` — manually maintained until connected to Supabase project; regenerate with `bunx supabase gen types` after schema changes. Convenience re-exports in `types/index.ts`.

## Environment Variables

Copy `.env.example` to `.env.local`. Required:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only, bypasses RLS
- `EVOLUTION_API_URL` / `EVOLUTION_API_KEY` / `EVOLUTION_INSTANCE_NAME` — Evolution API
- `WEBHOOK_SECRET` — used for HMAC verification of webhook payloads
- `NEXT_PUBLIC_APP_URL` — used to construct the webhook URL

## Database Migrations

SQL files in `supabase/migrations/` — run in order in Supabase SQL Editor:
1. `001_initial_schema.sql` — tables + indexes (including partial unique index preventing duplicate active conversations)
2. `002_rls_policies.sql` — RLS enable + all policies
3. `003_functions.sql` — `handle_new_user`, `assign_conversation`, `unassign_conversation`, `get_dashboard_metrics`
4. `004_triggers.sql` — `updated_at` auto-update + conversation status change counter trigger

After running migrations, enable Realtime in Supabase Dashboard for `conversas_whatsapp` and `mensagens_whatsapp`.
