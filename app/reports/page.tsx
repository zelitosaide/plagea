"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Loader2, TrendingUp, AlertTriangle, AlertOctagon, Package, Building2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

type CountItem = { value: string; count: number; percentage: number }
type MonthCount = { month: string; count: number }
type EquipmentOccupancy = {
  _id: string
  code: string
  name: string
  type: string
  typeLabel: string
  capacity: number
  currentSamples: number
  utilizationPercentage: number
  isNearFull: boolean
}
type SampleSummary = {
  _id: string
  patientCode: string
  sampleType: string
  project: string
  expiryDate: string
  equipmentCode: string
}
type DepartmentComparison = {
  departmentId: string
  departmentName: string
  totalSamples: number
  totalEquipment: number
  utilizationPercentage: number
}
type ReportData = {
  range: { from: string; to: string }
  totalSamplesInRange: number
  samplesByType: CountItem[]
  samplesByProject: CountItem[]
  samplesOverTime: MonthCount[]
  equipmentOccupancy: EquipmentOccupancy[]
  expiringSoon: SampleSummary[]
  expiredNotDiscarded: SampleSummary[]
  departmentComparison?: DepartmentComparison[]
}

const utilizationColor = (percentage: number) => {
  if (percentage >= 90) return "text-destructive"
  if (percentage >= 75) return "text-amber-600"
  return "text-primary"
}

const daysBetween = (a: string, b: string) => Math.round((new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24))

const formatMonth = (month: string) => {
  const [year, m] = month.split("-")
  const date = new Date(Number(year), Number(m) - 1, 1)
  return date.toLocaleDateString("pt-PT", { month: "short", year: "2-digit" })
}

function defaultFrom() {
  const date = new Date()
  date.setMonth(date.getMonth() - 12)
  return date.toISOString().split("T")[0]
}

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

