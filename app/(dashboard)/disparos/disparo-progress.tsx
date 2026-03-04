"use client"

import { useDisparoProgress } from "@/hooks/use-disparo-progress"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { XCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface DisparoProgressProps {
  disparoId: string
  onFinished?: () => void
}

export function DisparoProgress({ disparoId, onFinished }: DisparoProgressProps) {
  const progress = useDisparoProgress(disparoId)
  const [cancelling, setCancelling] = useState(false)
  const router = useRouter()

  const status = progress?.status
  const isFinished = status === "concluido" || status === "cancelado" || status === "erro"

  useEffect(() => {
    if (isFinished) {
      router.refresh()
      // Delay clearing active state so the user can see the final status
      const timer = setTimeout(() => {
        onFinished?.()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isFinished, onFinished, router])

  if (!progress) return null

  const { total_contatos, enviados, falhas } = progress
  const processed = enviados + falhas
  const percent = total_contatos > 0 ? Math.round((processed / total_contatos) * 100) : 0
  const remaining = total_contatos - processed

  const isPending = status === "pendente"
  const isActive = status === "em_andamento" || isPending
  const isDone = status === "concluido"
  const isCancelled = status === "cancelado"

  async function handleCancel() {
    setCancelling(true)
    try {
      await fetch(`/api/disparos/${disparoId}/cancel`, { method: "POST" })
    } catch {
      // ignore
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          {isPending ? "Disparo pendente" : status === "em_andamento" ? "Disparo em andamento" : isDone ? "Disparo concluído" : "Disparo cancelado"}
        </h3>
        <Badge
          variant={isDone ? "default" : isCancelled ? "destructive" : "secondary"}
          className={isDone ? "bg-green-600" : ""}
        >
          {isActive && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          {isDone && <CheckCircle2 className="mr-1 h-3 w-3" />}
          {isCancelled && <XCircle className="mr-1 h-3 w-3" />}
          {status === "em_andamento" ? "Em andamento" :
           status === "concluido" ? "Concluído" :
           status === "cancelado" ? "Cancelado" : status}
        </Badge>
      </div>

      <Progress value={percent} className="h-3" />

      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <span>
            <strong>{processed}</strong>/{total_contatos} ({percent}%)
          </span>
          <span className="text-green-600">Enviados: {enviados}</span>
          {falhas > 0 && <span className="text-destructive">Falhas: {falhas}</span>}
        </div>
        {isActive && remaining > 0 && (
          <span className="text-muted-foreground">
            Restam {remaining} contato{remaining !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isActive && (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? "Cancelando..." : "Cancelar Disparo"}
        </Button>
      )}
    </div>
  )
}
