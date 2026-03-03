"use client"

import { useState, useCallback } from "react"
import { useMessages } from "@/hooks/use-messages"
import { MessageInput } from "@/components/message-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Check,
  CheckCheck,
  MoreVertical,
  Phone,
  ArrowLeft,
  Archive,
  XCircle,
} from "lucide-react"
import { cn, formatRelativeTime } from "@/lib/utils"
import { toast } from "sonner"
import type { Conversa, Mensagem } from "@/types"
import {
  sendMessageAction,
  updateConversaEstagioAction,
  updateConversaStatusAction,
} from "@/app/(dashboard)/conversas/[id]/actions"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const STATUS_ICONS = {
  enviada:  <Check className="h-3 w-3 text-muted-foreground" />,
  entregue: <CheckCheck className="h-3 w-3 text-muted-foreground" />,
  lida:     <CheckCheck className="h-3 w-3 text-blue-500" />,
  falha:    <XCircle className="h-3 w-3 text-destructive" />,
}

const STAGE_OPTIONS = [
  { value: "novo",        label: "Novo"        },
  { value: "contatado",   label: "Contatado"   },
  { value: "qualificado", label: "Qualificado" },
  { value: "proposta",    label: "Proposta"    },
  { value: "fechado",     label: "Fechado"     },
]

interface ChatInterfaceProps {
  conversa: Conversa
  initialMensagens: Mensagem[]
}

export function ChatInterface({ conversa, initialMensagens }: ChatInterfaceProps) {
  const [currentConversa, setCurrentConversa] = useState(conversa)
  const router                                 = useRouter()

  const {
    mensagens,
    loading,
    bottomRef,
  } = useMessages(conversa.id)

  // Merge initial server-fetched messages with realtime messages
  const displayMensagens = mensagens.length > 0 ? mensagens : initialMensagens

  const handleSend = useCallback(
    async (text: string) => {
      return sendMessageAction(conversa.id, conversa.numero_cliente, text)
    },
    [conversa.id, conversa.numero_cliente]
  )

  async function handleEstagioChange(estagio: string) {
    const result = await updateConversaEstagioAction(conversa.id, estagio)
    if (result.error) {
      toast.error(result.error)
    } else {
      setCurrentConversa((prev) => ({ ...prev, estagio: estagio as never }))
      toast.success("Estágio atualizado")
    }
  }

  async function handleArchive() {
    const result = await updateConversaStatusAction(conversa.id, "arquivada")
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Conversa arquivada")
      router.push("/conversas")
    }
  }

  async function handleClose() {
    const result = await updateConversaStatusAction(conversa.id, "encerrada")
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Conversa encerrada")
      router.push("/conversas")
    }
  }

  const initials = (currentConversa.nome_cliente ?? currentConversa.numero_cliente)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const isArchived = currentConversa.status === "arquivada"
  const isClosed   = currentConversa.status === "encerrada"

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b bg-card shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={() => router.push("/conversas")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-sm">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">
              {currentConversa.nome_cliente ?? currentConversa.numero_cliente}
            </p>
            <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0">
              {currentConversa.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{currentConversa.numero_cliente}</p>
          </div>
        </div>

        {/* Stage selector */}
        <Select
          value={currentConversa.estagio}
          onValueChange={handleEstagioChange}
          disabled={isArchived || isClosed}
        >
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleArchive} disabled={isArchived}>
              <Archive className="h-4 w-4 mr-2" />
              Arquivar conversa
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleClose}
              disabled={isClosed}
              className="text-destructive focus:text-destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Encerrar conversa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loading && displayMensagens.length === 0 ? (
          <div className="flex justify-center py-8 text-muted-foreground text-sm">
            Carregando mensagens...
          </div>
        ) : displayMensagens.length === 0 ? (
          <div className="flex justify-center py-8 text-muted-foreground text-sm">
            Nenhuma mensagem ainda
          </div>
        ) : (
          <div className="space-y-2 pb-2">
            {displayMensagens.map((msg, idx) => {
              const prevMsg    = displayMensagens[idx - 1]
              const showDate   = !prevMsg ||
                new Date(msg.timestamp).toDateString() !==
                new Date(prevMsg.timestamp).toDateString()

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-3">
                      <span className="text-[11px] bg-muted text-muted-foreground px-3 py-1 rounded-full">
                        {format(new Date(msg.timestamp), "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                  <MessageBubble message={msg} />
                </div>
              )
            })}
            {/* Scroll anchor */}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        disabled={isArchived || isClosed}
      />
    </div>
  )
}

function MessageBubble({ message }: { message: Mensagem }) {
  const isOutbound = message.direcao === "outbound"
  const time       = format(new Date(message.timestamp), "HH:mm")

  return (
    <div className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          isOutbound
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {message.conteudo ? (
          <p className="whitespace-pre-wrap break-words">{message.conteudo}</p>
        ) : (
          <p className="italic opacity-70">[mídia]</p>
        )}
        <div
          className={cn(
            "flex items-center gap-1 mt-1",
            isOutbound ? "justify-end" : "justify-start"
          )}
        >
          <span className={cn(
            "text-[10px]",
            isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {time}
          </span>
          {isOutbound && STATUS_ICONS[message.status]}
        </div>
      </div>
    </div>
  )
}
