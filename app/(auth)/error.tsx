"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Auth Error]:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
      <h2 className="text-lg font-semibold">Erro de autenticação</h2>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <Button size="sm" onClick={reset}>Tentar novamente</Button>
    </div>
  )
}
