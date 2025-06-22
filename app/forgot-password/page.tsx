"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Loader2, Mail, Thermometer, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock success response
      setIsSuccess(true)
      setMessage(`Password reset instructions have been sent to ${email}`)
    } catch (error) {
      console.error("Password reset error:", error)
      setError("An error occurred while sending the reset email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    // Clear messages when user starts typing
    if (error) setError("")
    if (message) setMessage("")
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
            Redefina a sua palavra-passe para recuperar o acesso.
          </p>
        </div>

        {/* Forgot Password Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isSuccess ? "Verifique o seu e-mail" : "Esqueceu a sua Senha?"}
            </CardTitle>
            <CardDescription className="text-center">
              {isSuccess
                ? "Enviámos as instruções para redefinir a senha para o seu endereço de e-mail"
                : "Digite o seu endereço de e-mail e nós enviaremos instruções para redefinir a sua senha"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Endereço de e-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={email}
                      onChange={handleEmailChange}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={loading || !email}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando instruções...
                    </>
                  ) : (
                    "Enviar instruções de redefinição"
                  )}
                </Button>
              </form>
            ) : (
              /* Success State */
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>Se não encontrar o e-mail na sua caixa de entrada, por favor verifique a pasta de spam.</p>
                  <p>O link de redefinição irá expirar em 24 horas por razões de segurança.</p>
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </div>

            {/* Additional Help */}
            {/* {!isSuccess && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Need help?</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Make sure you're using the email address associated with your account</p>
                  <p>• Contact your system administrator if you continue having issues</p>
                  <p>• For immediate assistance, call the lab support line</p>
                </div>
              </div>
            )} */}
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
