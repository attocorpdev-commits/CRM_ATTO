"use client"

import { useState } from "react"
import type { Disparo } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { XCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"

interface DisparoHistoryProps {
  disparos: Disparo[]
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  pendente:      { label: "Pendente",      variant: "secondary" },
  em_andamento:  { label: "Em andamento",  variant: "outline",     className: "border-blue-500 text-blue-600" },
  concluido:     { label: "Concluído",     variant: "default",     className: "bg-green-600" },
  cancelado:     { label: "Cancelado",     variant: "destructive" },
  erro:          { label: "Erro",          variant: "destructive" },
}

export function DisparoHistory({ disparos }: DisparoHistoryProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const router = useRouter()

  async function handleCancel(id: string) {
    setCancellingId(id)
    try {
      await fetch(`/api/disparos/${id}/cancel`, { method: "POST" })
      router.refresh()
    } catch {
      // ignore
    } finally {
      setCancellingId(null)
    }
  }

  if (disparos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhum disparo realizado ainda.
      </p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Contatos</TableHead>
            <TableHead>Enviados</TableHead>
            <TableHead>Falhas</TableHead>
            <TableHead>Intervalo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {disparos.map((d) => {
            const config = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.pendente
            const canCancel = d.status === "pendente" || d.status === "em_andamento"
            return (
              <TableRow key={d.id}>
                <TableCell>
                  {format(new Date(d.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>{d.total_contatos}</TableCell>
                <TableCell className="text-green-600">{d.enviados}</TableCell>
                <TableCell className={d.falhas > 0 ? "text-destructive" : ""}>
                  {d.falhas}
                </TableCell>
                <TableCell>{d.delay_segundos >= 60 ? `${d.delay_segundos / 60}min` : `${d.delay_segundos}s`}</TableCell>
                <TableCell>
                  <Badge variant={config.variant} className={config.className}>
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {canCancel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleCancel(d.id)}
                      disabled={cancellingId === d.id}
                      title="Cancelar disparo"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
