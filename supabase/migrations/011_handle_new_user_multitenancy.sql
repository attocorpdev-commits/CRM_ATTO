-- ============================================================
-- Migration 011: Atualizar handle_new_user para Multi-Tenancy
-- O trigger agora lê organization_id do user_metadata.
-- Novos usuários que se auto-cadastram recebem role 'admin'.
-- Run AFTER 010_rls_multitenancy.sql
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
  -- Lê o organization_id passado pelo Server Action de registro
  v_org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;

  -- Tenta vincular a um vendedor existente criado pelo admin (por email)
  UPDATE public.vendedores
    SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL;

  -- Se não encontrou vendedor existente: auto-cadastro → cria registro como admin
  IF NOT FOUND THEN
    INSERT INTO public.vendedores (user_id, organization_id, nome, email, role)
    VALUES (
      NEW.id,
      v_org_id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.email,
      'admin'  -- fundador da organização é sempre admin
    )
    ON CONFLICT (email) DO UPDATE
      SET user_id = EXCLUDED.user_id,
          organization_id = COALESCE(vendedores.organization_id, EXCLUDED.organization_id)
      WHERE vendedores.user_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;
