"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useConversations } from "@/hooks/use-conversations"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, formatRelativeTime } from "@/lib/utils"
import { Search, MessageSquare } from "lucide-react"
import type { ConversaComVendedor, ConversaStatus } from "@/types"

const STAGE_LABELS: Record<string, string> = {
  novo:         "Novo",
  contatado:    "Contatado",
  qualificado:  "Qualificado",
  proposta:     "Proposta",
  fechado:      "Fechado",
}

const STAGE_COLORS: Record<string, string> = {
  novo:         "bg-blue-100 text-blue-700",
  contatado:    "bg-yellow-100 text-yellow-700",
  qualificado:  "bg-purple-100 text-purple-700",
  proposta:     "bg-orange-100 text-orange-700",
  fechado:      "bg-green-100 text-green-700",
}

type TabValue = "all" | ConversaStatus

interface ConversationListProps {
  vendedorId?: string
  initialConversas?: ConversaComVendedor[]
}

export function ConversationList({ vendedorId, initialConversas = [] }: ConversationListProps) {
  const [search, setSearch]         = useState("")
  const [activeTab, setActiveTab]   = useState<TabValue>("all")
  const router                       = useRouter()

  const { conversas, loading } = useConversations({ vendedorId })

  // Use realtime data or fall back to server-side initial data
  const allConversas = conversas.length > 0 ? conversas : initialConversas

  const filtered = useMemo(() => {
    return allConversas.filter((c) => {
      const matchesTab =
        activeTab === "all" || c.status === activeTab

      const searchLower = search.toLowerCase()
      const matchesSearch =
        !search ||
        c.numero_cliente.includes(searchLower) ||
        (c.nome_cliente ?? "").toLowerCase().includes(searchLower) ||
        (c.ultima_mensagem ?? "").toLowerCase().includes(searchLower)

      return matchesTab && matchesSearch
    })
  }, [allConversas, activeTab, search])

  const counts = useMemo(() => {
    return {
      ativa:    allConversas.filter((c) => c.status === "ativa").length,
      queued:   allConversas.filter((c) => c.status === "queued").length,
      arquivada:allConversas.filter((c) => c.status === "arquivada").length,
    }
  }, [allConversas])

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b space-y-3">
        <h1 className="text-xl font-semibold">Conversas</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou número..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              Todas ({allConversas.length})
            </TabsTrigger>
            <TabsTrigger value="ativa" className="flex-1">
              Ativas ({counts.ativa})
            </TabsTrigger>
            <TabsTrigger value="queued" className="flex-1">
              Fila ({counts.queued})
            </TabsTrigger>
            <TabsTrigger value="arquivada" className="flex-1">
              Arquiv. ({counts.arquivada})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {loading && allConversas.length === 0 ? (
          <ConversationListSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">Nenhuma conversa encontrada</p>
            <p className="text-sm">Ajuste os filtros ou aguarde novas mensagens</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((conversa) => (
              <ConversationRow
                key={conversa.id}
                conversa={conversa}
                onClick={() => router.push(`/conversas/${conversa.id}`)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function ConversationRow({
  conversa,
  onClick,
}: {
  conversa: ConversaComVendedor
  onClick: () => void
}) {
  const initials = (conversa.nome_cliente ?? conversa.numero_cliente)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-sm">{initials}</AvatarFallback>
        </Avatar>
        {(conversa.unread_count ?? 0) > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
            {conversa.unread_count > 9 ? "9+" : conversa.unread_count}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            "text-sm truncate",
            (conversa.unread_count ?? 0) > 0 ? "font-semibold" : "font-medium"
          )}>
            {conversa.nome_cliente ?? conversa.numero_cliente}
          </p>
          <span className="text-xs text-muted-foreground shrink-0">
            {conversa.ultima_mensagem_time
              ? formatRelativeTime(conversa.ultima_mensagem_time)
              : ""}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn(
            "text-xs truncate text-muted-foreground",
            (conversa.unread_count ?? 0) > 0 && "text-foreground font-medium"
          )}>
            {conversa.ultima_mensagem ?? "Sem mensagens"}
          </p>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full shrink-0",
              STAGE_COLORS[conversa.estagio] ?? "bg-muted text-muted-foreground"
            )}
          >
            {STAGE_LABELS[conversa.estagio] ?? conversa.estagio}
          </span>
        </div>
        {conversa.vendedores && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {conversa.vendedores.nome}
          </p>
        )}
      </div>
    </button>
  )
}

function ConversationListSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}
