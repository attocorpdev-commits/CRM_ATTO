"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Mensagem } from "@/types"

export function useMessages(conversaId: string) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const supabase                  = createClient()
  const bottomRef                 = useRef<HTMLDivElement | null>(null)
  const channelRef                = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const fetchMensagens = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from("mensagens_whatsapp")
        .select("*")
        .eq("conversa_id", conversaId)
        .order("timestamp", { ascending: true })
        .limit(100)

      if (fetchError) throw fetchError
      setMensagens(data ?? [])
      setError(null)
      // Scroll after initial load
      setTimeout(scrollToBottom, 100)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [conversaId, supabase, scrollToBottom])

  useEffect(() => {
    if (!conversaId) return
    fetchMensagens()

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`mensagens_realtime_${conversaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mensagens_whatsapp",
          filter: `conversa_id=eq.${conversaId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMensagens((prev) => [...prev, payload.new as Mensagem])
            scrollToBottom()
          } else if (payload.eventType === "UPDATE") {
            setMensagens((prev) =>
              prev.map((m) =>
                m.id === (payload.new as Mensagem).id
                  ? { ...m, ...(payload.new as Mensagem) }
                  : m
              )
            )
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversaId, fetchMensagens, scrollToBottom, supabase])

  return { mensagens, loading, error, bottomRef, refetch: fetchMensagens }
}
