"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useConversations } from "@/hooks/use-conversations"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, formatRelativeTime } from "@/lib/utils"
import { STAGE_LABELS, STAGE_COLORS } from "@/lib/kanban-constants"
import { Search, MessageSquare } from "lucide-react"
import type { ConversaComVendedor, ConversaStatus } from "@/types"

type TabValue = "all" | ConversaStatus

interface ConversationListProps {
  vendedorId?: string
  initialConversas?: ConversaComVendedor[]
}

const AVATAR_GRADIENTS = [
  "from-blue-500 to-indigo-700",
  "from-slate-500 to-blue-700",
  "from-indigo-400 to-blue-600",
  "from-sky-500 to-cyan-700",
  "from-blue-400 to-slate-600",
]

function getAvatarGradient(name: string) {
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length]
}

export function ConversationList({ vendedorId, initialConversas = [] }: ConversationListProps) {
  const [search, setSearch]         = useState("")
  const [activeTab, setActiveTab]   = useState<TabValue>("all")
  const router                       = useRouter()

  const { conversas, loading } = useConversations({ vendedorId })

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
    <div className="flex flex-col h-full bg-background">
      {/* Header + Search */}
      <div className="p-4 border-b space-y-3 bg-card/50">
        <h1 className="text-lg font-bold tracking-tight">Conversas</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <Input
            placeholder="Buscar por nome ou número..."
            className="pl-9 bg-background border-border/60 focus-visible:ring-primary/30 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="w-full h-8 bg-muted/50">
            <TabsTrigger value="all" className="flex-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Todas <span className="ml-1 text-muted-foreground font-normal">({allConversas.length})</span>
            </TabsTrigger>
            <TabsTrigger value="ativa" className="flex-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Ativas <span className="ml-1 text-muted-foreground font-normal">({counts.ativa})</span>
            </TabsTrigger>
            <TabsTrigger value="queued" className="flex-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Fila <span className="ml-1 text-muted-foreground font-normal">({counts.queued})</span>
            </TabsTrigger>
            <TabsTrigger value="arquivada" className="flex-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Arquiv. <span className="ml-1 text-muted-foreground font-normal">({counts.arquivada})</span>
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
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <MessageSquare className="h-7 w-7 opacity-30" />
            </div>
            <p className="text-sm font-medium">Nenhuma conversa encontrada</p>
            <p className="text-xs mt-1">Ajuste os filtros ou aguarde novas mensagens</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
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
  const displayName = conversa.nome_cliente ?? conversa.numero_cliente
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  const gradient = getAvatarGradient(displayName)
  const hasUnread = (conversa.unread_count ?? 0) > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3.5 hover:bg-accent/40 transition-colors text-left relative",
        hasUnread && "border-l-2 border-primary bg-primary/[0.02]"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback className={cn(
            "text-sm font-semibold text-white bg-gradient-to-br",
            gradient
          )}>
            {initials}
          </AvatarFallback>
        </Avatar>
        {hasUnread && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
            {conversa.unread_count! > 9 ? "9+" : conversa.unread_count}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            "text-sm truncate",
            hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground/90"
          )}>
            {displayName}
          </p>
          <span className={cn(
            "text-[11px] shrink-0",
            hasUnread ? "text-primary font-semibold" : "text-muted-foreground"
          )}>
            {conversa.ultima_mensagem_time
              ? formatRelativeTime(conversa.ultima_mensagem_time)
              : ""}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn(
            "text-xs truncate",
            hasUnread ? "text-foreground/80 font-medium" : "text-muted-foreground"
          )}>
            {conversa.ultima_mensagem ?? "Sem mensagens"}
          </p>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium",
              STAGE_COLORS[conversa.estagio] ?? "bg-muted text-muted-foreground"
            )}
          >
            {STAGE_LABELS[conversa.estagio] ?? conversa.estagio}
          </span>
        </div>
        {conversa.vendedores && (
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
            {conversa.vendedores.nome}
          </p>
        )}
      </div>
    </button>
  )
}

function ConversationListSkeleton() {
  return (
    <div className="divide-y divide-border/50">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3.5">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
      ))}
    </div>
  )
}
