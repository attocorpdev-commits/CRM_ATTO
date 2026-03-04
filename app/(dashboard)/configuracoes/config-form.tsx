"use client"

import { useActionState } from "react"
import { saveConfigAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Configuracao } from "@/types"

interface ConfigFormProps {
  config: Configuracao | null
}

export function ConfigForm({ config }: ConfigFormProps) {
  const [state, action, isPending] = useActionState(saveConfigAction, null)

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome_conta">Nome da conta</Label>
        <Input
          id="nome_conta"
          name="nome_conta"
          placeholder="CRM Atto Principal"
          defaultValue={config?.nome_conta ?? ""}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="evolution_api_url">URL da Evolution API</Label>
        <Input
          id="evolution_api_url"
          name="evolution_api_url"
          placeholder="https://evolution.seuservidor.com"
          defaultValue={config?.evolution_api_url ?? ""}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="evolution_api_key">API Key</Label>
        <Input
          id="evolution_api_key"
          name="evolution_api_key"
          type="password"
          placeholder="••••••••••••••••"
          defaultValue={config?.evolution_api_key ?? ""}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="instance_name">Nome da instância</Label>
        <Input
          id="instance_name"
          name="instance_name"
          placeholder="crm-atto"
          defaultValue={config?.instance_name ?? ""}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="n8n_webhook_url">Webhook N8N (opcional)</Label>
        <Input
          id="n8n_webhook_url"
          name="n8n_webhook_url"
          placeholder="https://n8n.seuservidor.com/webhook/..."
          defaultValue={config?.n8n_webhook_url ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          Se preenchido, todos os eventos do WhatsApp serão repassados para esta URL.
        </p>
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <div className="space-y-1">
          <p className="text-sm text-green-600">Configurações salvas e instância criada com sucesso!</p>
          {state.instanceError && (
            <p className="text-sm text-yellow-600">
              Aviso ao criar instância: {state.instanceError}
            </p>
          )}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Salvando e criando instância..." : "Salvar configurações"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Ao salvar, a instância será criada automaticamente na Evolution API.
      </p>
    </form>
  )
}
