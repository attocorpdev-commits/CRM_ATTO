-- ============================================================
-- Migration 007: Disparos em Massa (Bulk WhatsApp Messaging)
-- Run AFTER 006_superadmin_role.sql
-- ============================================================

-- ============================================================
-- Table: disparos (broadcast campaigns)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.disparos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id     UUID NOT NULL REFERENCES public.vendedores(id) ON DELETE CASCADE,
  mensagem        TEXT NOT NULL,
  total_contatos  INTEGER NOT NULL DEFAULT 0,
  enviados        INTEGER NOT NULL DEFAULT 0,
  falhas          INTEGER NOT NULL DEFAULT 0,
  delay_segundos  INTEGER NOT NULL DEFAULT 300
                    CHECK (delay_segundos IN (5, 10, 15, 30, 60, 120, 180, 300, 600)),
  status          TEXT NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado', 'erro')),
  erro_msg        TEXT,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: disparo_contatos (individual contacts in a broadcast)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.disparo_contatos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disparo_id  UUID NOT NULL REFERENCES public.disparos(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  numero      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pendente'
                CHECK (status IN ('pendente', 'enviado', 'falha')),
  erro_msg    TEXT,
  enviado_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_disparos_vendedor_id     ON public.disparos(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_disparos_status          ON public.disparos(status);
CREATE INDEX IF NOT EXISTS idx_disparo_contatos_disparo ON public.disparo_contatos(disparo_id);
CREATE INDEX IF NOT EXISTS idx_disparo_contatos_status  ON public.disparo_contatos(disparo_id, status);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.disparos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disparo_contatos ENABLE ROW LEVEL SECURITY;

-- Users can manage their own disparos
CREATE POLICY "own_disparos" ON public.disparos
  FOR ALL
  USING (vendedor_id = public.get_my_vendedor_id())
  WITH CHECK (vendedor_id = public.get_my_vendedor_id());

-- Admins/superadmins can see all disparos
CREATE POLICY "admin_all_disparos" ON public.disparos
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));

-- Contatos: users see contacts from their own disparos
CREATE POLICY "own_disparo_contatos" ON public.disparo_contatos
  FOR ALL
  USING (
    disparo_id IN (SELECT id FROM public.disparos WHERE vendedor_id = public.get_my_vendedor_id())
  )
  WITH CHECK (
    disparo_id IN (SELECT id FROM public.disparos WHERE vendedor_id = public.get_my_vendedor_id())
  );

-- Admins/superadmins can see all contacts
CREATE POLICY "admin_all_disparo_contatos" ON public.disparo_contatos
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));

-- ============================================================
-- RPC: Atomic counter increments
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_disparo_enviados(p_disparo_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.disparos
  SET enviados = enviados + 1, updated_at = NOW()
  WHERE id = p_disparo_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_disparo_falhas(p_disparo_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.disparos
  SET falhas = falhas + 1, updated_at = NOW()
  WHERE id = p_disparo_id;
$$;

-- ============================================================
-- Trigger: auto-update updated_at on disparos
-- ============================================================
CREATE OR REPLACE TRIGGER set_disparos_updated_at
  BEFORE UPDATE ON public.disparos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- NOTE: After running this migration, enable Realtime for the
-- `disparos` table in the Supabase Dashboard.
