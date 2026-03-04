"use client"

import { useActionState, useState } from "react"
import { createAdminAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check } from "lucide-react"

interface CreateAdminFormProps {
  onSuccess?: () => void
}

export function CreateAdminForm({ onSuccess }: CreateAdminFormProps) {
  const [state, action, isPending] = useActionState(createAdminAction, null)
  const [copied, setCopied] = useState(false)

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
            Admin criado com sucesso!
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
              Esta senha é exibida apenas uma vez. Compartilhe com o admin.
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
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome completo</Label>
        <Input id="nome" name="nome" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Criando..." : "Criar admin"}
      </Button>
    </form>
  )
}
