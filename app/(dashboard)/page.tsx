import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { isAdminOrAbove } from "@/lib/roles"
import { MetricsCard } from "@/components/metrics-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MessageSquare,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatRelativeTime } from "@/lib/utils"
import { startOfDay } from "date-fns"

const STAGE_COLORS: Record<string, string> = {
  novo:         "bg-blue-100 text-blue-700",
  contatado:    "bg-yellow-100 text-yellow-700",
  qualificado:  "bg-purple-100 text-purple-700",
  proposta:     "bg-orange-100 text-orange-700",
  fechado:      "bg-green-100 text-green-700",
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Permission check: only admin or vendedor with "dashboard" permission
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: vendedor } = await supabase
      .from("vendedores")
      .select("role, permissions")
      .eq("user_id", user.id)
      .single()

    if (
      vendedor &&
      !isAdminOrAbove(vendedor.role) &&
      !(vendedor.permissions as string[] | null)?.includes("dashboard")
    ) {
      redirect("/conversas")
    }
  }

  const todayStart = startOfDay(new Date()).toISOString()

  const [
    { count: totalConversas },
    { count: conversasAtivas },
    { count: conversasQueued },
    { count: mensagensHoje },
    { count: vendedoresAtivos },
    { data: recentConversas },
  ] = await Promise.all([
    supabase.from("conversas_whatsapp").select("*", { count: "exact", head: true }),
    supabase.from("conversas_whatsapp").select("*", { count: "exact", head: true }).eq("status", "ativa"),
    supabase.from("conversas_whatsapp").select("*", { count: "exact", head: true }).eq("status", "queued"),
    supabase.from("mensagens_whatsapp").select("*", { count: "exact", head: true })
      .gte("timestamp", todayStart),
    supabase.from("vendedores").select("*", { count: "exact", head: true })
      .eq("status", "ativo"),
    supabase
      .from("conversas_whatsapp")
      .select("*, vendedores(nome)")
      .order("ultima_mensagem_time", { ascending: false, nullsFirst: false })
      .limit(8),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visão Geral</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumo do seu CRM WhatsApp
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Conversas ativas"
          value={conversasAtivas ?? 0}
          subtitle={`${conversasQueued ?? 0} na fila`}
          icon={MessageSquare}
        />
        <MetricsCard
          title="Mensagens hoje"
          value={mensagensHoje ?? 0}
          subtitle="Todas as direções"
          icon={TrendingUp}
        />
        <MetricsCard
          title="Vendedores ativos"
          value={vendedoresAtivos ?? 0}
          subtitle={`de ${totalConversas ?? 0} conversas total`}
          icon={Users}
        />
        <MetricsCard
          title="Total de conversas"
          value={totalConversas ?? 0}
          subtitle="Desde o início"
          icon={Clock}
        />
      </div>

      {/* Recent conversations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Conversas Recentes</CardTitle>
              <CardDescription>Últimas conversas com atividade</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/conversas">
                Ver todas
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!recentConversas || recentConversas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma conversa ainda</p>
              <p className="text-xs">As conversas aparecerão aqui quando mensagens chegarem</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentConversas.map((c) => {
                const initials = (c.nome_cliente ?? c.numero_cliente)
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <Link
                    key={c.id}
                    href={`/conversas/${c.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      {(c.unread_count ?? 0) > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                          {c.unread_count > 9 ? "9+" : c.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">
                          {c.nome_cliente ?? c.numero_cliente}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {c.ultima_mensagem_time
                            ? formatRelativeTime(c.ultima_mensagem_time)
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground truncate">
                          {c.ultima_mensagem ?? "Sem mensagens"}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${STAGE_COLORS[c.estagio] ?? "bg-muted text-muted-foreground"}`}>
                          {c.estagio}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
