"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Boxes,
  Building2,
  FlaskConical,
  Home,
  LogOut,
  ShieldCheck,
  TestTube,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Amostras", href: "/samples", icon: TestTube },
  { name: "Equipamentos", href: "/freezers", icon: Boxes },
  { name: "Relatórios", href: "/reports", icon: BarChart3 },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const items = [...navigation]
  if (user?.role === "admin" || user?.role === "superadmin") {
    items.push({ name: "Administração", href: "/admin/users", icon: ShieldCheck })
  }
  if (user?.role === "superadmin") {
    items.push({ name: "Departamentos", href: "/admin/departments", icon: Building2 })
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FlaskConical className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold text-sidebar-foreground">PlaGeA</span>
            <span className="text-xs text-muted-foreground">FAMED · UEM</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {items.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <Link href={item.href}>
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {user && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-md px-2 py-1.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            {(user.role === "admin" || user.role === "superadmin") && (
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {user.role === "superadmin" ? "Superadmin" : "Admin"}
              </Badge>
            )}
          </div>
        )}
        <Button variant="outline" onClick={logout} className="w-full justify-center gap-2">
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
