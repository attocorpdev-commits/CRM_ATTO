import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DisparosClient } from "./disparos-client"

export default async function DisparosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: vendedor } = await supabase
    .from("vendedores")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!vendedor) redirect("/login")

  // Fetch all disparos for this user, newest first
  const { data: disparos } = await supabase
    .from("disparos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  // Find active disparo (if any)
  const activeDisparo = disparos?.find(
    (d) => d.status === "pendente" || d.status === "em_andamento"
  )

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Disparos em Massa</h1>
        <p className="text-muted-foreground">
          Envie mensagens WhatsApp para múltiplos contatos via CSV
        </p>
      </div>

      <DisparosClient
        disparos={disparos ?? []}
        activeDisparoId={activeDisparo?.id ?? null}
      />
    </div>
  )
}
