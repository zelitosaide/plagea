"use client"

import type React from "react"
import { useAuth } from "@/hooks/use-auth"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import Footer from "@/components/footer"
import { ConfirmDialogProvider } from "@/components/confirm-dialog-provider"
import { RouteProgressBar } from "@/components/route-progress-bar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <ConfirmDialogProvider>
        <RouteProgressBar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </ConfirmDialogProvider>
    )
  }

  return (
    <ConfirmDialogProvider>
      <RouteProgressBar />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 md:hidden print:hidden">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
            <span className="font-semibold text-foreground">PlaGeA</span>
          </header>
          <main className="flex-1">{children}</main>
          <div className="print:hidden">
            <Footer />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ConfirmDialogProvider>
  )
}
