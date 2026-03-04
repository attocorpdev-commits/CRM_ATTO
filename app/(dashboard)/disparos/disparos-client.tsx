"use client"

import { useState, useCallback } from "react"
import { DisparoForm } from "./disparo-form"
import { DisparoProgress } from "./disparo-progress"
import { DisparoHistory } from "./disparo-history"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Send } from "lucide-react"
import type { Disparo } from "@/types"

interface DisparosClientProps {
  disparos: Disparo[]
  activeDisparoId: string | null
}

export function DisparosClient({ disparos, activeDisparoId: initialActiveId }: DisparosClientProps) {
  const [activeId, setActiveId] = useState<string | null>(initialActiveId)

  const handleFinished = useCallback(() => {
    setActiveId(null)
  }, [])

  return (
    <div className="space-y-6">
      {/* New Broadcast Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Novo Disparo
          </CardTitle>
          <CardDescription>
            Envie mensagens para múltiplos contatos via CSV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DisparoForm
            hasActiveDisparo={!!activeId}
            onCreated={(id) => setActiveId(id)}
          />
        </CardContent>
      </Card>

      {/* Active Broadcast Progress */}
      {activeId && (
        <DisparoProgress disparoId={activeId} onFinished={handleFinished} />
      )}

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Histórico de Disparos</h2>
        <DisparoHistory disparos={disparos} />
      </div>
    </div>
  )
}
