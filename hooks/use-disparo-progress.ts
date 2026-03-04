"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Disparo } from "@/types"

type DisparoProgress = Pick<
  Disparo,
  "id" | "status" | "total_contatos" | "enviados" | "falhas" | "started_at" | "finished_at"
>

export function useDisparoProgress(disparoId: string | null) {
  const [progress, setProgress] = useState<DisparoProgress | null>(null)
  const supabase = createClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!disparoId) return

    supabase
      .from("disparos")
      .select("id, status, total_contatos, enviados, falhas, started_at, finished_at")
      .eq("id", disparoId)
      .single()
      .then(({ data }) => {
        if (data) setProgress(data)
      })

    const channel = supabase
      .channel(`disparo_progress_${disparoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "disparos",
          filter: `id=eq.${disparoId}`,
        },
        (payload) => {
          setProgress(payload.new as DisparoProgress)
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
  }, [disparoId, supabase])

  return progress
}
