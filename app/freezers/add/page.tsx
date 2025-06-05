"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Save, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AddFreezerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    temperature: "",
    capacity: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/freezers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          capacity: Number.parseInt(formData.capacity),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert("Freezer added successfully!")
        router.push("/freezers")
      } else {
        alert(result.error || "Failed to add freezer")
      }
    } catch (error) {
      console.error("Error adding freezer:", error)
      alert("Failed to add freezer")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link href="/freezers">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Congeladores
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Adicionar Novo Congelador</h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Freezer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Congelador</CardTitle>
                <CardDescription>Detalhes sobre a unidade do congelador</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Congelador *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Congelador Principal do Laboratório"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Localização *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Sala de Laboratório A"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperatura *</Label>
                  <Select
                    value={formData.temperature}
                    onValueChange={(value) => handleInputChange("temperature", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a temperatura" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-20°C">-20°C</SelectItem>
                      <SelectItem value="-80°C">-80°C</SelectItem>
                      <SelectItem value="-150°C">-150°C</SelectItem>
                      <SelectItem value="-196°C">-196°C (Nitrogênio Líquido)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacidade (número de amostras) *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange("capacity", e.target.value)}
                    placeholder="500"
                    min="1"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Adicionais</CardTitle>
                <CardDescription>Detalhes e observações opcionais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Notas adicionais sobre o freezer..."
                    rows={6}
                  />
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                  <h4 className="font-medium mb-2">Visualização do Congelador</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium">Nome:</span> {formData.name || "Não especificado"}
                    </p>
                    <p>
                      <span className="font-medium">Localização:</span> {formData.location || "Não especificado"}
                    </p>
                    <p>
                      <span className="font-medium">Temperatura:</span> {formData.temperature || "Não especificado"}
                    </p>
                    <p>
                      <span className="font-medium">Capacidade:</span>{" "}
                      {formData.capacity ? `${formData.capacity} samples` : "Não especificado"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <Link href="/freezers">
              <Button variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </Link>
            <Button type="submit" className="flex items-center gap-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Congelador
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
