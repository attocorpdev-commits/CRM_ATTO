"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ConversaComVendedor } from "@/types"

import type { ConversaStatus } from "@/types"

interface UseConversationsOptions {
  vendedorId?: string
  status?: ConversaStatus
}

export function useConversations(options: UseConversationsOptions = {}) {
  const { vendedorId, status } = options
  const [conversas, setConversas]   = useState<ConversaComVendedor[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const supabase                    = createClient()
  const channelRef                  = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchConversas = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from("conversas_whatsapp")
        .select("*, vendedores(nome, email)")
        .order("ultima_mensagem_time", { ascending: false, nullsFirst: false })

      if (vendedorId) query = query.eq("vendedor_id", vendedorId)
      if (status)     query = query.eq("status", status)

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setConversas((data ?? []) as ConversaComVendedor[])
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [vendedorId, status, supabase])

  useEffect(() => {
    fetchConversas()

    // Cleanup previous channel before creating a new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const filter = vendedorId
      ? `vendedor_id=eq.${vendedorId}`
      : undefined

    const channel = supabase
      .channel(`conversas_realtime_${vendedorId ?? "all"}_${status ?? "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversas_whatsapp",
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setConversas((prev) => [
              payload.new as ConversaComVendedor,
              ...prev,
            ])
          } else if (payload.eventType === "UPDATE") {
            setConversas((prev) =>
              prev.map((c) =>
                c.id === (payload.new as ConversaComVendedor).id
                  ? { ...c, ...(payload.new as ConversaComVendedor) }
                  : c
              )
            )
          } else if (payload.eventType === "DELETE") {
            setConversas((prev) =>
              prev.filter((c) => c.id !== (payload.old as { id: string }).id)
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
  }, [fetchConversas, vendedorId, status, supabase])

  return { conversas, loading, error, refetch: fetchConversas }
}
