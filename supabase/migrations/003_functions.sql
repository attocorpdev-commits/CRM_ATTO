-- ============================================================
-- Migration 003: PostgreSQL Functions & RPCs
-- Run AFTER 002_rls_policies.sql
-- ============================================================

-- ============================================================
-- Auto-create vendedor profile when a new user signs up
-- Triggered by auth.users INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.vendedores (user_id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'vendedor')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger: fires AFTER INSERT on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Atomic conversation assignment with locking
-- Prevents race conditions when multiple webhooks arrive simultaneously
-- Raises 'vendor_unavailable' if vendor is at capacity (caller must catch)
-- ============================================================
CREATE OR REPLACE FUNCTION public.assign_conversation(
  p_conversa_id UUID,
  p_vendedor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_vendor RECORD;
BEGIN
  -- Lock the vendor row; SKIP LOCKED means concurrent calls won't block
  SELECT * INTO v_vendor
  FROM public.vendedores
  WHERE id = p_vendedor_id
    AND status = 'ativo'
    AND conversas_ativas < capacidade_maxima
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'vendor_unavailable';
  END IF;

  UPDATE public.conversas_whatsapp
    SET vendedor_id = p_vendedor_id,
        status = 'ativa'
  WHERE id = p_conversa_id;

  UPDATE public.vendedores
    SET conversas_ativas = conversas_ativas + 1
  WHERE id = p_vendedor_id;
END;
$$;

-- ============================================================
-- Decrement active conversation counter when a conversation closes
-- Call this when status changes to 'encerrada' or 'arquivada'
-- ============================================================
CREATE OR REPLACE FUNCTION public.unassign_conversation(
  p_conversa_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_vendedor_id UUID;
BEGIN
  SELECT vendedor_id INTO v_vendedor_id
  FROM public.conversas_whatsapp
  WHERE id = p_conversa_id;

  IF v_vendedor_id IS NOT NULL THEN
    UPDATE public.vendedores
      SET conversas_ativas = GREATEST(0, conversas_ativas - 1)
    WHERE id = v_vendedor_id;
  END IF;
END;
$$;

-- ============================================================
-- Dashboard aggregate metrics helper (bypasses RLS for admin)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_conversas',     (SELECT COUNT(*) FROM public.conversas_whatsapp),
    'conversas_ativas',    (SELECT COUNT(*) FROM public.conversas_whatsapp WHERE status = 'ativa'),
    'conversas_queued',    (SELECT COUNT(*) FROM public.conversas_whatsapp WHERE status = 'queued'),
    'mensagens_hoje',      (SELECT COUNT(*) FROM public.mensagens_whatsapp
                            WHERE timestamp >= CURRENT_DATE),
    'vendedores_ativos',   (SELECT COUNT(*) FROM public.vendedores WHERE status = 'ativo'),
    'taxa_resposta_min',   (
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (
        (SELECT MIN(m2.timestamp) FROM public.mensagens_whatsapp m2
         WHERE m2.conversa_id = m.conversa_id AND m2.direcao = 'outbound')
        - m.timestamp
      )) / 60)::NUMERIC, 1)
      FROM public.mensagens_whatsapp m
      WHERE m.direcao = 'inbound'
        AND m.timestamp >= NOW() - INTERVAL '7 days'
    )
  ) INTO result;

  RETURN result;
END;
$$;
