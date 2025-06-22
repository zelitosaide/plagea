"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  Calendar, 
  Trash2
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function FreezerSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
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

  const [lastMaintenance, setLastMaintenance] = useState("")
  const [nextMaintenance, setNextMaintenance] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  // Load freezer data
  const fetchFreezerById = async () => {
    try {
      const response = await fetch(`/api/freezers/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setFormData(data)
        setLastMaintenance(data.lastMaintenance)
        setNextMaintenance(data.nextMaintenance)
      }
    } catch (error) {
      alert("Falha ao buscar congelador")
      console.log("Error fetching freezer:", error)
    } finally {
      // setLoading(false)
    }
  }

  // Load sample data
  useEffect(() => {
    fetchFreezerById();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await fetch(`/api/freezers/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          capacity: Number.parseInt(formData.capacity || "0"),
        }),
      })
      alert("Freezer updated successfully!")
      router.push("/freezers")
    } catch (error) {
      console.error("Falha ao atualizar as configurações do freezer:", error)
      alert("Falha ao atualizar as configurações do freezer")
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
        return "bg-green-500"
      case "maintenance":
        return "bg-yellow-500"
      case "offline":
        return "bg-red-500"
      default:
        return "bg-gray-500"
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
        const response = await fetch(`/api/freezers/${params.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert("Freezer deleted successfully");
          router.push("/freezers"); // Navigate only after successful deletion
        } else {
          const errorData = await response.json();
          alert(`Failed to delete freezer: ${errorData.error || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error deleting freezer:", error)
        alert("Failed to delete freezer")
      } finally {
        setLoading(false)
      }
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
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {/* <Settings className="h-6 w-6" /> */}
                {/* Freezer Settings - {params.id} */}
                Configurações do Congelador - {formData.name}
              </h1>
              {/* <p className="text-gray-600">Configure freezer parameters and monitoring settings</p> */}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>Atualizar a identificação e os detalhes de localização do freezer</CardDescription>
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
                  <p className="text-xs text-muted-foreground">Alertar quando o congelador atingir este percentual de capacidade</p>
                </div>

                {utilizationPercentage >= formData.capacityThreshold && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Aviso de Capacidade</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
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
                  <div className="p-2 bg-gray-50 rounded-md text-sm">{lastMaintenance}</div>
                </div>

                <div className="space-y-2">
                  <Label>Próxima Manutenção</Label>
                  <div className="p-2 bg-gray-50 rounded-md text-sm">{nextMaintenance}</div>
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
                    placeholder="Notas adicionais sobre este freezer..."
                    rows={4}
                  />
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(formData.status)}`} />
                    Status Atual
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      <Badge variant={formData.status === "operational" ? "default" : "secondary"}>
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
              Apagar Congelador
            </Button>

            <div className="flex gap-4">
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
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
