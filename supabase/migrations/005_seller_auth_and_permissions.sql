-- ============================================================
-- Migration 005: Seller Auth & Page Permissions
-- Run AFTER 004_triggers.sql
-- ============================================================

-- ============================================================
-- Add permissions column to vendedores
-- JSONB array: ["conversas"], ["conversas","dashboard"], etc.
-- ============================================================
ALTER TABLE public.vendedores
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '["conversas"]';

-- ============================================================
-- Update handle_new_user() to link existing vendedor by email
-- instead of creating a duplicate row
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to link to an existing vendedor row (created by admin) by email match
  UPDATE public.vendedores
    SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL;

  -- If no existing row was updated, create a fresh one (self-registration path)
  IF NOT FOUND THEN
    INSERT INTO public.vendedores (user_id, nome, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'role', 'vendedor')
    )
    ON CONFLICT (email) DO UPDATE
      SET user_id = EXCLUDED.user_id
      WHERE vendedores.user_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;
