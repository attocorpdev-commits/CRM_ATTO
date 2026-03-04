-- ============================================================
-- Migration 008: N8N Webhook Forward URL
-- Run AFTER 007_disparos.sql
-- ============================================================

ALTER TABLE public.configuracoes_whatsapp
  ADD COLUMN IF NOT EXISTS n8n_webhook_url TEXT;
