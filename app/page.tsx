"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Warehouse,
  Package,
  AlertTriangle,
  Calendar,
  Plus,
  Search,
  ArrowRight,
  Loader2,
  TestTube,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type Stats = {
  totalSamples: number
  totalEquipment: number
  expiringSoon: number
  availablePositions: number
}

type Sample = {
  _id: string
  patientCode: string
  sampleType: string
  project: string
  entryDate: string
  expiryDate: string
}

const isExpiringSoon = (expiryDate: string) => {
  const expiry = new Date(expiryDate)
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  return expiry <= thirtyDaysFromNow
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentSamples, setRecentSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, samplesRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/samples"),
        ])
        setStats(await statsRes.json())

        const samples: Sample[] = await samplesRes.json()
        const sorted = [...samples].sort(
          (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
        )
        setRecentSamples(sorted.slice(0, 5))
      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-destructive">Erro ao carregar estatísticas</p>
      </div>
    )
  }

  const statCards = [
    {
      label: "Total de Amostras",
      value: stats.totalSamples.toLocaleString(),
      helper: "Em todo o equipamento",
      icon: Package,
      tone: "primary" as const,
    },
    {
      label: "Total de Equipamentos",
      value: stats.totalEquipment.toLocaleString(),
      helper: "Todos operacionais",
      icon: Warehouse,
      tone: "primary" as const,
    },
    {
      label: "A Expirar em Breve",
      value: stats.expiringSoon.toLocaleString(),
      helper: "Dentro de 30 dias",
      icon: AlertTriangle,
      tone: "warning" as const,
    },
    {
      label: "Posições Disponíveis",
      value: stats.availablePositions.toLocaleString(),
      helper: "Pronto para novas amostras",
      icon: Calendar,
      tone: "primary" as const,
    },
  ]

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral da gestão de amostras do laboratório
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/samples/add">
          <Button className="w-full h-11 gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Nova Amostra
          </Button>
        </Link>
        <Link href="/samples">
          <Button variant="outline" className="w-full h-11 gap-2">
            <Search className="h-4 w-4" />
            Pesquisar Amostras
          </Button>
        </Link>
        <Link href="/freezers">
          <Button variant="outline" className="w-full h-11 gap-2">
            <Warehouse className="h-4 w-4" />
            Gerir Equipamentos
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p
                      className={cn(
                        "text-3xl font-bold mt-1.5",
                        stat.tone === "warning" ? "text-amber-600" : "text-foreground"
                      )}
                    >
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.helper}</p>
                  </div>
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      stat.tone === "warning" ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Samples */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Amostras Recentes</CardTitle>
            <CardDescription>As últimas amostras registadas no sistema</CardDescription>
          </div>
          <Link href="/samples">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              Ver todas
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentSamples.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <TestTube className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Ainda não há amostras registadas</p>
                <p className="text-sm text-muted-foreground">Comece por adicionar a primeira amostra.</p>
              </div>
              <Link href="/samples/add">
                <Button size="sm" className="mt-1 gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Amostra
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentSamples.map((sample) => (
                <div key={sample._id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{sample.patientCode}</span>
                      <Badge variant="secondary">{sample.sampleType}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{sample.project}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm text-muted-foreground">
                      Entrada: {new Date(sample.entryDate).toLocaleDateString("pt-PT")}
                    </p>
                    {isExpiringSoon(sample.expiryDate) ? (
                      <Badge variant="destructive" className="mt-1">
                        A Expirar em Breve
                      </Badge>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Expira: {new Date(sample.expiryDate).toLocaleDateString("pt-PT")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
