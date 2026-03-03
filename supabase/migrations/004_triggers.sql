-- ============================================================
-- Migration 004: Triggers
-- Run AFTER 003_functions.sql
-- ============================================================

-- ============================================================
-- Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vendedores_updated_at ON public.vendedores;
CREATE TRIGGER trg_vendedores_updated_at
  BEFORE UPDATE ON public.vendedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_conversas_updated_at ON public.conversas_whatsapp;
CREATE TRIGGER trg_conversas_updated_at
  BEFORE UPDATE ON public.conversas_whatsapp
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Auto-decrement conversas_ativas when a conversation is closed
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_conversation_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- When conversation transitions FROM active/queued TO closed/archived
  IF OLD.status IN ('ativa', 'queued')
     AND NEW.status IN ('encerrada', 'arquivada')
     AND OLD.vendedor_id IS NOT NULL THEN
    UPDATE public.vendedores
      SET conversas_ativas = GREATEST(0, conversas_ativas - 1)
    WHERE id = OLD.vendedor_id;
  END IF;

  -- When conversation is re-opened (e.g. from arquivada back to ativa)
  IF OLD.status IN ('encerrada', 'arquivada')
     AND NEW.status = 'ativa'
     AND NEW.vendedor_id IS NOT NULL THEN
    UPDATE public.vendedores
      SET conversas_ativas = conversas_ativas + 1
    WHERE id = NEW.vendedor_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_conversa_status_change ON public.conversas_whatsapp;
CREATE TRIGGER trg_conversa_status_change
  AFTER UPDATE OF status ON public.conversas_whatsapp
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_conversation_status_change();

-- ============================================================
-- Enable Realtime for these tables
-- Run in Supabase Dashboard: Database > Replication
-- Or execute:
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.conversas_whatsapp;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_whatsapp;
