"use client"

import type React from "react"

import { useState } from "react"
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
    shelf: "",
    box: "",
    position: "",
    notes: "",
  })

  const [entryDate, setEntryDate] = useState<Date>(new Date())
  const [expiryDate, setExpiryDate] = useState<Date>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!entryDate || !expiryDate) {
      alert("Please select both entry and expiry dates")
      return
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
          expiryDate: expiryDate.toISOString().split("T")[0],
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert("Sample added successfully!")
        router.push("/samples")
      } else {
        alert(result.error || "Failed to add sample")
      }
    } catch (error) {
      console.error("Error adding sample:", error)
      alert("Failed to add sample")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sampleType">Tipo de Amostra *</Label>
                  <Select value={formData.sampleType} onValueChange={(value) => handleInputChange("sampleType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de amostra" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Select value={formData.project} onValueChange={(value) => handleInputChange("project", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o projecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COVID-19 Study">Estudo sobre COVID-19</SelectItem>
                      <SelectItem value="Diabetes Research">Pesquisa sobre Diabetes</SelectItem>
                      <SelectItem value="Genetic Analysis">Análise Genética</SelectItem>
                      <SelectItem value="Cancer Research">Pesquisa sobre Câncer</SelectItem>
                      <SelectItem value="Cardiovascular Study">Estudo Cardiovascular</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select value={formData.freezerId} onValueChange={(value) => handleInputChange("freezerId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o congelador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="F1">F1 - Congelador Principal do Laboratório</SelectItem>
                      <SelectItem value="F2">F2 - Congelador de Reserva</SelectItem>
                      <SelectItem value="F3">F3 - Armazenamento de Longo Prazo</SelectItem>
                      <SelectItem value="F4">F4 - Congelador de Pesquisa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shelf">Prateleira *</Label>
                    <Select value={formData.shelf} onValueChange={(value) => handleInputChange("shelf", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Prateleira" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="S1">S1</SelectItem>
                        <SelectItem value="S2">S2</SelectItem>
                        <SelectItem value="S3">S3</SelectItem>
                        <SelectItem value="S4">S4</SelectItem>
                        <SelectItem value="S5">S5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="box">Box *</Label>
                    <Select value={formData.box} onValueChange={(value) => handleInputChange("box", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Box" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => (
                          <SelectItem key={i + 1} value={`B${i + 1}`}>
                            B{i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Posição *</Label>
                    <Select value={formData.position} onValueChange={(value) => handleInputChange("position", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Posição" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 25 }, (_, i) => (
                          <SelectItem key={i + 1} value={`P${i + 1}`}>
                            P{i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                  <p className="text-sm">
                    <span className="font-medium">Visualização da Localização:</span>{" "}
                    <span className="text-muted-foreground">
                      {formData.freezerId && formData.shelf && formData.box && formData.position
                        ? `${formData.freezerId}-${formData.shelf}-${formData.box}-${formData.position}`
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
