"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem("isAuthenticated")
      const isAuth = authStatus === "true"

      setIsAuthenticated(isAuth)
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const logout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("rememberUser")
    setIsAuthenticated(false)
    router.push("/login")
  }

  const login = () => {
    localStorage.setItem("isAuthenticated", "true")
    setIsAuthenticated(true)
    router.push("/")
  }

  return {
    isAuthenticated,
    isLoading,
    logout,
    login,
  }
}
