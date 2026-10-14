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
    boxRows: "9",
    boxColumns: "9",
  })

  const boxSizePresets = [
    { label: "9 x 9 (81)", rows: 9, columns: 9 },
    { label: "10 x 10 (100)", rows: 10, columns: 10 },
    { label: "8 x 12 (96)", rows: 8, columns: 12 },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const requiredFields = { ...formData }
  
    for (const [key, value] of Object.entries(requiredFields)) {
      if (key === "notes") continue // Skip optional field
      
      if (!value) {
        alert(`Por favor, preencha todos campos obrigatórios`)
        // alert(`Por favor, preencha o campo obrigatório: ${key}`)
        return
      }
    }

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
          boxRows: Number.parseInt(formData.boxRows) || 9,
          boxColumns: Number.parseInt(formData.boxColumns) || 9,
          alertsEnabled: false,
          temperatureAlerts: false,
          maintenanceAlerts: false,
          capacityThreshold: 90,
          lastMaintenance: "2025-04-05",
          nextMaintenance: "2025-07-05",
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
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/freezers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Congeladores
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Adicionar Novo Congelador</h1>
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
                    // required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Localização *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Sala de Laboratório A"
                    // required
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
                    // required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Dimensões da Caixa (Linhas x Colunas)</Label>
                  <p className="text-xs text-muted-foreground">
                    Usado na grelha de posições ao adicionar amostras. Por defeito 9x9 (81), mas pode ser ajustado.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {boxSizePresets.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant={
                          formData.boxRows === preset.rows.toString() &&
                          formData.boxColumns === preset.columns.toString()
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          handleInputChange("boxRows", preset.rows.toString());
                          handleInputChange("boxColumns", preset.columns.toString());
                        }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="boxRows" className="text-xs font-normal text-muted-foreground">
                        Linhas
                      </Label>
                      <Input
                        id="boxRows"
                        type="number"
                        min="1"
                        value={formData.boxRows}
                        onChange={(e) => handleInputChange("boxRows", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="boxColumns" className="text-xs font-normal text-muted-foreground">
                        Colunas
                      </Label>
                      <Input
                        id="boxColumns"
                        type="number"
                        min="1"
                        value={formData.boxColumns}
                        onChange={(e) => handleInputChange("boxColumns", e.target.value)}
                      />
                    </div>
                  </div>
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

                <div className="rounded-lg border bg-card text-card-foreground shadow-xs p-4">
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
  )
}
