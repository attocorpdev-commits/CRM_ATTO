-- ============================================================
-- Migration 009: Multi-Tenancy — Schema & Colunas
-- Adiciona suporte a múltiplas organizações (SaaS)
-- Run AFTER 008_listas_contatos.sql
-- ============================================================

-- ============================================================
-- 1. Tabela organizacoes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organizacoes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  plano      TEXT NOT NULL DEFAULT 'free'
               CHECK (plano IN ('free', 'pro', 'enterprise')),
  status     TEXT NOT NULL DEFAULT 'ativo'
               CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organizacoes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. organization_id nas tabelas principais
-- ============================================================
ALTER TABLE public.vendedores
  ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES public.organizacoes(id) ON DELETE CASCADE;

ALTER TABLE public.conversas_whatsapp
  ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES public.organizacoes(id) ON DELETE CASCADE;

ALTER TABLE public.configuracoes_whatsapp
  ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES public.organizacoes(id) ON DELETE CASCADE;

ALTER TABLE public.disparos
  ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES public.organizacoes(id) ON DELETE CASCADE;

ALTER TABLE public.listas_contatos
  ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES public.organizacoes(id) ON DELETE CASCADE;

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_vendedores_org_id  ON public.vendedores(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversas_org_id   ON public.conversas_whatsapp(organization_id);
CREATE INDEX IF NOT EXISTS idx_config_org_id      ON public.configuracoes_whatsapp(organization_id);
CREATE INDEX IF NOT EXISTS idx_disparos_org_id    ON public.disparos(organization_id);
CREATE INDEX IF NOT EXISTS idx_listas_org_id      ON public.listas_contatos(organization_id);

-- ============================================================
-- 4. Atualizar índice único de conversa ativa por número
--    Agora escopa por organização: dois clientes diferentes
--    podem ter conversa ativa com o mesmo número externo.
-- ============================================================
DROP INDEX IF EXISTS idx_unique_active_conversa_per_number;

CREATE UNIQUE INDEX idx_unique_active_conversa_per_number
  ON public.conversas_whatsapp (numero_cliente, organization_id)
  WHERE status IN ('ativa', 'queued');

-- ============================================================
-- 5. Função helper: retorna o organization_id do usuário logado
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id FROM public.vendedores
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================
-- 6. RLS na tabela organizacoes
-- ============================================================
DROP POLICY IF EXISTS "org_members_view_own" ON public.organizacoes;
CREATE POLICY "org_members_view_own" ON public.organizacoes
  FOR SELECT
  USING (id = public.get_my_organization_id());

DROP POLICY IF EXISTS "org_admin_manage" ON public.organizacoes;
CREATE POLICY "org_admin_manage" ON public.organizacoes
  FOR ALL
  USING (
    id = public.get_my_organization_id()
    AND public.get_my_role() IN ('admin', 'superadmin')
  )
  WITH CHECK (
    id = public.get_my_organization_id()
    AND public.get_my_role() IN ('admin', 'superadmin')
  );
