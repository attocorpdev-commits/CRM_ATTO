import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Settings, Wifi, WifiOff, Webhook } from "lucide-react"
import { WhatsAppConnectDialog } from "./whatsapp-connect-dialog"
import { ConfigForm } from "./config-form"
import { registerWebhookAction } from "./actions"
import type { Configuracao } from "@/types"

async function handleRegisterWebhook() {
  "use server"
  await registerWebhookAction()
}

export default async function ConfiguracoesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: vendedor } = await supabase
    .from("vendedores")
    .select("id, role")
    .eq("user_id", user!.id)
    .single()

  if ((vendedor as { role?: string } | null)?.role !== "admin") redirect("/")

  const { data: config } = await supabase
    .from("configuracoes_whatsapp")
    .select("*")
    .limit(1)
    .single()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure a integração com o WhatsApp via Evolution API
        </p>
      </div>

      {/* WhatsApp Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {config?.status === "ativo" ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            Conexão WhatsApp
          </CardTitle>
          <CardDescription>
            Status da instância no Evolution API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {config?.nome_conta ?? "Não configurado"}
              </p>
              {config?.numero_whatsapp && (
                <p className="text-xs text-muted-foreground">{config.numero_whatsapp}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={config?.status === "ativo" ? "default" : "secondary"}
                className={config?.status === "ativo" ? "bg-green-500 hover:bg-green-600" : ""}
              >
                {config?.status === "ativo" ? "Conectado" : "Desconectado"}
              </Badge>
              <WhatsAppConnectDialog />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evolution API Configuration — Client Component for useActionState feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuração da Evolution API</CardTitle>
          <CardDescription>
            Insira as credenciais da sua instância Evolution API auto-hospedada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfigForm config={config as Configuracao | null} />
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Configuração do Webhook
          </CardTitle>
          <CardDescription>
            Registre o webhook para receber mensagens em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config?.webhook_url && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Webhook URL atual</Label>
              <div className="font-mono text-xs bg-muted p-2 rounded break-all">
                {config.webhook_url}
              </div>
            </div>
          )}
          <Separator />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Clique em registrar para configurar automaticamente o webhook
              na sua instância Evolution API. A URL será:
            </p>
            <div className="font-mono text-xs bg-muted p-2 rounded break-all text-muted-foreground">
              {process.env.NEXT_PUBLIC_APP_URL ?? "https://seudominio.com"}/api/whatsapp/webhook
            </div>
          </div>
          <form action={handleRegisterWebhook}>
            <Button type="submit" variant="outline" className="w-full gap-2" disabled={!config}>
              <Webhook className="h-4 w-4" />
              Registrar webhook na Evolution API
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
