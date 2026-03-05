"use client"

import { useRef, useState, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send, Smile, Paperclip, X, FileText, Image as ImageIcon, Video, Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import dynamic from "next/dynamic"

// Dynamically import emoji picker to reduce initial bundle size
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false })

interface MessageInputProps {
  onSend: (text: string) => Promise<{ error?: string }>
  onSendMedia?: (formData: FormData) => Promise<{ error?: string }>
  disabled?: boolean
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  image: <ImageIcon className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  audio: <Mic className="h-5 w-5" />,
  document: <FileText className="h-5 w-5" />,
}

function getFileCategory(mimetype: string) {
  if (mimetype.startsWith("image/")) return "image"
  if (mimetype.startsWith("video/")) return "video"
  if (mimetype.startsWith("audio/")) return "audio"
  return "document"
}

export function MessageInput({ onSend, onSendMedia, disabled = false }: MessageInputProps) {
  const [text, setText]               = useState("")
  const [sending, setSending]         = useState(false)
  const [showEmoji, setShowEmoji]     = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview]   = useState<string | null>(null)
  const textareaRef                   = useRef<HTMLTextAreaElement>(null)
  const fileInputRef                  = useRef<HTMLInputElement>(null)

  const handleSend = useCallback(async () => {
    if (sending || disabled) return

    // Send media if a file is selected
    if (selectedFile && onSendMedia) {
      setSending(true)
      try {
        const formData = new FormData()
        formData.set("file", selectedFile)
        if (text.trim()) formData.set("caption", text.trim())

        const result = await onSendMedia(formData)
        if (result.error) {
          toast.error(result.error)
        } else {
          setText("")
          setSelectedFile(null)
          setFilePreview(null)
          textareaRef.current?.focus()
        }
      } finally {
        setSending(false)
      }
      return
    }

    // Send text
    const trimmed = text.trim()
    if (!trimmed) return

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
  }, [text, sending, disabled, onSend, onSendMedia, selectedFile])

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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // 25MB limit
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx 25MB)")
      return
    }

    setSelectedFile(file)

    // Generate preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (ev) => setFilePreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }

    // Reset the input so same file can be selected again
    e.target.value = ""
  }

  function clearFile() {
    setSelectedFile(null)
    setFilePreview(null)
  }

  const canSend = selectedFile || text.trim()

  return (
    <div className="relative border-t bg-background p-3">
      {showEmoji && (
        <div className="absolute bottom-full right-0 mb-2 z-10">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg">
          {filePreview ? (
            <img src={filePreview} alt="Preview" className="h-16 w-16 rounded object-cover" />
          ) : (
            <div className="h-12 w-12 rounded bg-background flex items-center justify-center">
              {FILE_ICONS[getFileCategory(selectedFile.type)] ?? <FileText className="h-5 w-5" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={clearFile}>
            <X className="h-4 w-4" />
          </Button>
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
          onChange={handleFileSelect}
        />
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedFile ? "Adicione uma legenda (opcional)..." : "Digite uma mensagem..."}
          className="min-h-[42px] max-h-32 resize-none flex-1"
          rows={1}
          disabled={disabled || sending}
        />
        <Button
          type="button"
          size="icon"
          className="shrink-0 h-9 w-9"
          onClick={handleSend}
          disabled={!canSend || sending || disabled}
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
