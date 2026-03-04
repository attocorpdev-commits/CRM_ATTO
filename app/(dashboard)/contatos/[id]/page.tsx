import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Plus } from "lucide-react"
import { ListaDetail } from "../lista-detail"
import { AddContactsForm } from "../add-contacts-form"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ListaDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: lista } = await supabase
    .from("listas_contatos")
    .select("*")
    .eq("id", id)
    .single()

  if (!lista) notFound()

  const { data: items } = await supabase
    .from("lista_contatos_items")
    .select("*")
    .eq("lista_id", id)
    .order("created_at", { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/contatos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{lista.nome}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {lista.total_contatos} contatos
            </Badge>
            <span>Criada em {new Date(lista.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
      </div>

      <ListaDetail items={items ?? []} listaId={id} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            Adicionar Contatos
          </CardTitle>
          <CardDescription>
            Adicione mais contatos a esta lista
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddContactsForm listaId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
