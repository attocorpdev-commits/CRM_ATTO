"use client"

import { useState, useEffect, useCallback } from "react"

type ConnectionState = "open" | "connecting" | "close" | "unknown"

/**
 * Polls the Evolution API connection state via our server-side API route.
 * Used in the configuracoes page to show live connection status.
 */
export function useWhatsappStatus(pollIntervalMs = 10000) {
  const [state, setState]   = useState<ConnectionState>("unknown")
  const [loading, setLoading] = useState(true)

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status")
      if (!res.ok) throw new Error("Failed to fetch status")
      const data = await res.json() as { state: ConnectionState }
      setState(data.state)
    } catch {
      setState("unknown")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, pollIntervalMs)
    return () => clearInterval(interval)
  }, [checkStatus, pollIntervalMs])

  return { state, loading, isConnected: state === "open", refetch: checkStatus }
}
