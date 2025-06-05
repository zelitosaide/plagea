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
  Calendar 
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Mock freezer data
const mockFreezerData = [
  {
    id: "F1",
    name: "Main Lab Freezer",
    location: "Lab Room A",
    temperature: "-80°C",
    capacity: 500,
    currentSamples: 387,
    status: "operational",
    lastMaintenance: "2024-01-10",
    nextMaintenance: "2024-04-10",
    alertsEnabled: true,
    temperatureAlerts: true,
    maintenanceAlerts: true,
    capacityThreshold: 90,
    notes: "Primary storage for COVID-19 study samples",
  },
  {
    id: "F2",
    name: "Backup Freezer",
    location: "Lab Room B",
    temperature: "-80°C",
    capacity: 300,
    currentSamples: 156,
    status: "operational",
    lastMaintenance: "2024-01-08",
    nextMaintenance: "2024-04-08",
    alertsEnabled: true,
    temperatureAlerts: true,
    maintenanceAlerts: false,
    capacityThreshold: 85,
    notes: "Backup storage unit",
  },
  {
    id: "F3",
    name: "Long-term Storage",
    location: "Storage Room",
    temperature: "-150°C",
    capacity: 1000,
    currentSamples: 234,
    status: "operational",
    lastMaintenance: "2024-01-12",
    nextMaintenance: "2024-04-12",
    alertsEnabled: true,
    temperatureAlerts: true,
    maintenanceAlerts: true,
    capacityThreshold: 95,
    notes: "Ultra-low temperature storage for long-term samples",
  },
  {
    id: "F4",
    name: "Research Freezer",
    location: "Research Lab",
    temperature: "-80°C",
    capacity: 400,
    currentSamples: 298,
    status: "maintenance",
    lastMaintenance: "2024-01-05",
    nextMaintenance: "2024-02-05",
    alertsEnabled: false,
    temperatureAlerts: false,
    maintenanceAlerts: true,
    capacityThreshold: 80,
    notes: "Currently under maintenance - compressor replacement",
  },
]

export default function FreezerSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    temperature: "",
    capacity: "",
    status: "",
    notes: "",
    alertsEnabled: false,
    temperatureAlerts: false,
    maintenanceAlerts: false,
    capacityThreshold: 90,
  })

  const [lastMaintenance, setLastMaintenance] = useState("")
  const [nextMaintenance, setNextMaintenance] = useState("")

  // Load freezer data
  useEffect(() => {
    const freezer = mockFreezerData.find((f) => f.id === params.id)
    if (freezer) {
      setFormData({
        name: freezer.name,
        location: freezer.location,
        temperature: freezer.temperature,
        capacity: freezer.capacity.toString(),
        status: freezer.status,
        notes: freezer.notes,
        alertsEnabled: freezer.alertsEnabled,
        temperatureAlerts: freezer.temperatureAlerts,
        maintenanceAlerts: freezer.maintenanceAlerts,
        capacityThreshold: freezer.capacityThreshold,
      })
      setLastMaintenance(freezer.lastMaintenance)
      setNextMaintenance(freezer.nextMaintenance)
    }
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert("Freezer settings updated successfully!")
      router.push("/freezers")
    } catch (error) {
      console.error("Error updating freezer settings:", error)
      alert("Failed to update freezer settings")
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
      (mockFreezerData.find((f) => f.id === params.id)?.currentSamples || 0) /
        Number.parseInt(formData.capacity || "1"),
    ) * 100

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link href="/freezers">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Freezers
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {/* <Settings className="h-6 w-6" /> */}
                Freezer Settings - {params.id}
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
                  Basic Information
                </CardTitle>
                <CardDescription>Update freezer identification and location details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Freezer Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Main Lab Freezer"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Lab Room A"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature *</Label>
                  <Select
                    value={formData.temperature}
                    onValueChange={(value) => handleInputChange("temperature", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select temperature" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-20°C">-20°C</SelectItem>
                      <SelectItem value="-80°C">-80°C</SelectItem>
                      <SelectItem value="-150°C">-150°C</SelectItem>
                      <SelectItem value="-196°C">-196°C (Liquid Nitrogen)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity (samples) *</Label>
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
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
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
                  Monitoring & Alerts
                </CardTitle>
                <CardDescription>Configure alert settings and monitoring thresholds</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Alerts</Label>
                    <p className="text-sm text-muted-foreground">Master switch for all alert notifications</p>
                  </div>
                  <Switch
                    checked={formData.alertsEnabled}
                    onCheckedChange={(checked) => handleInputChange("alertsEnabled", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Temperature Alerts</Label>
                    <p className="text-sm text-muted-foreground">Alert when temperature goes out of range</p>
                  </div>
                  <Switch
                    checked={formData.temperatureAlerts}
                    onCheckedChange={(checked) => handleInputChange("temperatureAlerts", checked)}
                    disabled={!formData.alertsEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Alerts</Label>
                    <p className="text-sm text-muted-foreground">Remind when maintenance is due</p>
                  </div>
                  <Switch
                    checked={formData.maintenanceAlerts}
                    onCheckedChange={(checked) => handleInputChange("maintenanceAlerts", checked)}
                    disabled={!formData.alertsEnabled}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="capacityThreshold">Capacity Alert Threshold (%)</Label>
                  <Input
                    id="capacityThreshold"
                    type="number"
                    value={formData.capacityThreshold}
                    onChange={(e) => handleInputChange("capacityThreshold", Number.parseInt(e.target.value))}
                    placeholder="90"
                    min="50"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground">Alert when freezer reaches this capacity percentage</p>
                </div>

                {utilizationPercentage >= formData.capacityThreshold && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Capacity Warning</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Current utilization ({utilizationPercentage}%) exceeds threshold
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
                  Maintenance & Notes
                </CardTitle>
                <CardDescription>Track maintenance schedule and additional information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Last Maintenance</Label>
                  <div className="p-2 bg-gray-50 rounded-md text-sm">{lastMaintenance}</div>
                </div>

                <div className="space-y-2">
                  <Label>Next Maintenance</Label>
                  <div className="p-2 bg-gray-50 rounded-md text-sm">{nextMaintenance}</div>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Maintenance
                </Button>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Additional notes about this freezer..."
                    rows={4}
                  />
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(formData.status)}`} />
                    Current Status
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      <Badge variant={formData.status === "operational" ? "default" : "secondary"}>
                        {formData.status}
                      </Badge>
                    </p>
                    <p>
                      <span className="font-medium">Utilization:</span> {utilizationPercentage}%
                    </p>
                    <p>
                      <span className="font-medium">Alerts:</span> {formData.alertsEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <Link href="/freezers">
              <Button variant="outline" disabled={loading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="flex items-center gap-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
