"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

interface AuthProviderProps {
  children: React.ReactNode
}

// Pages that don't require authentication
const PUBLIC_ROUTES = ["/login", "/forgot-password", "/register", "/privacy", "/terms", "/support"]

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem("isAuthenticated")
      const isAuth = authStatus === "true"
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

      setIsAuthenticated(isAuth)
      setIsLoading(false)

      // If not authenticated and trying to access protected route
      if (!isAuth && !isPublicRoute) {
        router.push("/login")
        return
      }

      // If authenticated and trying to access login page, redirect to main app
      if (isAuth && pathname === "/login") {
        router.push("/")
        return
      }
    }

    checkAuth()
  }, [pathname, router])

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-700">Verificando autenticação...</div>
      </div>
    )
  }

  // If not authenticated and trying to access protected route, show nothing (redirect will happen)
  if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
    return null
  }

  // If authenticated and on login page, show nothing (redirect will happen)
  if (isAuthenticated && pathname === "/login") {
    return null
  }

  return <>{children}</>
}
