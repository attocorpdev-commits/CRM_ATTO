-- ============================================================
-- Migration 005: Remove capacity limit from conversation assignment
-- Run in Supabase SQL Editor
-- ============================================================

-- Update assign_conversation to remove the capacity check
-- Conversations are now distributed to the least-loaded active seller
-- without any upper limit per seller.
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
