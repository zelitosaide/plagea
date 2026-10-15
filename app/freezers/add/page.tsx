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
import { EQUIPMENT_TYPE_LIST, getEquipmentTypeConfig, type EquipmentType } from "@/lib/equipment-types"

export default function AddFreezerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: "freezer" as EquipmentType,
    name: "",
    location: "",
    temperature: "",
    capacity: "",
    notes: "",
  })

  const typeConfig = getEquipmentTypeConfig(formData.type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const requiredFields: Record<string, string> = {
      name: formData.name,
      location: formData.location,
      capacity: formData.capacity,
    }
    if (typeConfig.hasTemperature) {
      requiredFields.temperature = formData.temperature
    }

    for (const [, value] of Object.entries(requiredFields)) {
      if (!value) {
        alert(`Por favor, preencha todos campos obrigatórios`)
        return
      }
    }

    setLoading(true)

    try {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          temperature: typeConfig.hasTemperature ? formData.temperature : "",
          capacity: Number.parseInt(formData.capacity),
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
        alert("Equipamento adicionado com sucesso!")
        router.push("/freezers")
      } else {
        alert(result.error || "Falha ao adicionar equipamento")
      }
    } catch (error) {
      console.error("Error adding equipment:", error)
      alert("Falha ao adicionar equipamento")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === "type") {
      setFormData((prev) => ({
        ...prev,
        type: value as EquipmentType,
        temperature: value === "freezer" ? prev.temperature : "",
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/freezers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Equipamentos
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Adicionar Novo Equipamento</h1>
      </div>

      <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Equipment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Equipamento</CardTitle>
                <CardDescription>Detalhes sobre a unidade de armazenamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Equipamento *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_TYPE_LIST.map((config) => (
                        <SelectItem key={config.type} value={config.type}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder={`${typeConfig.label} Principal do Laboratório`}
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

                {typeConfig.hasTemperature && (
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
                )}

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
                    placeholder="Notas adicionais sobre o equipamento..."
                    rows={6}
                  />
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-xs p-4">
                  <h4 className="font-medium mb-2">Visualização do Equipamento</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium">Tipo:</span> {typeConfig.label}
                    </p>
                    <p>
                      <span className="font-medium">Nome:</span> {formData.name || "Não especificado"}
                    </p>
                    <p>
                      <span className="font-medium">Localização:</span> {formData.location || "Não especificado"}
                    </p>
                    {typeConfig.hasTemperature && (
                      <p>
                        <span className="font-medium">Temperatura:</span> {formData.temperature || "Não especificado"}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Capacidade:</span>{" "}
                      {formData.capacity ? `${formData.capacity} amostras` : "Não especificado"}
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
                  Salvar Equipamento
                </>
              )}
            </Button>
          </div>
      </form>
    </div>
  )
}
