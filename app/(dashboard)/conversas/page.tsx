import { createClient } from "@/lib/supabase/server"
import { ConversationListClient } from "@/components/conversation-list-client"
import type { ConversaComVendedor } from "@/types"

export default async function ConversasPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get the vendedor record to determine role and ID for filtering
  const { data: vendedor } = await supabase
    .from("vendedores")
    .select("id, role")
    .eq("user_id", user!.id)
    .single()

  // Admins see all conversations; vendedores see only theirs
  const isAdmin    = vendedor?.role === "admin"
  const vendedorId = isAdmin ? undefined : vendedor?.id

  let query = supabase
    .from("conversas_whatsapp")
    .select("*, vendedores(nome, email)")
    .order("ultima_mensagem_time", { ascending: false, nullsFirst: false })
    .limit(50)

  if (!isAdmin && vendedorId) {
    query = query.eq("vendedor_id", vendedorId)
  }

  const { data: initialConversas } = await query

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      <ConversationListClient
        vendedorId={vendedorId}
        initialConversas={(initialConversas ?? []) as ConversaComVendedor[]}
      />
    </div>
  )
}
