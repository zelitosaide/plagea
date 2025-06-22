"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const checkExistingAuth = () => {
      const authStatus = localStorage.getItem("isAuthenticated")
      if (authStatus === "true") {
        router.push("/freezers")
      } else {
        setIsCheckingAuth(false)
      }
    }

    checkExistingAuth()
  }, [router])

  // Show loading if checking existing authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // List of valid email-password pairs where password === email
      const validEmails = [
        "mariliasufiana@gmail.com",
        "passanduca@gmail.com",
        "jahityash2002@gmail.com",
        "zelitosaide83@gmail.com",
      ];

      if (validEmails.includes(formData.email) && formData.password === formData.email) {
        // Simulate successful login
        localStorage.setItem("isAuthenticated", "true");

        if (formData.rememberMe) {
          localStorage.setItem("rememberUser", formData.email);
        }

        router.push("/");
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An error occurred during login. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {/* <div className="p-2 bg-green-600 rounded-lg">
              <Thermometer className="h-6 w-6 text-white" />
            </div> */}
            <h1 className="text-lg font-bold text-gray-900">PlaGeA - Plataforma de Gestão Amostras</h1>
          </div>
          <p className="text-gray-600">
            Esta é uma plataforma completa, desenvolvida pela Faculdade de Medicina 
            da Universidade Eduardo Mondlane (UEM), com o objetivo de facilitar a 
            gestão de amostras.
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">PlaGeA</CardTitle>
            <CardDescription className="text-center">Insira suas credenciais para acessar sua conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Endereço de E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite seu E-mail"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua Senha"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
                    disabled={loading}
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-normal">
                    Lembrar de mim
                  </Label>
                </div>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 hover:underline">
                  Esqueceu sua senha?
                </Link>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sessão...
                  </>
                ) : (
                  "Iniciar sessão"
                )}
              </Button>
            </form>

            <Separator className="my-6" />

            {/* Demo Credentials */}
            {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Demo Credentials</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>
                  <strong>Email:</strong> admin@lab.com
                </p>
                <p>
                  <strong>Password:</strong> password123
                </p>
              </div>
            </div> */}

            {/* Footer Links */}
            {/* <div className="mt-6 text-center text-sm text-gray-600">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-blue-600 hover:text-blue-500 hover:underline">
                Contacte o seu administrador.
              </Link>
            </div> */}

            <div className="mt-6 text-center text-sm text-gray-600">
              Não tem uma conta?{" "}
              <a 
                href="mailto:zelitosaide83@gmail.com?subject=PlaGeA%20-%20Account%20Registration%20Request&body=Dear%20Administrator,%0D%0A%0D%0AI%20hope%20this%20email%20finds%20you%20well.%20I%20am%20writing%20to%20request%20access%20to%20the%20Lab%20Freezer%20Manager%20system.%0D%0A%0D%0APlease%20find%20my%20details%20below:%0D%0A%0D%0A%E2%80%A2%20Full%20Name:%20[Please%20enter%20your%20full%20name]%0D%0A%E2%80%A2%20Email%20Address:%20[Please%20enter%20your%20email%20address]%0D%0A%E2%80%A2%20Department/Lab:%20[Please%20enter%20your%20department%20or%20lab%20name]%0D%0A%E2%80%A2%20Position/Role:%20[Please%20enter%20your%20job%20title%20or%20role]%0D%0A%E2%80%A2%20Supervisor/PI:%20[Please%20enter%20your%20supervisor%20or%20principal%20investigator%20name]%0D%0A%E2%80%A2%20Phone%20Number:%20[Please%20enter%20your%20contact%20number]%0D%0A%0D%0AReason%20for%20Access:%0D%0A[Please%20provide%20a%20brief%20description%20of%20why%20you%20need%20access%20to%20the%20freezer%20management%20system,%20including%20which%20freezers%20you%20need%20to%20access%20and%20your%20intended%20use]%0D%0A%0D%0AAccess%20Level%20Requested:%0D%0A%E2%96%A1%20View%20Only%20(read%20freezer%20status%20and%20inventory)%0D%0A%E2%96%A1%20Standard%20User%20(manage%20samples%20and%20view%20reports)%0D%0A%E2%96%A1%20Advanced%20User%20(configure%20settings%20and%20alerts)%0D%0A%E2%96%A1%20Administrator%20(full%20system%20access)%0D%0A%0D%0AI%20understand%20that:%0D%0A%E2%80%A2%20I%20will%20be%20responsible%20for%20maintaining%20the%20confidentiality%20of%20my%20login%20credentials%0D%0A%E2%80%A2%20I%20will%20follow%20all%20laboratory%20protocols%20and%20safety%20procedures%0D%0A%E2%80%A2%20I%20will%20report%20any%20system%20issues%20or%20security%20concerns%20immediately%0D%0A%E2%80%A2%20My%20access%20may%20be%20revoked%20if%20policies%20are%20not%20followed%0D%0A%0D%0APlease%20let%20me%20know%20if%20you%20need%20any%20additional%20information%20or%20documentation%20to%20process%20this%20request.%20I%20am%20available%20for%20any%20required%20training%20sessions.%0D%0A%0D%0AThank%20you%20for%20your%20time%20and%20consideration.%0D%0A%0D%0ABest%20regards,%0D%0A[Your%20Name]%0D%0A[Your%20Signature]"
                className="text-blue-600 hover:text-blue-500 hover:underline"
              >
                Contacte o seu administrador.
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} PlaGeA - FAMED. Todos os direitos reservados.</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy" className="hover:text-gray-700">
              Política de Privacidade
            </Link>
            <Link href="/terms" className="hover:text-gray-700">
              Termos de Uso
            </Link>
            <Link href="/support" className="hover:text-gray-700">
              Suporte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
