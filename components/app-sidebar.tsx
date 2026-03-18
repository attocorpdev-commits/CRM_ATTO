"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  MessageSquare,
  Columns3,
  Users,
  BarChart3,
  Settings,
  Shield,
  Send,
  User,
  BookUser,
  LogOut,
  WifiOff,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { isAdminOrAbove, getRoleLabel } from "@/lib/roles"
import type { Vendedor } from "@/types"
import { toast } from "sonner"
import { useWhatsappStatus } from "@/hooks/use-whatsapp-status"

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  adminOnly?: boolean
  superadminOnly?: boolean
  permission?: string
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",              icon: LayoutDashboard, label: "Visão Geral",     permission: "dashboard" },
  { href: "/conversas",     icon: MessageSquare,   label: "Conversas"      },
  { href: "/kanban",        icon: Columns3,        label: "Pipeline"       },
  { href: "/vendedores",    icon: Users,           label: "Consultores",   adminOnly: true },
  { href: "/contatos",      icon: BookUser,        label: "Contatos"       },
  { href: "/disparos",      icon: Send,            label: "Disparos"       },
  { href: "/relatorios",    icon: BarChart3,       label: "Relatórios",    permission: "relatorios" },
  { href: "/minha-conta",   icon: User,            label: "Minha Conta"    },
  { href: "/configuracoes", icon: Settings,        label: "Configurações", adminOnly: true },
  { href: "/superadmin",    icon: Shield,          label: "Superadmin",    superadminOnly: true },
]

interface AppSidebarProps {
  vendedor: Vendedor | null
}

export function AppSidebar({ vendedor }: AppSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const { isConnected } = useWhatsappStatus(30000)

  const isAdmin      = isAdminOrAbove(vendedor?.role)
  const isSuperadmin = vendedor?.role === "superadmin"
  const initials     = vendedor?.nome
    ? vendedor.nome.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success("Até logo!")
    router.push("/login")
    router.refresh()
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shrink-0 shadow-md">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-sidebar-foreground truncate tracking-tight">CRM Atto</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isConnected ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-blue-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                  </span>
                  Conectado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-sidebar-foreground/50">
                  <WifiOff className="h-3 w-3" />
                  Desconectado
                </span>
              )}
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {NAV_ITEMS.filter((item) => {
                if (item.superadminOnly) return isSuperadmin
                if (item.adminOnly) return isAdmin
                if (item.permission && !isAdmin) {
                  return (vendedor?.permissions as string[] | undefined)?.includes(item.permission)
                }
                return true
              }).map((item) => {
                const active = isActive(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        "relative h-9 rounded-lg transition-all duration-150",
                        active
                          ? "bg-sidebar-primary/15 text-sidebar-primary-foreground font-medium"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <Link href={item.href}>
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sidebar-primary rounded-r-full" />
                        )}
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-sidebar-primary" : "text-sidebar-foreground/50"
                        )} />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: user info + logout */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-sidebar-primary/30">
            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-600 to-slate-700 text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
              {vendedor?.nome ?? "Usuário"}
            </p>
            <Badge
              variant="secondary"
              className="text-[10px] h-4 px-1.5 mt-0.5 bg-sidebar-primary/20 text-sidebar-primary border-0 font-medium"
            >
              {getRoleLabel(vendedor?.role)}
            </Badge>
          </div>
          <button
            onClick={handleLogout}
            className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors p-1 rounded-md hover:bg-sidebar-accent"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
