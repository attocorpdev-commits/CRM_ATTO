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
import { MoreVertical, Edit, Pause, Play, Trash2, KeyRound, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Vendedor } from "@/types"
import {
  toggleAdminStatusAction,
  deleteAdminAction,
  updateAdminAction,
  resetPasswordAction,
} from "@/app/(dashboard)/superadmin/actions"

const STATUS_COLORS: Record<string, string> = {
  ativo:   "bg-green-100 text-green-700 border-green-200",
  pausado: "bg-yellow-100 text-yellow-700 border-yellow-200",
  inativo: "bg-red-100 text-red-700 border-red-200",
}

interface AdminCardProps {
  admin: Vendedor
}

export function AdminCard({ admin }: AdminCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const initials = admin.nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  function handleToggleStatus() {
    startTransition(async () => {
      const result = await toggleAdminStatusAction(admin.id, admin.status)
      if (result.error) toast.error(result.error)
      else toast.success(admin.status === "ativo" ? "Admin pausado" : "Admin ativado")
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAdminAction(admin.id)
      if (result.error) toast.error(result.error)
      else toast.success("Admin desativado")
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
              <p className="font-semibold text-sm truncate">{admin.nome}</p>
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
                        <DialogTitle>Editar admin</DialogTitle>
                      </DialogHeader>
                      <EditAdminForm
                        admin={admin}
                        onClose={() => setEditOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <KeyRound className="h-4 w-4 mr-2" />
                        Resetar senha
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Resetar senha</DialogTitle>
                      </DialogHeader>
                      <ResetPasswordDialog
                        admin={admin}
                        onClose={() => setResetOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                  <DropdownMenuItem onClick={handleToggleStatus} disabled={isPending}>
                    {admin.status === "ativo" ? (
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
            <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Badge
          variant="outline"
          className={cn("text-xs", STATUS_COLORS[admin.status])}
        >
          {admin.status.charAt(0).toUpperCase() + admin.status.slice(1)}
        </Badge>
      </CardContent>
    </Card>
  )
}

function EditAdminForm({
  admin,
  onClose,
}: {
  admin: Vendedor
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateAdminAction(admin.id, null, formData)
      if (result.error) toast.error(result.error)
      else {
        toast.success("Admin atualizado")
        onClose()
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-nome">Nome</Label>
        <Input id="edit-nome" name="nome" defaultValue={admin.nome} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-email">E-mail</Label>
        <Input id="edit-email" name="email" type="email" defaultValue={admin.email} required />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  )
}

function ResetPasswordDialog({
  admin,
  onClose,
}: {
  admin: Vendedor
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleReset() {
    startTransition(async () => {
      const result = await resetPasswordAction(admin.user_id!)
      if (result.error) toast.error(result.error)
      else if (result.newPassword) {
        setNewPassword(result.newPassword)
      }
    })
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (newPassword) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border p-4 bg-green-50 dark:bg-green-950/30">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Senha resetada com sucesso!
          </p>
          <div className="mt-3 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Nova senha</Label>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                  {newPassword}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(newPassword)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Esta senha é exibida apenas uma vez. Compartilhe com o admin.
            </p>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={onClose}>
          Fechar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tem certeza que deseja gerar uma nova senha para <strong>{admin.nome}</strong>?
        A senha atual será invalidada.
      </p>
      {!admin.user_id && (
        <p className="text-sm text-destructive">
          Este admin não possui uma conta de acesso vinculada.
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          className="flex-1"
          onClick={handleReset}
          disabled={isPending || !admin.user_id}
        >
          {isPending ? "Resetando..." : "Resetar senha"}
        </Button>
      </div>
    </div>
  )
}
