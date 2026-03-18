"use client"

import { useState, useMemo, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { Search, X, ChevronRight } from "lucide-react"
import { useConversations } from "@/hooks/use-conversations"
import { updateConversaEstagioAction } from "@/app/(dashboard)/conversas/[id]/actions"
import { STAGES, STAGE_LABELS, STAGE_COLORS } from "@/lib/kanban-constants"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { ConversaComVendedor, ConversaEstagio } from "@/types"

interface KanbanBoardProps {
  vendedorId?: string
  initialConversas?: ConversaComVendedor[]
}

function groupByStage(
  conversas: ConversaComVendedor[],
  overrides: Record<string, ConversaEstagio>
): Record<ConversaEstagio, ConversaComVendedor[]> {
  const grouped: Record<ConversaEstagio, ConversaComVendedor[]> = {
    novo: [],
    contatado: [],
    qualificado: [],
    proposta: [],
    fechado: [],
  }
  for (const c of conversas) {
    const estagio = (overrides[c.id] ?? c.estagio) as ConversaEstagio
    if (grouped[estagio]) grouped[estagio].push(c)
  }
  return grouped
}

export function KanbanBoard({ vendedorId, initialConversas = [] }: KanbanBoardProps) {
  const { conversas, loading } = useConversations({ vendedorId, status: "ativa" })
  const [activeCard, setActiveCard] = useState<ConversaComVendedor | null>(null)
  const [stageOverrides, setStageOverrides] = useState<Record<string, ConversaEstagio>>({})
  const [search, setSearch] = useState("")
  const [, startTransition] = useTransition()
  const router = useRouter()

  const allConversas = conversas.length > 0 ? conversas : initialConversas

  // Full grouping (with overrides) for the funnel stats bar
  const columns = useMemo(
    () => groupByStage(allConversas, stageOverrides),
    [allConversas, stageOverrides]
  )

  // Search-filtered conversas
  const filteredConversas = useMemo(() => {
    if (!search.trim()) return allConversas
    const q = search.toLowerCase()
    return allConversas.filter(
      (c) =>
        (c.nome_cliente ?? "").toLowerCase().includes(q) ||
        c.numero_cliente.toLowerCase().includes(q)
    )
  }, [allConversas, search])

  // Filtered grouping for column rendering
  const filteredColumns = useMemo(() => {
    if (!search.trim()) return columns
    return groupByStage(filteredConversas, stageOverrides)
  }, [columns, filteredConversas, stageOverrides, search])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const card = allConversas.find((c) => c.id === event.active.id)
      setActiveCard(card ?? null)
    },
    [allConversas]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCard(null)
      const { active, over } = event
      if (!over) return

      const conversaId = active.id as string
      const newEstagio = over.id as ConversaEstagio

      const conversa = allConversas.find((c) => c.id === conversaId)
      if (!conversa || (stageOverrides[conversaId] ?? conversa.estagio) === newEstagio) return

      // Optimistic: move immediately
      setStageOverrides((prev) => ({ ...prev, [conversaId]: newEstagio }))

      startTransition(async () => {
        const result = await updateConversaEstagioAction(conversaId, newEstagio)
        // Clean up override regardless of success/error (realtime will sync on success)
        setStageOverrides((prev) => {
          const next = { ...prev }
          delete next[conversaId]
          return next
        })
        if (result.error) {
          toast.error("Erro ao mover conversa: " + result.error)
        }
      })
    },
    [allConversas, stageOverrides]
  )

  const handleCardClick = useCallback(
    (conversaId: string) => {
      router.push(`/conversas/${conversaId}`)
    },
    [router]
  )

  if (loading && allConversas.length === 0) {
    return <KanbanSkeleton />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <div>
          <h1 className="text-xl font-semibold">Pipeline de Vendas</h1>
          <p className="text-sm text-muted-foreground">
            Arraste as conversas entre os estágios do funil
          </p>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-8 h-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {search && (
            <span className="text-sm text-muted-foreground">
              {filteredConversas.length} de {allConversas.length} conversas
            </span>
          )}
        </div>

        {/* Funnel stats bar */}
        <FunnelStatsBar columns={columns} />
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full min-w-max">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                conversas={filteredColumns[stage]}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
          <DragOverlay>
            {activeCard ? (
              <KanbanCard
                conversa={activeCard}
                stage={(stageOverrides[activeCard.id] ?? activeCard.estagio) as ConversaEstagio}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}

function FunnelStatsBar({
  columns,
}: {
  columns: Record<ConversaEstagio, ConversaComVendedor[]>
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STAGES.map((stage, i) => (
        <div key={stage} className="flex items-center gap-1">
          <Badge
            variant="outline"
            className={cn("text-xs font-normal border", STAGE_COLORS[stage])}
          >
            {STAGE_LABELS[stage]}
            <span className="ml-1 font-semibold">{columns[stage].length}</span>
          </Badge>
          {i < STAGES.length - 1 && (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
        </div>
      ))}
    </div>
  )
}

function KanbanSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-72 shrink-0 rounded-lg border p-3 space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-24 w-full rounded-md" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
