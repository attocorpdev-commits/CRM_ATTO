"use client"

import { useRef, useState, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send, Smile } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import dynamic from "next/dynamic"

// Dynamically import emoji picker to reduce initial bundle size
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false })

interface MessageInputProps {
  onSend: (text: string) => Promise<{ error?: string }>
  disabled?: boolean
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [text, setText]           = useState("")
  const [sending, setSending]     = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const textareaRef               = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || sending || disabled) return

    setSending(true)
    try {
      const result = await onSend(trimmed)
      if (result.error) {
        toast.error(result.error)
      } else {
        setText("")
        textareaRef.current?.focus()
      }
    } finally {
      setSending(false)
    }
  }, [text, sending, disabled, onSend])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleEmojiClick(emojiData: { emoji: string }) {
    setText((prev) => prev + emojiData.emoji)
    setShowEmoji(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="relative border-t bg-background p-3">
      {showEmoji && (
        <div className="absolute bottom-full right-0 mb-2 z-10">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9"
          onClick={() => setShowEmoji((v) => !v)}
          disabled={disabled}
        >
          <Smile className={cn("h-5 w-5", showEmoji && "text-primary")} />
        </Button>
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem... (Enter para enviar, Shift+Enter para nova linha)"
          className="min-h-[42px] max-h-32 resize-none flex-1"
          rows={1}
          disabled={disabled || sending}
        />
        <Button
          type="button"
          size="icon"
          className="shrink-0 h-9 w-9"
          onClick={handleSend}
          disabled={!text.trim() || sending || disabled}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground text-right mt-1 pr-1">
        Shift+Enter para nova linha
      </p>
    </div>
  )
}
