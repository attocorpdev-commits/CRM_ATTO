"use client"

import dynamic from "next/dynamic"
import type { ConversaComVendedor } from "@/types"

const ConversationList = dynamic(
  () => import("@/components/conversation-list").then((m) => m.ConversationList),
  { ssr: false }
)

export function ConversationListClient(props: {
  vendedorId?: string
  initialConversas?: ConversaComVendedor[]
}) {
  return <ConversationList {...props} />
}
