"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn, formatRelativeTime } from "@/lib/utils"
import type { ConversaComVendedor } from "@/types"

interface KanbanCardProps {
  conversa: ConversaComVendedor
  onClick?: () => void
  isDragging?: boolean
}

export function KanbanCard({ conversa, onClick, isDragging = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: conversa.id,
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const displayName = conversa.nome_cliente ?? conversa.numero_cliente
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-shadow",
        isDragging && "shadow-lg opacity-90 rotate-2",
        !isDragging && "hover:shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate flex-1">
            {displayName}
          </span>
          {(conversa.unread_count ?? 0) > 0 && (
            <Badge variant="default" className="text-[10px] h-4 px-1 shrink-0">
              {conversa.unread_count! > 9 ? "9+" : conversa.unread_count}
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">
          {conversa.ultima_mensagem ?? "Sem mensagens"}
        </p>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="truncate">
            {conversa.vendedores?.nome ?? "Sem vendedor"}
          </span>
          <span className="shrink-0">
            {conversa.ultima_mensagem_time
              ? formatRelativeTime(conversa.ultima_mensagem_time)
              : ""}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
