"use client"

import { useActionState, useRef } from "react"
import { createVendedorAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

interface CreateSellerFormProps {
  onSuccess?: () => void
}

export function CreateSellerForm({ onSuccess }: CreateSellerFormProps) {
  const [state, action, isPending] = useActionState(createVendedorAction, null)
  const [copied, setCopied] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (state?.success && state?.tempPassword) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border p-4 bg-green-50 dark:bg-green-950/30">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Vendedor criado com sucesso!
          </p>
          <div className="mt-3 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">E-mail</Label>
              <p className="font-mono text-sm">{state.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Senha temporária</Label>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                  {state.tempPassword}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(state.tempPassword!)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Esta senha é exibida apenas uma vez. Compartilhe com o vendedor.
            </p>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={onSuccess}>
          Fechar
        </Button>
      </div>
    )
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
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
      <div className="space-y-2">
        <Label>Permissões de acesso</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox id="perm-conversas" checked disabled />
            <input type="hidden" name="permissions" value="conversas" />
            <Label htmlFor="perm-conversas" className="text-sm font-normal text-muted-foreground">
              Conversas (sempre ativo)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="perm-dashboard" name="permissions" value="dashboard" />
            <Label htmlFor="perm-dashboard" className="text-sm font-normal">
              Visão Geral
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="perm-relatorios" name="permissions" value="relatorios" />
            <Label htmlFor="perm-relatorios" className="text-sm font-normal">
              Relatórios
            </Label>
          </div>
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
