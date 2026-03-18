-- ============================================================
-- Migration 013: Fix misassigned vendedor (wrong organization)
-- Run AFTER 012_backfill_organization_id.sql
-- ============================================================
DO $$
DECLARE
  v_new_org_id UUID;
  v_user_email TEXT := 'j597009008@gmail.com';
BEGIN
  -- Only proceed if vendedor exists
  IF NOT EXISTS (
    SELECT 1 FROM public.vendedores WHERE email = v_user_email
  ) THEN
    RAISE NOTICE 'User not found, skipping.';
    RETURN;
  END IF;

  -- Create a dedicated organization for this user
  INSERT INTO public.organizacoes (nome, slug, plano)
  VALUES (
    'Organização ' || split_part(v_user_email, '@', 1),
    'org-' || substr(gen_random_uuid()::text, 1, 8),
    'free'
  )
  RETURNING id INTO v_new_org_id;

  -- Update their vendedor to the new org
  UPDATE public.vendedores
    SET organization_id = v_new_org_id
  WHERE email = v_user_email;

  RAISE NOTICE 'User % moved to new org %', v_user_email, v_new_org_id;
END $$;
