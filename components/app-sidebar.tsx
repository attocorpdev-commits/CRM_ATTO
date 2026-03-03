"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Wifi,
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
import type { Vendedor } from "@/types"
import { toast } from "sonner"
import { useWhatsappStatus } from "@/hooks/use-whatsapp-status"

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",            icon: LayoutDashboard, label: "Visão Geral"  },
  { href: "/conversas",   icon: MessageSquare,   label: "Conversas"    },
  { href: "/vendedores",  icon: Users,           label: "Vendedores",  adminOnly: true },
  { href: "/relatorios",  icon: BarChart3,       label: "Relatórios"   },
  { href: "/configuracoes", icon: Settings,      label: "Configurações", adminOnly: true },
]

interface AppSidebarProps {
  vendedor: Vendedor | null
}

export function AppSidebar({ vendedor }: AppSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const { isConnected } = useWhatsappStatus(30000)

  const isAdmin      = vendedor?.role === "admin"
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
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <MessageSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">CRM Atto</p>
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                WhatsApp {isConnected ? "conectado" : "desconectado"}
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.filter(
                (item) => !item.adminOnly || isAdmin
              ).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("h-4 w-4")} />
                      <span>{item.label}</span>
                      {isActive(item.href) && (
                        <ChevronRight className="ml-auto h-3 w-3" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: user info + logout */}
      <SidebarFooter className="border-t">
        <div className="flex items-center gap-3 px-2 py-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{vendedor?.nome ?? "Usuário"}</p>
            <div className="flex items-center gap-1.5">
              <Badge
                variant={vendedor?.status === "ativo" ? "default" : "secondary"}
                className="text-[10px] h-4 px-1"
              >
                {vendedor?.role === "admin" ? "Admin" : "Vendedor"}
              </Badge>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
