import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { isAdminOrAbove } from "@/lib/roles"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Users, MessageSquare } from "lucide-react"
import { subDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function RelatoriosPage() {
  const supabase = await createClient()

  // Permission check: only admin or vendedor with "relatorios" permission
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
      !(vendedor.permissions as string[] | null)?.includes("relatorios")
    ) {
      redirect("/conversas")
    }
  }

  const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

  const [
    { data: conversasPorEstagio },
    { data: vendedoresStats },
    { data: mensagensPorDia },
  ] = await Promise.all([
    // Conversations by stage
    supabase
      .from("conversas_whatsapp")
      .select("estagio")
      .neq("status", "arquivada"),
    // Seller performance
    supabase
      .from("vendedores")
      .select("id, nome, conversas_ativas, capacidade_maxima, status")
      .order("nome"),
    // Messages per day (last 30 days)
    supabase
      .from("mensagens_whatsapp")
      .select("timestamp, direcao")
      .gte("timestamp", thirtyDaysAgo)
      .order("timestamp", { ascending: true }),
  ])

  // Count conversations by stage
  const estagioCount: Record<string, number> = {
    novo:        0,
    contatado:   0,
    qualificado: 0,
    proposta:    0,
    fechado:     0,
  }
  conversasPorEstagio?.forEach((c) => {
    if (c.estagio in estagioCount) estagioCount[c.estagio]++
  })

  // Group messages by day
  const msgByDay: Record<string, { inbound: number; outbound: number }> = {}
  mensagensPorDia?.forEach((m) => {
    const day = format(new Date(m.timestamp), "dd/MM", { locale: ptBR })
    if (!msgByDay[day]) msgByDay[day] = { inbound: 0, outbound: 0 }
    msgByDay[day][m.direcao as "inbound" | "outbound"]++
  })

  const totalMensagens   = mensagensPorDia?.length ?? 0
  const totalConversas   = Object.values(estagioCount).reduce((a, b) => a + b, 0)
  const fechadas         = estagioCount.fechado
  const taxaConversao    = totalConversas > 0
    ? ((fechadas / totalConversas) * 100).toFixed(1)
    : "0"

  const STAGE_LABELS: Record<string, string> = {
    novo: "Novo", contatado: "Contatado", qualificado: "Qualificado",
    proposta: "Proposta", fechado: "Fechado",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Relatórios
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Análise dos últimos 30 dias
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <MessageSquare className="h-3.5 w-3.5" />
              Total de mensagens
            </div>
            <p className="text-2xl font-bold">{totalMensagens.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3.5 w-3.5" />
              Conversas ativas
            </div>
            <p className="text-2xl font-bold">{totalConversas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Taxa de conversão
            </div>
            <p className="text-2xl font-bold">{taxaConversao}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <BarChart3 className="h-3.5 w-3.5" />
              Deals fechados
            </div>
            <p className="text-2xl font-bold">{fechadas}</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel by stage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funil de Conversas por Estágio</CardTitle>
          <CardDescription>Distribuição atual das conversas ativas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(estagioCount).map(([stage, count]) => {
            const percent = totalConversas > 0 ? (count / totalConversas) * 100 : 0
            return (
              <div key={stage} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{STAGE_LABELS[stage]}</span>
                  <span className="text-muted-foreground">
                    {count} ({percent.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Seller performance table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desempenho por Vendedor</CardTitle>
          <CardDescription>Capacidade e carga atual de cada vendedor</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Ativas</TableHead>
                <TableHead className="text-right">Capacidade</TableHead>
                <TableHead className="text-right">Carga</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendedoresStats?.map((v) => {
                const loadPercent = v.capacidade_maxima > 0
                  ? Math.round((v.conversas_ativas / v.capacidade_maxima) * 100)
                  : 0
                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.nome}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={v.status === "ativo" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {v.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{v.conversas_ativas}</TableCell>
                    <TableCell className="text-right">{v.capacidade_maxima}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          loadPercent >= 90 ? "text-destructive font-semibold" :
                          loadPercent >= 70 ? "text-yellow-600 font-medium" :
                          "text-green-600"
                        }
                      >
                        {loadPercent}%
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Messages per day (simple text table - charts need client component) */}
      {Object.keys(msgByDay).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mensagens por Dia (últimos 30 dias)</CardTitle>
            <CardDescription>Volume de mensagens recebidas e enviadas</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Recebidas</TableHead>
                  <TableHead className="text-right">Enviadas</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(msgByDay).slice(-14).reverse().map(([day, counts]) => (
                  <TableRow key={day}>
                    <TableCell>{day}</TableCell>
                    <TableCell className="text-right">{counts.inbound}</TableCell>
                    <TableCell className="text-right">{counts.outbound}</TableCell>
                    <TableCell className="text-right font-medium">
                      {counts.inbound + counts.outbound}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
