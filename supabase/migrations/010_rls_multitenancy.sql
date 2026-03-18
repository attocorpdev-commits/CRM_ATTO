-- ============================================================
-- Migration 010: Atualizar RLS com isolamento por organização
-- Cada organização só vê seus próprios dados.
-- Run AFTER 009_multitenancy_schema.sql
-- ============================================================

-- ============================================================
-- vendedores
-- admin vê apenas vendedores da sua organização
-- ============================================================
DROP POLICY IF EXISTS "admin_all_vendedores" ON public.vendedores;
CREATE POLICY "admin_all_vendedores" ON public.vendedores
  FOR ALL
  USING (
    public.get_my_role() IN ('admin', 'superadmin')
    AND organization_id = public.get_my_organization_id()
  )
  WITH CHECK (
    public.get_my_role() IN ('admin', 'superadmin')
    AND organization_id = public.get_my_organization_id()
  );

-- vendedor_own_record e vendedor_update_own permanecem iguais
-- (user_id = auth.uid() já escopa para o próprio registro)

-- ============================================================
-- conversas_whatsapp
-- ============================================================
DROP POLICY IF EXISTS "admin_all_conversas" ON public.conversas_whatsapp;
CREATE POLICY "admin_all_conversas" ON public.conversas_whatsapp
  FOR ALL
  USING (
    public.get_my_role() IN ('admin', 'superadmin')
    AND organization_id = public.get_my_organization_id()
  )
  WITH CHECK (
    public.get_my_role() IN ('admin', 'superadmin')
    AND organization_id = public.get_my_organization_id()
  );

DROP POLICY IF EXISTS "vendedor_own_conversas" ON public.conversas_whatsapp;
CREATE POLICY "vendedor_own_conversas" ON public.conversas_whatsapp
  FOR ALL
  USING (
    vendedor_id = public.get_my_vendedor_id()
    AND organization_id = public.get_my_organization_id()
  )
  WITH CHECK (
    vendedor_id = public.get_my_vendedor_id()
    AND organization_id = public.get_my_organization_id()
  );

-- ============================================================
-- mensagens_whatsapp
-- (não tem organization_id diretamente; escopa via conversa_id)
-- ============================================================
DROP POLICY IF EXISTS "admin_all_mensagens" ON public.mensagens_whatsapp;
CREATE POLICY "admin_all_mensagens" ON public.mensagens_whatsapp
  FOR ALL
  USING (
    public.get_my_role() IN ('admin', 'superadmin')
    AND conversa_id IN (
      SELECT id FROM public.conversas_whatsapp
      WHERE organization_id = public.get_my_organization_id()
    )
  )
  WITH CHECK (
    public.get_my_role() IN ('admin', 'superadmin')
    AND conversa_id IN (
      SELECT id FROM public.conversas_whatsapp
      WHERE organization_id = public.get_my_organization_id()
    )
  );

DROP POLICY IF EXISTS "vendedor_own_mensagens" ON public.mensagens_whatsapp;
CREATE POLICY "vendedor_own_mensagens" ON public.mensagens_whatsapp
  FOR ALL
  USING (
    conversa_id IN (
      SELECT id FROM public.conversas_whatsapp
      WHERE vendedor_id = public.get_my_vendedor_id()
        AND organization_id = public.get_my_organization_id()
    )
  )
  WITH CHECK (
    conversa_id IN (
      SELECT id FROM public.conversas_whatsapp
      WHERE vendedor_id = public.get_my_vendedor_id()
        AND organization_id = public.get_my_organization_id()
    )
  );

-- ============================================================
-- configuracoes_whatsapp
-- ============================================================
DROP POLICY IF EXISTS "admin_all_config" ON public.configuracoes_whatsapp;
CREATE POLICY "admin_all_config" ON public.configuracoes_whatsapp
  FOR ALL
  USING (
    public.get_my_role() IN ('admin', 'superadmin')
    AND organization_id = public.get_my_organization_id()
  )
  WITH CHECK (
    public.get_my_role() IN ('admin', 'superadmin')
    AND organization_id = public.get_my_organization_id()
  );

-- ============================================================
-- disparos
-- ============================================================
DROP POLICY IF EXISTS "own_disparos" ON public.disparos;
CREATE POLICY "own_disparos" ON public.disparos
  FOR ALL
  USING (
    vendedor_id = public.get_my_vendedor_id()
    AND organization_id = public.get_my_organization_id()
  )
  WITH CHECK (
    vendedor_id = public.get_my_vendedor_id()
    AND organization_id = public.get_my_organization_id()
  );

DROP POLICY IF EXISTS "admin_all_disparos" ON public.disparos;
CREATE POLICY "admin_all_disparos" ON public.disparos
  FOR ALL
  USING (
    public.get_my_role() IN ('admin', 'superadmin')
    AND organization_id = public.get_my_organization_id()
  )
  WITH CHECK (
    public.get_my_role() IN ('admin', 'superadmin')
    AND organization_id = public.get_my_organization_id()
  );

-- disparo_contatos: continua via disparo_id (já pertence à org)
-- Nenhuma mudança necessária nas políticas de disparo_contatos.

-- ============================================================
-- listas_contatos
-- ============================================================
DROP POLICY IF EXISTS "own_listas" ON public.listas_contatos;
CREATE POLICY "own_listas" ON public.listas_contatos
  FOR ALL
  USING (
    vendedor_id = public.get_my_vendedor_id()
    AND organization_id = public.get_my_organization_id()
  )
  WITH CHECK (
    vendedor_id = public.get_my_vendedor_id()
    AND organization_id = public.get_my_organization_id()
  );

DROP POLICY IF EXISTS "admin_all_listas" ON public.listas_contatos;
CREATE POLICY "admin_all_listas" ON public.listas_contatos
  FOR ALL
  USING (
    public.get_my_role() IN ('admin', 'superadmin')
    AND organization_id = public.get_my_organization_id()
  )
  WITH CHECK (
    public.get_my_role() IN ('admin', 'superadmin')
    AND organization_id = public.get_my_organization_id()
  );

-- lista_contatos_items: continua via lista_id (já pertence à org)
-- Nenhuma mudança necessária.
