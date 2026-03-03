"use client"

import { useActionState } from "react"
import { createVendedorAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CreateSellerFormProps {
  onSuccess?: () => void
}

export function CreateSellerForm({ onSuccess }: CreateSellerFormProps) {
  const [state, action, isPending] = useActionState(createVendedorAction, null)

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome completo</Label>
        <Input id="nome" name="nome" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="whatsapp_number">WhatsApp (opcional)</Label>
        <Input id="whatsapp_number" name="whatsapp_number" placeholder="+55 11 99999-9999" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="capacidade_maxima">Capacidade máxima</Label>
          <Input name="capacidade_maxima" type="number" min={1} max={100} defaultValue={10} />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select name="role" defaultValue="vendedor">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vendedor">Vendedor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Criando..." : "Criar vendedor"}
      </Button>
    </form>
  )
}
