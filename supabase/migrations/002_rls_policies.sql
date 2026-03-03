-- ============================================================
-- Migration 002: Row-Level Security Policies
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.vendedores             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas_whatsapp     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_whatsapp     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_whatsapp ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: get the authenticated user's role
-- STABLE + SECURITY DEFINER so it bypasses RLS on vendedores
-- when called from within a policy
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.vendedores
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Helper function: get the authenticated user's vendedor id
CREATE OR REPLACE FUNCTION public.get_my_vendedor_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.vendedores
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================
-- vendedores policies
-- ============================================================
DROP POLICY IF EXISTS "admin_all_vendedores"  ON public.vendedores;
DROP POLICY IF EXISTS "vendedor_own_record"   ON public.vendedores;

CREATE POLICY "admin_all_vendedores" ON public.vendedores
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "vendedor_own_record" ON public.vendedores
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "vendedor_update_own" ON public.vendedores
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- conversas_whatsapp policies
-- ============================================================
DROP POLICY IF EXISTS "admin_all_conversas"    ON public.conversas_whatsapp;
DROP POLICY IF EXISTS "vendedor_own_conversas" ON public.conversas_whatsapp;

CREATE POLICY "admin_all_conversas" ON public.conversas_whatsapp
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "vendedor_own_conversas" ON public.conversas_whatsapp
  FOR ALL
  USING (vendedor_id = public.get_my_vendedor_id())
  WITH CHECK (vendedor_id = public.get_my_vendedor_id());

-- ============================================================
-- mensagens_whatsapp policies
-- ============================================================
DROP POLICY IF EXISTS "admin_all_mensagens"    ON public.mensagens_whatsapp;
DROP POLICY IF EXISTS "vendedor_own_mensagens" ON public.mensagens_whatsapp;

CREATE POLICY "admin_all_mensagens" ON public.mensagens_whatsapp
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "vendedor_own_mensagens" ON public.mensagens_whatsapp
  FOR ALL
  USING (
    conversa_id IN (
      SELECT id FROM public.conversas_whatsapp
      WHERE vendedor_id = public.get_my_vendedor_id()
    )
  )
  WITH CHECK (
    conversa_id IN (
      SELECT id FROM public.conversas_whatsapp
      WHERE vendedor_id = public.get_my_vendedor_id()
    )
  );

-- ============================================================
-- configuracoes_whatsapp policies (admin only)
-- ============================================================
DROP POLICY IF EXISTS "admin_all_config" ON public.configuracoes_whatsapp;

CREATE POLICY "admin_all_config" ON public.configuracoes_whatsapp
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');
