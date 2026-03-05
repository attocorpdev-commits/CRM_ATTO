"use client"

import { useState, useCallback } from "react"
import { useMessages } from "@/hooks/use-messages"
import { MessageInput } from "@/components/message-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  UserRoundPlus,
  Download,
} from "lucide-react"
import { cn, formatRelativeTime } from "@/lib/utils"
import { toast } from "sonner"
import type { Anexo, Conversa, Mensagem } from "@/types"
import {
  sendMessageAction,
  sendMediaAction,
  updateConversaEstagioAction,
  updateConversaStatusAction,
  reassignConversaAction,
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
  vendedores: { id: string; nome: string }[]
}

export function ChatInterface({ conversa, initialMensagens, vendedores }: ChatInterfaceProps) {
  const [currentConversa, setCurrentConversa] = useState(conversa)
  const [transferOpen, setTransferOpen]       = useState(false)
  const [selectedVendedor, setSelectedVendedor] = useState("")
  const [transferring, setTransferring]       = useState(false)
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

  const handleSendMedia = useCallback(
    async (formData: FormData) => {
      return sendMediaAction(conversa.id, conversa.numero_cliente, formData)
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

  async function handleTransfer() {
    if (!selectedVendedor) return
    setTransferring(true)
    const result = await reassignConversaAction(conversa.id, selectedVendedor)
    setTransferring(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Conversa transferida")
      setTransferOpen(false)
      setSelectedVendedor("")
      router.refresh()
    }
  }

  const availableVendedores = vendedores.filter(
    (v) => v.id !== currentConversa.vendedor_id
  )

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
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); setTransferOpen(true) }}
              disabled={isArchived || isClosed}
            >
              <UserRoundPlus className="h-4 w-4 mr-2" />
              Transferir conversa
            </DropdownMenuItem>
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

      {/* Transfer dialog */}
      <Dialog open={transferOpen} onOpenChange={(open) => { setTransferOpen(open); if (!open) setSelectedVendedor("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um vendedor" />
              </SelectTrigger>
              <SelectContent>
                {availableVendedores.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleTransfer}
              disabled={!selectedVendedor || transferring}
              className="w-full"
            >
              {transferring ? "Transferindo..." : "Transferir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
        onSendMedia={handleSendMedia}
        disabled={isArchived || isClosed}
      />
    </div>
  )
}

function MediaContent({ anexo, isOutbound }: { anexo: Anexo; isOutbound: boolean }) {
  const src = anexo.base64
    ? `data:${anexo.mimetype ?? "application/octet-stream"};base64,${anexo.base64}`
    : anexo.url

  if (!src) return <p className="italic opacity-70">[mídia indisponível]</p>

  switch (anexo.type) {
    case "image":
      return (
        <div className="space-y-1">
          <img
            src={src}
            alt={anexo.caption ?? "Imagem"}
            className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer"
            onClick={() => window.open(src, "_blank")}
          />
          {anexo.caption && (
            <p className="whitespace-pre-wrap break-words text-sm">{anexo.caption}</p>
          )}
        </div>
      )
    case "video":
      return (
        <div className="space-y-1">
          <video
            src={src}
            controls
            className="rounded-lg max-w-full max-h-64"
            preload="metadata"
          />
          {anexo.caption && (
            <p className="whitespace-pre-wrap break-words text-sm">{anexo.caption}</p>
          )}
        </div>
      )
    case "audio":
      return (
        <audio src={src} controls className="max-w-full min-w-[200px]" preload="metadata" />
      )
    case "document":
      return (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg border",
            isOutbound ? "border-primary-foreground/30" : "border-border"
          )}
        >
          <Download className="h-4 w-4 shrink-0" />
          <span className="text-sm truncate">{anexo.fileName ?? "Documento"}</span>
        </a>
      )
    case "sticker":
      return (
        <img
          src={src}
          alt="Sticker"
          className="max-w-[150px] max-h-[150px]"
        />
      )
    default:
      return <p className="italic opacity-70">[mídia]</p>
  }
}

function MessageBubble({ message }: { message: Mensagem }) {
  const isOutbound = message.direcao === "outbound"
  const time       = format(new Date(message.timestamp), "HH:mm")
  const anexo      = message.anexos as Anexo | null

  // For stickers, render without bubble background
  if (anexo?.type === "sticker") {
    return (
      <div className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
        <div className="max-w-[75%]">
          <MediaContent anexo={anexo} isOutbound={isOutbound} />
          <div className={cn("flex items-center gap-1 mt-1", isOutbound ? "justify-end" : "justify-start")}>
            <span className="text-[10px] text-muted-foreground">{time}</span>
            {isOutbound && STATUS_ICONS[message.status]}
          </div>
        </div>
      </div>
    )
  }

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
        {anexo ? (
          <MediaContent anexo={anexo} isOutbound={isOutbound} />
        ) : message.conteudo ? (
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
