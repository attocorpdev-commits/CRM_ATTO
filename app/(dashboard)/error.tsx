"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Dashboard Error]:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Algo deu errado</h2>
      <p className="text-muted-foreground text-sm max-w-sm">
        {error.message || "Ocorreu um erro inesperado. Tente novamente."}
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  )
}
