"use client"

import { 
  Card, 
  CardContent, 
  // CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
import { Thermometer, Package, AlertTriangle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"

// Mock data for demonstration
// const stats = {
//   totalSamples: 1247,
//   totalFreezers: 8,
//   expiringSoon: 23,
//   availablePositions: 156,
// }

// const mockRecentSamples = [
//   {
//     id: "1",
//     patientCode: "PT-2024-001",
//     sampleType: "Blood Serum",
//     project: "COVID-19 Study",
//     location: "F1-S2-B3-P15",
//     entryDate: "2024-01-15",
//     expiryDate: "2024-07-15",
//   },
//   {
//     id: "2",
//     patientCode: "PT-2024-002",
//     sampleType: "Plasma",
//     project: "Diabetes Research",
//     location: "F2-S1-B1-P8",
//     entryDate: "2024-01-14",
//     expiryDate: "2024-06-14",
//   },
// ]

export default function Dashboard() {
  const [stats, setStats] = useState<{
    totalSamples: number
    totalFreezers: number
    expiringSoon: number
    availablePositions: number
  } | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" })
        const data = await res.json()
        setStats(data)
      } catch (error) {
        console.error("Failed to fetch stats", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-700">Carregando...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl text-red-600">Erro ao carregar estatísticas</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div><span className="text-green-600 font-black">PlaGeA{" "}-{" "}</span>Plataforma de Gestão de Amostras</div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href="/samples/add">
            {/* "" */}
            <Button className="w-full h-12">Adicionar Nova Amostra</Button>
          </Link>
          <Link href="/samples">
            <Button variant="outline" className="w-full h-12">
              Pesquisar Amostras
            </Button>
          </Link>
          <Link href="/freezers">
            <Button variant="outline" className="w-full h-12">
              Gerenciar Congeladores
            </Button>
          </Link>
          {/* <Link href="/reports">
            <Button variant="outline" className="w-full h-12">
              Visualizar Relatórios
            </Button>
          </Link> */}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Amostras</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSamples.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Em todos os congeladores</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Congeladores Activos</CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFreezers}</div>
              <p className="text-xs text-muted-foreground">Todos operacionais</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Expirar em Breve</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
              <p className="text-xs text-muted-foreground">Dentro de 30 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posições Disponíveis</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.availablePositions}</div>
              <p className="text-xs text-muted-foreground">Pronto para novas amostras</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Samples */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Recent Samples</CardTitle>
            <CardDescription>Latest samples added to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentSamples.map((sample) => (
                <div key={sample.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{sample.patientCode}</span>
                      <Badge variant="secondary">{sample.sampleType}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{sample.project}</p>
                    <p className="text-sm text-gray-500">Location: {sample.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Added: {sample.entryDate}</p>
                    <p className="text-sm text-yellow-600">Expires: {sample.expiryDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}
