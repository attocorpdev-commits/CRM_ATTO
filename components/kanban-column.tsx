"use client"

import { useDroppable } from "@dnd-kit/core"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { STAGE_LABELS, STAGE_HEADER_COLORS, STAGE_EMPTY_MESSAGES } from "@/lib/kanban-constants"
import { KanbanCard } from "./kanban-card"
import { cn } from "@/lib/utils"
import type { ConversaComVendedor, ConversaEstagio } from "@/types"

interface KanbanColumnProps {
  stage: ConversaEstagio
  conversas: ConversaComVendedor[]
  onCardClick: (id: string) => void
}

export function KanbanColumn({ stage, conversas, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-72 shrink-0 rounded-lg border border-t-4 bg-muted/30",
        STAGE_HEADER_COLORS[stage],
        isOver && "ring-2 ring-primary/50 bg-muted/60"
      )}
    >
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-medium text-sm">{STAGE_LABELS[stage]}</h3>
        <Badge variant="secondary" className="text-xs">
          {conversas.length}
        </Badge>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {conversas.map((conversa) => (
            <KanbanCard
              key={conversa.id}
              conversa={conversa}
              stage={stage}
              onClick={() => onCardClick(conversa.id)}
            />
          ))}
          {conversas.length === 0 && (
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-md py-8 px-4 text-center">
              <p className="text-xs text-muted-foreground">
                {STAGE_EMPTY_MESSAGES[stage]}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
