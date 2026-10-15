"use client"

import type React from "react"
import { use, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Save,
  ArrowLeft,
  Loader2,
  // Settings,
  AlertTriangle,
  Thermometer,
  Archive,
  Calendar,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getEquipmentTypeConfig, type EquipmentType } from "@/lib/equipment-types"

export default function FreezerSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [freezerLoading, setFreezerLoading] = useState(true)
  const [formData, setFormData] = useState({
    type: "freezer" as EquipmentType,
    name: "",
    location: "",
    temperature: "",
    capacity: "",
    status: "",
    currentSamples: 0,
    notes: "",
    alertsEnabled: false,
    temperatureAlerts: false,
    maintenanceAlerts: false,
    capacityThreshold: 90,
  })

  const typeConfig = getEquipmentTypeConfig(formData.type)

  const [lastMaintenance, setLastMaintenance] = useState("")
  const [nextMaintenance, setNextMaintenance] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  // Load freezer data
  const fetchFreezerById = async () => {
    try {
      const response = await fetch(`/api/equipment/${id}`)
      if (response.ok) {
        const data = await response.json()
        setFormData(data)
        setLastMaintenance(data.lastMaintenance)
        setNextMaintenance(data.nextMaintenance)
      }
    } catch (error) {
      alert("Falha ao buscar equipamento")
      console.log("Error fetching equipment:", error)
    } finally {
      setFreezerLoading(false)
    }
  }

  // Load sample data
  useEffect(() => {
    fetchFreezerById();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await fetch(`/api/equipment/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          capacity: Number.parseInt(formData.capacity || "0"),
        }),
      })
      alert("Equipamento atualizado com sucesso!")
      router.push("/freezers")
    } catch (error) {
      console.error("Falha ao atualizar as configurações do equipamento:", error)
      alert("Falha ao atualizar as configurações do equipamento")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-primary"
      case "maintenance":
        return "bg-amber-500"
      case "offline":
        return "bg-destructive"
      default:
        return "bg-muted-foreground"
    }
  }

  const utilizationPercentage =
    Math.round(
      (formData.currentSamples || 0) /
        Number.parseInt(formData.capacity || "1"),
    ) * 100

    const handleDelete = async () => {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${formData.name}"? This action cannot be undone and will permanently remove all associated data.`,
      )
  
      if (!confirmed) return
  
      setLoading(true)
  
      try {
        const response = await fetch(`/api/equipment/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert("Equipamento apagado com sucesso");
          router.push("/freezers"); // Navigate only after successful deletion
        } else {
          const errorData = await response.json();
          alert(`Falha ao apagar equipamento: ${errorData.error || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error deleting equipment:", error)
        alert("Falha ao apagar equipamento")
      } finally {
        setLoading(false)
      }
    }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/freezers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Equipamentos
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Configurações do Equipamento - {formData.name}
          </h1>
        </div>
        <div className="flex gap-4">
          <Link href="/freezers">
            <Button variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            form="equipment-settings-form"
            className="flex items-center gap-2"
            disabled={loading || freezerLoading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>

      <form id="equipment-settings-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {typeConfig.hasTemperature ? (
                    <Thermometer className="h-5 w-5" />
                  ) : (
                    <Archive className="h-5 w-5" />
                  )}
                  Informações Básicas
                </CardTitle>
                <CardDescription>Atualizar a identificação e os detalhes de localização do equipamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder={`${typeConfig.label} Principal do Laboratório`}
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

                {typeConfig.hasTemperature && (
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperatura *</Label>
                    <Select
                      value={formData.temperature}
                      onValueChange={(value) => handleInputChange("temperature", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar temperatura" />
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
                  <Label htmlFor="capacity">Capacidade (amostras) *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operacional</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                      <SelectItem value="offline">Avariado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Monitoring & Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Monitoramento e Alertas
                </CardTitle>
                <CardDescription>Configurar as configurações de alerta e os limites de monitoramento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Activar Alertas</Label>
                    <p className="text-sm text-muted-foreground">Butão principal para todas as notificações</p>
                  </div>
                  <Switch
                    checked={formData.alertsEnabled}
                    onCheckedChange={(checked) => handleInputChange("alertsEnabled", checked)}
                  />
                </div>

                {typeConfig.hasTemperature && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Alertas de Temperatura</Label>
                        <p className="text-sm text-muted-foreground">Alertar quando a temperatura estiver abaixo do limite</p>
                      </div>
                      <Switch
                        checked={formData.temperatureAlerts}
                        onCheckedChange={(checked) => handleInputChange("temperatureAlerts", checked)}
                        disabled={!formData.alertsEnabled}
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Manutenção</Label>
                    <p className="text-sm text-muted-foreground">Lembrar quando houver manutenção pendente</p>
                  </div>
                  <Switch
                    checked={formData.maintenanceAlerts}
                    onCheckedChange={(checked) => handleInputChange("maintenanceAlerts", checked)}
                    disabled={!formData.alertsEnabled}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="capacityThreshold">Limite de Alerta de Capacidade (%)</Label>
                  <Input
                    id="capacityThreshold"
                    type="number"
                    value={formData.capacityThreshold}
                    onChange={(e) => handleInputChange("capacityThreshold", Number.parseInt(e.target.value))}
                    placeholder="90"
                    min="50"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground">Alertar quando o equipamento atingir este percentual de capacidade</p>
                </div>

                {utilizationPercentage >= formData.capacityThreshold && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">Aviso de Capacidade</span>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      A utilização atual  ({utilizationPercentage}%) excede o limite estabelecido
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Maintenance & Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Manutenção e Notas
                </CardTitle>
                <CardDescription>Acompanhar o cronograma de manutenção e informações adicionais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Última Manutenção</Label>
                  <div className="p-2 bg-muted rounded-md text-sm">{lastMaintenance}</div>
                </div>

                <div className="space-y-2">
                  <Label>Próxima Manutenção</Label>
                  <div className="p-2 bg-muted rounded-md text-sm">{nextMaintenance}</div>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Manutenção
                </Button>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Notas adicionais sobre este equipamento..."
                    rows={4}
                  />
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-xs p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(formData.status)}`} />
                    Status Atual
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      <Badge
                        variant={
                          formData.status === "operational"
                            ? "default"
                            : formData.status === "offline"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {formData.status}
                      </Badge>
                    </p>
                    <p>
                      <span className="font-medium">Utilização:</span> {utilizationPercentage}%
                    </p>
                    <p>
                      <span className="font-medium">Alertas:</span> {formData.alertsEnabled ? "Ativado" : "Desativado"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-between">
            {/* <Button variant="destructive" onClick={handleDelete} disabled={loading} className="flex items-center gap-2"> */}
            <Button variant="destructive" onClick={handleDelete} disabled={!isAdmin} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Apagar Equipamento
            </Button>

            <div className="flex gap-4">
              <Link href="/freezers">
                <Button variant="outline" disabled={loading}>
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="flex items-center gap-2" disabled={loading || freezerLoading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>
        </div>
      </form>
    </div>
  )
}
