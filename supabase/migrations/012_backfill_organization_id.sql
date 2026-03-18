-- ============================================================
-- Migration 012: Backfill organization_id for existing data
-- Run AFTER 011_handle_new_user_multitenancy.sql
-- ============================================================

-- 1. If no organization exists yet, create one for the existing tenant
INSERT INTO public.organizacoes (nome, slug, plano)
SELECT 'Organização Principal', 'organizacao-principal-' || substr(gen_random_uuid()::text, 1, 8), 'pro'
WHERE NOT EXISTS (SELECT 1 FROM public.organizacoes LIMIT 1);

-- 2. Backfill organization_id in all tables for existing data
DO $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT id INTO v_org_id FROM public.organizacoes ORDER BY created_at LIMIT 1;

  -- 3. Set organization_id on all vendedores that don't have it
  UPDATE public.vendedores
    SET organization_id = v_org_id
  WHERE organization_id IS NULL;

  -- 4. Backfill conversas_whatsapp
  UPDATE public.conversas_whatsapp c
    SET organization_id = v.organization_id
  FROM public.vendedores v
  WHERE c.vendedor_id = v.id
    AND c.organization_id IS NULL;

  -- 5. Backfill disparos
  UPDATE public.disparos d
    SET organization_id = v.organization_id
  FROM public.vendedores v
  WHERE d.vendedor_id = v.id
    AND d.organization_id IS NULL;

  -- 6. Backfill listas_contatos
  UPDATE public.listas_contatos l
    SET organization_id = v.organization_id
  FROM public.vendedores v
  WHERE l.vendedor_id = v.id
    AND l.organization_id IS NULL;

  -- 7. Fix role for the oldest existing user (founder) who may have gotten
  --    'vendedor' by default from the old handle_new_user trigger (migration 003).
  --    Only promotes the very first registered user to avoid changing intentional vendors.
  UPDATE public.vendedores
    SET role = 'admin'
  WHERE id = (
    SELECT id FROM public.vendedores
    WHERE organization_id = v_org_id
      AND user_id IS NOT NULL
    ORDER BY created_at
    LIMIT 1
  )
  AND role = 'vendedor';

END $$;
