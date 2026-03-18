-- ============================================================
-- Migration 014: Make handle_new_user self-sufficient
-- If organization_id is missing from metadata (e.g. user created
-- via Supabase dashboard), auto-create an org so no vendedor
-- ever lands with organization_id = NULL.
-- Run AFTER 013_fix_misassigned_user.sql
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Read organization_id from metadata (passed by /register flow)
  v_org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;

  -- Try to link existing vendedor pre-created by an admin (by email)
  UPDATE public.vendedores
    SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL;

  IF NOT FOUND THEN
    -- Auto-registration: if no org_id in metadata, create one now
    IF v_org_id IS NULL THEN
      INSERT INTO public.organizacoes (nome, slug, plano)
      VALUES (
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'org-' || substr(gen_random_uuid()::text, 1, 8),
        'free'
      )
      RETURNING id INTO v_org_id;
    END IF;

    INSERT INTO public.vendedores (user_id, organization_id, nome, email, role)
    VALUES (
      NEW.id,
      v_org_id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.email,
      'admin'
    )
    ON CONFLICT (email) DO UPDATE
      SET user_id = EXCLUDED.user_id,
          organization_id = COALESCE(vendedores.organization_id, EXCLUDED.organization_id)
      WHERE vendedores.user_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;
