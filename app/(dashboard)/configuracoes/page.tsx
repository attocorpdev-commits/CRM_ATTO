import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { isAdminOrAbove } from "@/lib/roles"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, Wifi, WifiOff } from "lucide-react"
import { WhatsAppConnectDialog } from "./whatsapp-connect-dialog"
import { ConfigForm } from "./config-form"
import type { Configuracao } from "@/types"

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

  if (!isAdminOrAbove((vendedor as { role?: string } | null)?.role)) redirect("/")

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
          <CardTitle className="text-base">Configuração da instância</CardTitle>
          <CardDescription>
            Defina o nome da conta e da instância. O webhook será registrado automaticamente ao salvar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfigForm config={config as Configuracao | null} />
        </CardContent>
      </Card>
    </div>
  )
}
