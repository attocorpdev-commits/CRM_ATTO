import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookUser, Plus, Users, Trash2 } from "lucide-react"
import { CreateListaForm } from "./create-lista-form"
import { DeleteListaButton } from "./delete-lista-button"

export default async function ContatosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: vendedor } = await supabase
    .from("vendedores")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!vendedor) redirect("/login")

  const { data: listas } = await supabase
    .from("listas_contatos")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Contatos</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova Lista
          </CardTitle>
          <CardDescription>
            Crie uma lista de contatos para usar nos disparos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateListaForm />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Suas Listas</h2>
        {!listas || listas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma lista criada ainda.</p>
        ) : (
          <div className="grid gap-3">
            {listas.map((lista) => (
              <div
                key={lista.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <Link href={`/contatos/${lista.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <BookUser className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{lista.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Criada em {new Date(lista.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {lista.total_contatos}
                  </Badge>
                  <DeleteListaButton listaId={lista.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
