"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, Save, ArrowLeft, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type Freezer = {
  _id: string
  code: string
  name: string
  location: string
  temperature: string
  capacity: number
  currentSamples: number
  status: "operational" | "maintenance" | "offline"
  lastMaintenance: string
}

export default function AddSamplePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showEntryCalendar, setShowEntryCalendar] = useState(false)
  const [showExpiryCalendar, setShowExpiryCalendar] = useState(false)
  const [formData, setFormData] = useState({
    patientCode: "",
    sampleType: "",
    project: "",
    freezerId: "",
    freezerCode: "",
    shelf: "",
    rightLeft: "",
    box: "",
    position: "",
    notes: "",
  })

  const [entryDate, setEntryDate] = useState<Date>(new Date())
  const [expiryDate, setExpiryDate] = useState<Date>()

  const [freezers, setFreezers] = useState<Freezer[]>([])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const requiredFields = {
      ...formData,
      entryDate,
      expiryDate,
    }
  
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
      const response = await fetch("/api/samples", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          entryDate: entryDate.toISOString().split("T")[0],
          expiryDate: expiryDate?.toISOString().split("T")[0],
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert("Amostra adicionada com sucesso!")
        // router.push("/samples")
        router.push("/")
      } else {
        alert(result.error || "Falha ao adicionar a amostra")
      }
    } catch (error) {
      console.error("Erro ao adicionar a amostra:", error)
      alert("Falha ao adicionar a amostra")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === "freezerId") {
      const [code, id] = value.split(":")
      setFormData((prev) => ({
        ...prev,
        freezerId: id,
        freezerCode: code,
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const generateCalendar = (currentDate: Date, onDateSelect: (date: Date) => void, onClose: () => void) => {
    const today = new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    // const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

    return (
      <div className="absolute top-full left-0 mt-2 bg-popover border border-border rounded-md shadow-md p-3 z-50 w-auto">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentDate)
              newDate.setMonth(newDate.getMonth() - 1)
              onDateSelect(newDate)
            }}
            className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-sm font-medium">
            {monthNames[month]} {year}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentDate)
              newDate.setMonth(newDate.getMonth() + 1)
              onDateSelect(newDate)
            }}
            className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === month
            const isToday = day.toDateString() === today.toDateString()
            const isSelected = day.toDateString() === currentDate.toDateString()

            return (
              <Button
                key={index}
                type="button"
                variant="ghost"
                onClick={() => {
                  onDateSelect(day)
                  onClose()
                }}
                className={cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                  !isCurrentMonth && "text-muted-foreground opacity-50",
                  isToday && "bg-accent text-accent-foreground",
                  isSelected &&
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                )}
              >
                {day.getDate()}
              </Button>
            )
          })}
        </div>
      </div>
    )
  }

  const fetchFreezers = async () => {
    try {
      const response = await fetch("/api/freezers")
      if (response.ok) {
        const data = await response.json()
        setFreezers(data)
      }
    } catch (error) {
      alert("Falha ao buscar congeladores")
      console.log("Error fetching freezers:", error)
    } finally {
      // setLoading(false)
    }
  }

  useEffect(() => {
    fetchFreezers();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link href="/samples">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Amostras
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Adicionar Nova Amostra</h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sample Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Amostra</CardTitle>
                <CardDescription>Detalhes sobre a amostra</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patientCode">Código do Paciente *</Label>
                  <Input
                    id="patientCode"
                    value={formData.patientCode}
                    onChange={(e) => handleInputChange("patientCode", e.target.value)}
                    placeholder="PT-2024-001"
                    // required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sampleType">Tipo de Amostra *</Label>
                  <Select required value={formData.sampleType} onValueChange={(value) => handleInputChange("sampleType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de amostra" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lavado brocoaveolar">Lavado brocoaveolar</SelectItem>
                      <SelectItem value="Blood Serum">Soro Sanguíneo</SelectItem>
                      <SelectItem value="Plasma">Plasma</SelectItem>
                      <SelectItem value="DNA">DNA</SelectItem>
                      <SelectItem value="RNA">RNA</SelectItem>
                      <SelectItem value="Tissue">Tecido</SelectItem>
                      <SelectItem value="Urine">Urina</SelectItem>
                      <SelectItem value="Saliva">Saliva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Projecto *</Label>
                  <Input
                    id="project"
                    value={formData.project}
                    onChange={(e) => handleInputChange("project", e.target.value)}
                    placeholder="Nome do Projecto"
                    // required
                  />
                </div>

                <div className="relative space-y-2">
                  <Label>Data de Entrada *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEntryCalendar(!showEntryCalendar)
                      setShowExpiryCalendar(false)
                    }}
                    className={cn("w-full justify-start text-left font-normal", !entryDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {entryDate ? formatDate(entryDate) : "Selecione uma data"}
                  </Button>
                  {showEntryCalendar && generateCalendar(entryDate, setEntryDate, () => setShowEntryCalendar(false))}
                </div>

                <div className="relative space-y-2">
                  <Label>Data de Validade *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowExpiryCalendar(!showExpiryCalendar)
                      setShowEntryCalendar(false)
                    }}
                    className={cn("w-full justify-start text-left font-normal", !expiryDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? formatDate(expiryDate) : "Selecione uma data"}
                  </Button>
                  {showExpiryCalendar &&
                    generateCalendar(expiryDate || new Date(), setExpiryDate, () => setShowExpiryCalendar(false))}
                </div>
              </CardContent>
            </Card>

            {/* Storage Location */}
            <Card>
              <CardHeader>
                <CardTitle>Local de Armazenamento</CardTitle>
                <CardDescription>Especifique o local exacto de armazenamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="freezerId">ID do Congelador *</Label>
                  <Select value={
                    formData.freezerId ? `${formData.freezerCode}:${formData.freezerId}` : ""
                  } onValueChange={(value) => handleInputChange("freezerId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o congelador" />
                    </SelectTrigger>
                    <SelectContent>
                      {freezers.length > 0 ? (
                        freezers.map((freezer) => (
                          <SelectItem key={freezer._id} value={`${freezer.code}:${freezer._id}`}>
                            {freezer.code} - {freezer.name}
                          </SelectItem>
                        ))
                      ): (
                        <SelectItem value="na" disabled>
                          Nenhum congelador disponível
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shelf">Prateleira *</Label>
                    <Input
                      id="shelf"
                      type="number"
                      value={(formData.shelf).toString().replace("S", "")}
                      onChange={(e) => handleInputChange("shelf", `S${e.target.value}`)}
                      placeholder="Prateleira"
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shelf">Direita/Esquerda *</Label>
                    <Select value={formData.rightLeft} onValueChange={(value) => handleInputChange("rightLeft", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="E">E</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="box">Box *</Label>
                    <Input
                      id="box"
                      type="number"
                      value={(formData.box).toString().replace("B", "")}
                      onChange={(e) => handleInputChange("box", `B${e.target.value}`)}
                      placeholder="Box"
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Posição *</Label>
                    <Input
                      id="position"
                      type="number"
                      value={(formData.position).toString().replace("P", "")}
                      onChange={(e) => handleInputChange("position", `P${e.target.value}`)}
                      placeholder="Posição"
                      min="1"
                    />
                  </div>
                </div>

                <div
                  className={`rounded-lg p-4 shadow-sm text-card-foreground ${
                    formData.freezerId &&
                    formData.shelf &&
                    formData.rightLeft &&
                    formData.box &&
                    formData.position
                      ? "border border-green-500/30 bg-green-50"
                      : "border border-yellow-600/30 bg-yellow-50/25"
                  }`}
                >
                  <p className="text-sm">
                    <span className="font-medium">Visualização da Localização:</span>{" "}
                    <span
                      className={
                        formData.freezerId &&
                        formData.shelf &&
                        formData.rightLeft &&
                        formData.box &&
                        formData.position
                          ? "text-green-600 font-semibold"
                          : "text-yellow-600 font-medium"
                      }
                    >
                      {formData.freezerId &&
                      formData.shelf &&
                      formData.rightLeft &&
                      formData.box &&
                      formData.position
                        ? `${freezers.find((f) => f._id === formData.freezerId)?.code || ""}-${formData.shelf}-${formData.rightLeft}-${formData.box}-${formData.position}`
                        : "Complete all fields to see location"}
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Notas adicionais sobre a amostra..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <Link href="/samples">
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
                  Salvar Amostra
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
