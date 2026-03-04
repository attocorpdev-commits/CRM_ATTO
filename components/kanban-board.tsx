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
import { useConversations } from "@/hooks/use-conversations"
import { updateConversaEstagioAction } from "@/app/(dashboard)/conversas/[id]/actions"
import { STAGES } from "@/lib/kanban-constants"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import type { ConversaComVendedor, ConversaEstagio } from "@/types"

interface KanbanBoardProps {
  vendedorId?: string
  initialConversas?: ConversaComVendedor[]
}

export function KanbanBoard({ vendedorId, initialConversas = [] }: KanbanBoardProps) {
  const { conversas, loading } = useConversations({ vendedorId, status: "ativa" })
  const [activeCard, setActiveCard] = useState<ConversaComVendedor | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const allConversas = conversas.length > 0 ? conversas : initialConversas

  const columns = useMemo(() => {
    const grouped: Record<ConversaEstagio, ConversaComVendedor[]> = {
      novo: [],
      contatado: [],
      qualificado: [],
      proposta: [],
      fechado: [],
    }
    for (const c of allConversas) {
      const estagio = c.estagio as ConversaEstagio
      if (grouped[estagio]) {
        grouped[estagio].push(c)
      }
    }
    return grouped
  }, [allConversas])

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
      if (!conversa || conversa.estagio === newEstagio) return

      startTransition(async () => {
        const result = await updateConversaEstagioAction(conversaId, newEstagio)
        if (result.error) {
          toast.error("Erro ao mover conversa: " + result.error)
        }
      })
    },
    [allConversas]
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
      <div className="p-4 border-b">
        <h1 className="text-xl font-semibold">Pipeline de Vendas</h1>
        <p className="text-sm text-muted-foreground">
          Arraste as conversas entre os estágios do funil
        </p>
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
                conversas={columns[stage]}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
          <DragOverlay>
            {activeCard ? <KanbanCard conversa={activeCard} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      </div>
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
