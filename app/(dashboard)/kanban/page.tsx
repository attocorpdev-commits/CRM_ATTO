import { createClient } from "@/lib/supabase/server"
import { isAdminOrAbove } from "@/lib/roles"
import { KanbanBoard } from "@/components/kanban-board"
import type { ConversaComVendedor } from "@/types"

export default async function KanbanPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: vendedor } = await supabase
    .from("vendedores")
    .select("id, role")
    .eq("user_id", user!.id)
    .single()

  const isAdmin    = isAdminOrAbove(vendedor?.role)
  const vendedorId = isAdmin ? undefined : vendedor?.id

  let query = supabase
    .from("conversas_whatsapp")
    .select("*, vendedores(nome, email)")
    .eq("status", "ativa")
    .order("ultima_mensagem_time", { ascending: false, nullsFirst: false })

  if (!isAdmin && vendedorId) {
    query = query.eq("vendedor_id", vendedorId)
  }

  const { data: initialConversas } = await query

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      <KanbanBoard
        vendedorId={vendedorId}
        initialConversas={(initialConversas ?? []) as ConversaComVendedor[]}
      />
    </div>
  )
}
