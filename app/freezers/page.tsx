"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Thermometer, Archive, Warehouse, MapPin, Package, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { EQUIPMENT_TYPE_LIST, getEquipmentTypeConfig, type EquipmentType } from "@/lib/equipment-types"

type Freezer = {
  _id: string
  name: string
  location: string
  temperature: string
  capacity: number
  currentSamples: number
  code: string
  type: EquipmentType
  status: "operational" | "maintenance" | "offline"
  lastMaintenance: string
}

export default function FreezersPage() {
  const [freezers, setFreezers] = useState<Freezer[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<EquipmentType | "all">("all")
  const itemsPerPage = 6
  const router = useRouter()

  const filteredFreezers = useMemo(
    () => (typeFilter === "all" ? freezers : freezers.filter((f) => f.type === typeFilter)),
    [freezers, typeFilter]
  )

  // Calculate total pages
  const totalPages = Math.ceil(filteredFreezers.length / itemsPerPage)

  // Get current freezers for the page
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentFreezers = filteredFreezers.slice(indexOfFirstItem, indexOfLastItem)

  // Change page function
  const changePage = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleTypeFilterChange = (type: EquipmentType | "all") => {
    setTypeFilter(type)
    setCurrentPage(1)
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "operational":
        return "default" as const
      case "offline":
        return "destructive" as const
      default:
        return "secondary" as const
    }
  }

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "text-destructive"
    if (percentage >= 75) return "text-amber-600"
    return "text-primary"
  }

  const handleViewSamples = (freezer: any) => {
    // Navigate to samples page with equipment filter
    router.push(`/samples?equipment=${freezer._id}`)
  }

  const fetchFreezers = async () => {
    try {
      const response = await fetch("/api/equipment")
      if (response.ok) {
        const data = await response.json()
        setFreezers(data)
        console.log(data);
      }
    } catch (error) {
      toast.error("Falha ao buscar equipamento")
      console.log("Error fetching equipment:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFreezers();
  }, []);

  const operationalCount = freezers.filter((f) => f.status === "operational").length
  const maintenanceCount = freezers.filter((f) => f.status === "maintenance").length
  const totalSamples = freezers.reduce((sum, f) => sum + f.currentSamples, 0)
  const totalCapacity = freezers.reduce((sum, f) => sum + f.capacity, 0)

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestão de Equipamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitorar e gerenciar congeladores, arquivos de blocos e arquivos de lâminas</p>
        </div>
        <Link href="/freezers/add">
          <Button>Adicionar Novo Equipamento</Button>
        </Link>
      </div>

      {/* Overview */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 p-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Operacional</span>
            <span className="text-sm font-semibold text-foreground">{operationalCount}</span>
          </div>
          <Separator orientation="vertical" className="h-5 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-sm text-muted-foreground">Em Manutenção</span>
            <span className="text-sm font-semibold text-foreground">{maintenanceCount}</span>
          </div>
          <Separator orientation="vertical" className="h-5 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total de Amostras</span>
            <span className="text-sm font-semibold text-foreground">{totalSamples}</span>
          </div>
          <Separator orientation="vertical" className="h-5 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Capacidade Total</span>
            <span className="text-sm font-semibold text-foreground">{totalCapacity}</span>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            Equipamentos <span className="font-normal text-muted-foreground">({filteredFreezers.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant={typeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeFilterChange("all")}
            >
              Todos
            </Button>
            {EQUIPMENT_TYPE_LIST.map((config) => (
              <Button
                key={config.type}
                variant={typeFilter === config.type ? "default" : "outline"}
                size="sm"
                onClick={() => handleTypeFilterChange(config.type)}
              >
                {config.label}
              </Button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredFreezers.length === 0 ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center text-center gap-3">
              <Warehouse className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">
                  {typeFilter === "all" ? "Ainda não há equipamento registado" : "Nenhum equipamento deste tipo"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {typeFilter === "all"
                    ? "Adicione o primeiro congelador, arquivo de blocos ou arquivo de lâminas do seu departamento."
                    : "Experimente outro filtro de tipo, ou adicione um novo equipamento."}
                </p>
              </div>
              <Link href="/freezers/add">
                <Button className="mt-2">Adicionar Novo Equipamento</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentFreezers.map((freezer) => {
            const utilizationPercentage = Math.round((freezer.currentSamples / freezer.capacity) * 100)
            const typeConfig = getEquipmentTypeConfig(freezer.type)

            return (
              <Card key={freezer._id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {typeConfig.hasTemperature ? (
                        <Thermometer className="h-5 w-5" />
                      ) : (
                        <Archive className="h-5 w-5" />
                      )}
                      {freezer.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(freezer.status)}`} />
                      <Badge variant={getStatusBadgeVariant(freezer.status)}>
                        {freezer.status}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {freezer.location}
                    <span className="text-muted-foreground">· {typeConfig.label}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Temperature */}
                  {typeConfig.hasTemperature && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Temperatura</span>
                      <span className="text-lg font-bold text-primary">{freezer.temperature}</span>
                    </div>
                  )}

                  {/* Capacity */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Capacidade</span>
                      <span className={`text-sm font-semibold ${getUtilizationColor(utilizationPercentage)}`}>
                        {freezer.currentSamples}/{freezer.capacity} ({utilizationPercentage}%)
                      </span>
                    </div>
                    <Progress value={utilizationPercentage} className="h-2" />
                  </div>

                  {/* Last Maintenance */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Última Manutenção</span>
                    <span className="text-sm text-muted-foreground">{freezer.lastMaintenance}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewSamples(freezer)}>
                      <Package className="h-4 w-4 mr-2" />
                      Visualizar Amostras
                    </Button>
                    <Link href={`/freezers/settings/${freezer._id}`}>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 mb-8">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => changePage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
