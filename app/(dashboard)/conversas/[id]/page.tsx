import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ChatInterface } from "@/components/chat-interface"
import type { Mensagem } from "@/types"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ConversaDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: conversa }, { data: mensagens }, { data: vendedores }] = await Promise.all([
    supabase
      .from("conversas_whatsapp")
      .select("*")
      .eq("id", id)
      .single(),
    supabase
      .from("mensagens_whatsapp")
      .select("*")
      .eq("conversa_id", id)
      .order("timestamp", { ascending: true })
      .limit(100),
    supabase
      .from("vendedores")
      .select("id, nome")
      .eq("status", "ativo")
      .order("nome", { ascending: true }),
  ])

  if (!conversa) notFound()

  // Mark as read (reset unread counter)
  await supabase
    .from("conversas_whatsapp")
    .update({ unread_count: 0 })
    .eq("id", id)

  return (
    <ChatInterface
      conversa={conversa}
      initialMensagens={(mensagens ?? []) as Mensagem[]}
      vendedores={vendedores ?? []}
    />
  )
}
