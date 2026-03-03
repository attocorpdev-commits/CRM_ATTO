import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SellerCard } from "@/components/seller-card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Users } from "lucide-react"
import { CreateSellerForm } from "./create-seller-form"

export default async function VendedoresPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: currentVendedor } = await supabase
    .from("vendedores")
    .select("id, role")
    .eq("user_id", user!.id)
    .single()

  if ((currentVendedor as { role?: string } | null)?.role !== "admin") {
    redirect("/")
  }

  const { data: vendedores } = await supabase
    .from("vendedores")
    .select("*")
    .order("nome", { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Vendedores
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {vendedores?.length ?? 0} vendedor(es) cadastrado(s)
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo vendedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar vendedor</DialogTitle>
            </DialogHeader>
            <CreateSellerForm />
          </DialogContent>
        </Dialog>
      </div>

      {!vendedores || vendedores.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum vendedor cadastrado</p>
          <p className="text-sm">Clique em &quot;Novo vendedor&quot; para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {vendedores.map((v) => (
            <SellerCard key={v.id} vendedor={v} />
          ))}
        </div>
      )}
    </div>
  )
}
