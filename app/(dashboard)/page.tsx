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
  contatado:    "bg-amber-100 text-amber-700",
  qualificado:  "bg-violet-100 text-violet-700",
  proposta:     "bg-orange-100 text-orange-700",
  fechado:      "bg-emerald-100 text-emerald-700",
}

const STAGE_LABELS: Record<string, string> = {
  novo:         "Novo Contato",
  contatado:    "Em Atendimento",
  qualificado:  "Orçamento",
  proposta:     "Contrato",
  fechado:      "Concluído",
}

const AVATAR_GRADIENTS = [
  "from-blue-500 to-indigo-700",
  "from-slate-500 to-blue-700",
  "from-indigo-400 to-blue-600",
  "from-sky-500 to-cyan-700",
  "from-blue-400 to-slate-600",
]

function getAvatarGradient(name: string) {
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length]
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe as métricas do seu CRM WhatsApp em tempo real
          </p>
        </div>
      </div>

      {/* Metrics grid */}
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
          title="Consultores ativos"
          value={vendedoresAtivos ?? 0}
          subtitle="Com status ativo"
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
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Conversas Recentes</CardTitle>
              <CardDescription className="text-xs mt-0.5">Últimas conversas com atividade</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5">
              <Link href="/conversas">
                Ver todas
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!recentConversas || recentConversas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-8 w-8 opacity-30" />
              </div>
              <p className="text-sm font-medium">Nenhuma conversa ainda</p>
              <p className="text-xs mt-1">As conversas aparecerão aqui quando mensagens chegarem</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50 -mx-1">
              {recentConversas.map((c) => {
                const displayName = c.nome_cliente ?? c.numero_cliente
                const initials = displayName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
                const gradient = getAvatarGradient(displayName)

                return (
                  <Link
                    key={c.id}
                    href={`/conversas/${c.id}`}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent/40 transition-colors mx-1"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={`text-xs text-white font-semibold bg-gradient-to-br ${gradient}`}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {(c.unread_count ?? 0) > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center shadow-sm">
                          {c.unread_count > 9 ? "9+" : c.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">
                          {displayName}
                        </p>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {c.ultima_mensagem_time
                            ? formatRelativeTime(c.ultima_mensagem_time)
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">
                          {c.ultima_mensagem ?? "Sem mensagens"}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium ${STAGE_COLORS[c.estagio] ?? "bg-muted text-muted-foreground"}`}>
                          {STAGE_LABELS[c.estagio] ?? c.estagio}
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
