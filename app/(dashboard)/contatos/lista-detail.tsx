"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2 } from "lucide-react"
import { removeContactFromListaAction } from "./actions"
import type { ListaContatoItem } from "@/types"

interface ListaDetailProps {
  items: ListaContatoItem[]
  listaId: string
}

export function ListaDetail({ items, listaId }: ListaDetailProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)
  const router = useRouter()

  async function handleRemove(itemId: string) {
    setRemovingId(itemId)
    await removeContactFromListaAction(itemId, listaId)
    setRemovingId(null)
    router.refresh()
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum contato nesta lista.</p>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Número</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.nome}</TableCell>
              <TableCell className="font-mono text-sm">{item.numero}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(item.id)}
                  disabled={removingId === item.id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
