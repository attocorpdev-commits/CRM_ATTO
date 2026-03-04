"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteListaAction } from "./actions"

export function DeleteListaButton({ listaId }: { listaId: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir esta lista?")) return
    setDeleting(true)
    await deleteListaAction(listaId)
    setDeleting(false)
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
      onClick={handleDelete}
      disabled={deleting}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
