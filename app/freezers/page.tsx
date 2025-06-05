"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Thermometer, MapPin, Package, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Mock freezer data
const mockFreezers = [
  {
    id: "F1",
    name: "Main Lab Freezer",
    location: "Lab Room A",
    temperature: "-80°C",
    capacity: 500,
    currentSamples: 387,
    status: "operational",
    lastMaintenance: "2024-01-10",
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
  },
]

export default function FreezersPage() {
  const [freezers] = useState(mockFreezers)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const router = useRouter()

  // Calculate total pages
  const totalPages = Math.ceil(freezers.length / itemsPerPage)

  // Get current freezers for the page
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentFreezers = freezers.slice(indexOfFirstItem, indexOfLastItem)

  // Change page function
  const changePage = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" })
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

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 75) return "text-yellow-600"
    return "text-green-600"
  }

  const handleViewSamples = (freezer: any) => {
    // Navigate to samples page with freezer filter
    router.push(`/samples?freezer=${freezer.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Congeladores</h1>
              <p className="text-gray-600 mt-2">Monitorar e gerenciar unidades de congeladores de laboratório</p>
            </div>
            <Link href="/freezers/add">
              <Button>Adicionar Novo Congelador</Button>
            </Link>
          </div>
        </div>

        {/* Freezer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentFreezers.map((freezer) => {
            const utilizationPercentage = Math.round((freezer.currentSamples / freezer.capacity) * 100)

            return (
              <Card key={freezer.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5" />
                      {freezer.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(freezer.status)}`} />
                      <Badge variant={freezer.status === "operational" ? "default" : "secondary"}>
                        {freezer.status}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {freezer.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Temperature */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Temperatura</span>
                    <span className="text-lg font-bold text-blue-600">{freezer.temperature}</span>
                  </div>

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
                    <span className="text-sm text-gray-600">{freezer.lastMaintenance}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewSamples(freezer)}>
                      <Package className="h-4 w-4 mr-2" />
                      Visualizar Amostras
                    </Button>
                    <Link href={`/freezers/settings/${freezer.id}`}>
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

        {/* Pagination */}
        {totalPages > 1 && (
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

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {freezers.filter((f) => f.status === "operational").length}
                </div>
                <div className="text-sm text-gray-600">Operacional</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {freezers.filter((f) => f.status === "maintenance").length}
                </div>
                <div className="text-sm text-gray-600">Em Manutenção</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{freezers.reduce((sum, f) => sum + f.currentSamples, 0)}</div>
                <div className="text-sm text-gray-600">Total de Amostras</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{freezers.reduce((sum, f) => sum + f.capacity, 0)}</div>
                <div className="text-sm text-gray-600">Capacidade Total</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
