import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminCard } from "@/components/admin-card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Shield } from "lucide-react"
import { CreateAdminForm } from "./create-admin-form"

export default async function SuperadminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: currentVendedor } = await supabase
    .from("vendedores")
    .select("id, role")
    .eq("user_id", user!.id)
    .single()

  if (currentVendedor?.role !== "superadmin") {
    redirect("/")
  }

  const { data: admins } = await supabase
    .from("vendedores")
    .select("*")
    .eq("role", "admin")
    .order("nome", { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Gerenciar Admins
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {admins?.length ?? 0} admin(s) cadastrado(s)
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar admin</DialogTitle>
            </DialogHeader>
            <CreateAdminForm />
          </DialogContent>
        </Dialog>
      </div>

      {!admins || admins.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum admin cadastrado</p>
          <p className="text-sm">Clique em &quot;Novo admin&quot; para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {admins.map((admin) => (
            <AdminCard key={admin.id} admin={admin} />
          ))}
        </div>
      )}
    </div>
  )
}
