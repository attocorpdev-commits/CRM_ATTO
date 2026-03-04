-- ============================================================
-- Migration 006: Superadmin Role
-- Run AFTER 005_seller_auth_and_permissions.sql
-- ============================================================

-- ============================================================
-- Update role constraint to include 'superadmin'
-- ============================================================
ALTER TABLE public.vendedores DROP CONSTRAINT IF EXISTS vendedores_role_check;
ALTER TABLE public.vendedores ADD CONSTRAINT vendedores_role_check
  CHECK (role IN ('superadmin', 'admin', 'vendedor'));

-- ============================================================
-- Ensure helper functions exist (from migration 002)
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
-- Enable RLS on all tables (idempotent)
-- ============================================================
ALTER TABLE public.vendedores             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas_whatsapp     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_whatsapp     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_whatsapp ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Recreate RLS policies to accept both 'admin' and 'superadmin'
-- ============================================================

-- vendedores policies
DROP POLICY IF EXISTS "admin_all_vendedores" ON public.vendedores;
CREATE POLICY "admin_all_vendedores" ON public.vendedores
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));

-- conversas_whatsapp policies
DROP POLICY IF EXISTS "admin_all_conversas" ON public.conversas_whatsapp;
CREATE POLICY "admin_all_conversas" ON public.conversas_whatsapp
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));

-- mensagens_whatsapp policies
DROP POLICY IF EXISTS "admin_all_mensagens" ON public.mensagens_whatsapp;
CREATE POLICY "admin_all_mensagens" ON public.mensagens_whatsapp
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));

-- configuracoes_whatsapp policies
DROP POLICY IF EXISTS "admin_all_config" ON public.configuracoes_whatsapp;
CREATE POLICY "admin_all_config" ON public.configuracoes_whatsapp
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));
