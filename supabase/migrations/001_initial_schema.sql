-- ============================================================
-- Migration 001: Initial Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. vendedores (sellers/agents)
CREATE TABLE IF NOT EXISTS public.vendedores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nome              TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  whatsapp_number   TEXT,
  status            TEXT NOT NULL DEFAULT 'ativo'
                      CHECK (status IN ('ativo', 'inativo', 'pausado')),
  role              TEXT NOT NULL DEFAULT 'vendedor'
                      CHECK (role IN ('admin', 'vendedor')),
  capacidade_maxima INTEGER NOT NULL DEFAULT 10,
  conversas_ativas  INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. conversas_whatsapp
CREATE TABLE IF NOT EXISTS public.conversas_whatsapp (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_cliente        TEXT NOT NULL,
  nome_cliente          TEXT,
  vendedor_id           UUID REFERENCES public.vendedores(id) ON DELETE SET NULL,
  status                TEXT NOT NULL DEFAULT 'ativa'
                          CHECK (status IN ('ativa', 'encerrada', 'arquivada', 'queued')),
  estagio               TEXT NOT NULL DEFAULT 'novo'
                          CHECK (estagio IN ('novo', 'contatado', 'qualificado', 'proposta', 'fechado')),
  ultima_mensagem       TEXT,
  ultima_mensagem_time  TIMESTAMPTZ,
  unread_count          INTEGER NOT NULL DEFAULT 0,
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. mensagens_whatsapp
CREATE TABLE IF NOT EXISTS public.mensagens_whatsapp (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES public.conversas_whatsapp(id) ON DELETE CASCADE,
  direcao     TEXT NOT NULL CHECK (direcao IN ('inbound', 'outbound')),
  conteudo    TEXT,
  mid         TEXT UNIQUE, -- Evolution API message ID (idempotency key)
  status      TEXT NOT NULL DEFAULT 'enviada'
                CHECK (status IN ('enviada', 'entregue', 'lida', 'falha')),
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  anexos      JSONB DEFAULT '[]'
);

-- 4. configuracoes_whatsapp
CREATE TABLE IF NOT EXISTS public.configuracoes_whatsapp (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_conta        TEXT NOT NULL,
  evolution_api_url TEXT NOT NULL,
  evolution_api_key TEXT NOT NULL,
  instance_name     TEXT NOT NULL UNIQUE,
  numero_whatsapp   TEXT,
  status            TEXT NOT NULL DEFAULT 'inativo'
                      CHECK (status IN ('ativo', 'inativo')),
  webhook_url       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_vendedores_user_id    ON public.vendedores(user_id);
CREATE INDEX IF NOT EXISTS idx_vendedores_status     ON public.vendedores(status);
CREATE INDEX IF NOT EXISTS idx_conversas_vendedor_id ON public.conversas_whatsapp(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_conversas_status      ON public.conversas_whatsapp(status);
CREATE INDEX IF NOT EXISTS idx_conversas_numero      ON public.conversas_whatsapp(numero_cliente);
CREATE INDEX IF NOT EXISTS idx_conversas_updated_at  ON public.conversas_whatsapp(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa_id ON public.mensagens_whatsapp(conversa_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_mid         ON public.mensagens_whatsapp(mid);

-- Partial unique index: prevents duplicate active conversations per phone number
-- Solves race condition when two messages arrive simultaneously from same number
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_conversa_per_number
  ON public.conversas_whatsapp (numero_cliente)
  WHERE status IN ('ativa', 'queued');
