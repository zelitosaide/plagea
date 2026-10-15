"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type AuthUser = {
  id: string
  name: string
  email: string
  role: "superadmin" | "admin" | "user"
  departmentId: string | null
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          setUser(await response.json())
          setIsAuthenticated(true)
        } else {
          setUser(null)
          setIsAuthenticated(false)
        }
      } catch {
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    setIsAuthenticated(false)
    router.push("/login")
  }

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const { error } = await response.json()
      throw new Error(error || "Invalid email or password. Please try again.")
    }

    setUser(await response.json())
    setIsAuthenticated(true)
    router.push("/")
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    login,
  }
}