export default function ReportsPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === "superadmin"

  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(defaultFrom())
  const [to, setTo] = useState(todayStr())

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports?from=${from}&to=${to}`)
      .then((response) => (response.ok ? response.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [from, to])

  const today = useMemo(() => new Date().toISOString().split("T")[0], [])
  const avgUtilization = data?.equipmentOccupancy.length
    ? Math.round(
        data.equipmentOccupancy.reduce((sum, item) => sum + item.utilizationPercentage, 0) /
          data.equipmentOccupancy.length
      )
    : 0
  const maxMonthCount = Math.max(1, ...(data?.samplesOverTime.map((m) => m.count) || [1]))

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral da actividade de amostras e ocupação de equipamento
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="from" className="text-xs text-muted-foreground">De</Label>
            <Input id="from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to" className="text-xs text-muted-foreground">Até</Label>
            <Input id="to" type="date" value={to} min={from} max={todayStr()} onChange={(e) => setTo(e.target.value)} className="h-9" />
          </div>
        </div>
      </div>

      {loading || !data ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amostras no Período</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalSamplesInRange.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{from} a {to}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilização Média</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${utilizationColor(avgUtilization)}`}>{avgUtilization}%</div>
                <p className="text-xs text-muted-foreground">Em todo o equipamento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">A Expirar em Breve</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{data.expiringSoon.length}</div>
                <p className="text-xs text-muted-foreground">Dentro de 30 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiradas por Descartar</CardTitle>
                <AlertOctagon className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{data.expiredNotDiscarded.length}</div>
                <p className="text-xs text-muted-foreground">Risco de auditoria</p>
              </CardContent>
            </Card>
          </div>

          {/* Samples over time */}
          <Card>
            <CardHeader>
              <CardTitle>Amostras ao Longo do Tempo</CardTitle>
              <CardDescription>Entradas de amostras por mês, no período seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              {data.samplesOverTime.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem amostras neste período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="flex items-end gap-3 h-40 min-w-max px-1">
                    {data.samplesOverTime.map((item) => (
                      <div key={item.month} className="flex flex-col items-center justify-end gap-1 w-12 shrink-0">
                        <span className="text-xs font-medium text-foreground">{item.count}</span>
                        <div
                          className="w-6 rounded-t-sm bg-primary"
                          style={{ height: `${Math.max(4, (item.count / maxMonthCount) * 100)}px` }}
                        />
                        <span className="text-[11px] text-muted-foreground">{formatMonth(item.month)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Samples by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Amostras por Tipo</CardTitle>
                <CardDescription>Distribuição de tipos de amostra no período</CardDescription>
              </CardHeader>
              <CardContent>
                {data.samplesByType.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados neste período.</p>
                ) : (
                  <div className="space-y-4">
                    {data.samplesByType.map((item) => (
                      <div key={item.value} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Badge variant="secondary" className="shrink-0">{item.value}</Badge>
                          <span className="text-sm font-medium text-muted-foreground shrink-0">{item.count}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Progress value={item.percentage} className="w-20 h-2" />
                          <span className="text-sm text-muted-foreground w-9 text-right">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Samples by Project */}
            <Card>
              <CardHeader>
                <CardTitle>Amostras por Projecto</CardTitle>
                <CardDescription>Distribuição por projecto de investigação no período</CardDescription>
              </CardHeader>
              <CardContent>
                {data.samplesByProject.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados neste período.</p>
                ) : (
                  <div className="space-y-4">
                    {data.samplesByProject.map((item) => (
                      <div key={item.value} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                          <span className="text-sm font-medium truncate">{item.value}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm text-muted-foreground">{item.count}</span>
                          <Progress value={item.percentage} className="w-20 h-2" />
                          <span className="text-sm text-muted-foreground w-9 text-right">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Equipment occupancy */}
          <Card>
            <CardHeader>
              <CardTitle>Ocupação de Equipamento</CardTitle>
              <CardDescription>Estado actual de todos os congeladores, arquivos de blocos e arquivos de lâminas</CardDescription>
            </CardHeader>
            <CardContent>
              {data.equipmentOccupancy.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem equipamento registado.</p>
              ) : (
                <div className="space-y-4">
                  {data.equipmentOccupancy.map((item) => (
                    <div key={item._id} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium truncate">{item.code} - {item.name}</span>
                          <Badge variant="outline" className="shrink-0">{item.typeLabel}</Badge>
                          {item.isNearFull && (
                            <Badge variant="destructive" className="shrink-0 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Quase cheio
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground shrink-0">
                          {item.currentSamples}/{item.capacity} ({item.utilizationPercentage}%)
                        </span>
                      </div>
                      <Progress value={item.utilizationPercentage} className={`h-2 ${utilizationColor(item.utilizationPercentage)}`} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expiring soon */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  A Expirar em Breve
                </CardTitle>
                <CardDescription>Amostras que requerem atenção imediata (próximos 30 dias)</CardDescription>
              </CardHeader>
              <CardContent>
                {data.expiringSoon.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma amostra a expirar em breve.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {data.expiringSoon.map((sample) => (
                      <div key={sample._id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{sample.patientCode}</div>
                          <div className="text-sm text-muted-foreground truncate">{sample.sampleType} · {sample.equipmentCode}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-medium text-amber-600">
                            {daysBetween(sample.expiryDate, today)} dias
                          </div>
                          <div className="text-xs text-muted-foreground">{sample.expiryDate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expired, not discarded */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertOctagon className="h-5 w-5 text-destructive" />
                  Expiradas por Descartar
                </CardTitle>
                <CardDescription>Já passaram da validade mas continuam registadas — rever para conformidade</CardDescription>
              </CardHeader>
              <CardContent>
                {data.expiredNotDiscarded.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma amostra expirada pendente.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {data.expiredNotDiscarded.map((sample) => (
                      <div key={sample._id} className="flex items-center justify-between p-3 border border-destructive/30 bg-destructive/5 rounded-lg">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{sample.patientCode}</div>
                          <div className="text-sm text-muted-foreground truncate">{sample.sampleType} · {sample.equipmentCode}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-medium text-destructive">
                            {daysBetween(today, sample.expiryDate)} dias expirada
                          </div>
                          <div className="text-xs text-muted-foreground">{sample.expiryDate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Department comparison (superadmin only) */}
          {isSuperAdmin && data.departmentComparison && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Visão Institucional
                </CardTitle>
                <CardDescription>Comparação entre todos os departamentos</CardDescription>
              </CardHeader>
              <CardContent>
                {data.departmentComparison.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum departamento registado.</p>
                ) : (
                  <div className="space-y-4">
                    {data.departmentComparison.map((dept) => (
                      <div key={dept.departmentId} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">{dept.departmentName}</span>
                          <span className="text-sm text-muted-foreground">
                            {dept.totalSamples} amostras · {dept.totalEquipment} equipamentos · {dept.utilizationPercentage}%
                          </span>
                        </div>
                        <Progress value={dept.utilizationPercentage} className={`h-2 ${utilizationColor(dept.utilizationPercentage)}`} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
