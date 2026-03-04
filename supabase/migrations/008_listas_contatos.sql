-- ============================================================
-- Migration 008: Listas de Contatos (Saved Contact Lists)
-- Run AFTER 007_disparos.sql
-- ============================================================

-- ============================================================
-- Table: listas_contatos (named contact lists)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listas_contatos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id     UUID NOT NULL REFERENCES public.vendedores(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  total_contatos  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: lista_contatos_items (contacts within a list)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lista_contatos_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lista_id    UUID NOT NULL REFERENCES public.listas_contatos(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  numero      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_listas_contatos_vendedor ON public.listas_contatos(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_lista_contatos_items_lista ON public.lista_contatos_items(lista_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.listas_contatos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lista_contatos_items ENABLE ROW LEVEL SECURITY;

-- Users can manage their own lists
CREATE POLICY "own_listas" ON public.listas_contatos
  FOR ALL
  USING (vendedor_id = public.get_my_vendedor_id())
  WITH CHECK (vendedor_id = public.get_my_vendedor_id());

-- Admins/superadmins can see all lists
CREATE POLICY "admin_all_listas" ON public.listas_contatos
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));

-- Items: users see items from their own lists
CREATE POLICY "own_lista_items" ON public.lista_contatos_items
  FOR ALL
  USING (
    lista_id IN (SELECT id FROM public.listas_contatos WHERE vendedor_id = public.get_my_vendedor_id())
  )
  WITH CHECK (
    lista_id IN (SELECT id FROM public.listas_contatos WHERE vendedor_id = public.get_my_vendedor_id())
  );

-- Admins/superadmins can see all items
CREATE POLICY "admin_all_lista_items" ON public.lista_contatos_items
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'superadmin'))
  WITH CHECK (public.get_my_role() IN ('admin', 'superadmin'));

-- ============================================================
-- RPC: Recalculate total_contatos for a list
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_lista_total(p_lista_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.listas_contatos
  SET total_contatos = (
    SELECT COUNT(*) FROM public.lista_contatos_items WHERE lista_id = p_lista_id
  ),
  updated_at = NOW()
  WHERE id = p_lista_id;
$$;

-- ============================================================
-- Trigger: auto-update updated_at on listas_contatos
-- ============================================================
CREATE OR REPLACE TRIGGER set_listas_contatos_updated_at
  BEFORE UPDATE ON public.listas_contatos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
