"use client"

import { useState, useTransition } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreVertical, Edit, Pause, Play, Trash2, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { getRoleLabel } from "@/lib/roles"
import type { Vendedor } from "@/types"
import {
  toggleVendedorStatusAction,
  deleteVendedorAction,
  updateVendedorAction,
} from "@/app/(dashboard)/vendedores/actions"

const STATUS_COLORS: Record<string, string> = {
  ativo:   "bg-green-100 text-green-700 border-green-200",
  pausado: "bg-yellow-100 text-yellow-700 border-yellow-200",
  inativo: "bg-red-100 text-red-700 border-red-200",
}

interface SellerCardProps {
  vendedor: Vendedor
}

export function SellerCard({ vendedor }: SellerCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const loadPercent = vendedor.capacidade_maxima > 0
    ? Math.min(100, (vendedor.conversas_ativas / vendedor.capacidade_maxima) * 100)
    : 0

  const initials = vendedor.nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  function handleToggleStatus() {
    startTransition(async () => {
      const result = await toggleVendedorStatusAction(vendedor.id, vendedor.status)
      if (result.error) toast.error(result.error)
      else toast.success(vendedor.status === "ativo" ? "Vendedor pausado" : "Vendedor ativado")
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteVendedorAction(vendedor.id)
      if (result.error) toast.error(result.error)
      else toast.success("Vendedor desativado")
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-sm truncate">{vendedor.nome}</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar vendedor</DialogTitle>
                      </DialogHeader>
                      <EditVendedorForm
                        vendedor={vendedor}
                        onClose={() => setEditOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                  <DropdownMenuItem onClick={handleToggleStatus} disabled={isPending}>
                    {vendedor.status === "ativo" ? (
                      <><Pause className="h-4 w-4 mr-2" />Pausar</>
                    ) : (
                      <><Play className="h-4 w-4 mr-2" />Ativar</>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isPending}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Desativar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-xs text-muted-foreground truncate">{vendedor.email}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={cn("text-xs", STATUS_COLORS[vendedor.status])}
          >
            {vendedor.status.charAt(0).toUpperCase() + vendedor.status.slice(1)}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {getRoleLabel(vendedor.role)}
          </Badge>
        </div>

        {/* Capacity bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>Conversas ativas</span>
            </div>
            <span className="font-medium text-foreground">
              {vendedor.conversas_ativas} / {vendedor.capacidade_maxima}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                loadPercent >= 90 ? "bg-destructive" :
                loadPercent >= 70 ? "bg-yellow-500" :
                "bg-primary"
              )}
              style={{ width: `${loadPercent}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EditVendedorForm({
  vendedor,
  onClose,
}: {
  vendedor: Vendedor
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateVendedorAction(vendedor.id, null, formData)
      if (result.error) toast.error(result.error)
      else {
        toast.success("Vendedor atualizado")
        onClose()
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-nome">Nome</Label>
        <Input id="edit-nome" name="nome" defaultValue={vendedor.nome} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-email">E-mail</Label>
        <Input id="edit-email" name="email" type="email" defaultValue={vendedor.email} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-whatsapp">WhatsApp</Label>
        <Input id="edit-whatsapp" name="whatsapp_number" defaultValue={vendedor.whatsapp_number ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select name="status" defaultValue={vendedor.status}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="pausado">Pausado</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-capacidade">Capacidade máx.</Label>
          <Input
            id="edit-capacidade"
            name="capacidade_maxima"
            type="number"
            min={1}
            max={100}
            defaultValue={vendedor.capacidade_maxima}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Select name="role" defaultValue={vendedor.role}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vendedor">Vendedor</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  )
}
