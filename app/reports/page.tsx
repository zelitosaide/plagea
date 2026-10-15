"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import {
  Loader2,
  TrendingUp,
  AlertTriangle,
  AlertOctagon,
  Package,
  Building2,
  Download,
  Printer,
} from "lucide-react"
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

const utilizationFill = (percentage: number) => {
  if (percentage >= 90) return "hsl(var(--destructive))"
  if (percentage >= 75) return "#d97706"
  return "hsl(var(--chart-2))"
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

// Escapa um valor para uma célula CSV (RFC 4180): envolve em aspas sempre
// que contiver vírgulas, aspas ou quebras de linha.
function csvCell(value: string | number): string {
  const text = String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function buildReportCSV(data: ReportData, isSuperAdmin: boolean): string {
  const lines: string[] = []
  const section = (title: string, headers: string[], rows: (string | number)[][]) => {
    lines.push(title)
    lines.push(headers.map(csvCell).join(","))
    rows.forEach((row) => lines.push(row.map(csvCell).join(",")))
    lines.push("")
  }

  lines.push(`Relatório PlaGeA — ${data.range.from} a ${data.range.to}`)
  lines.push("")

  section(
    "Resumo",
    ["Métrica", "Valor"],
    [
      ["Amostras no Período", data.totalSamplesInRange],
      ["A Expirar em Breve (30 dias)", data.expiringSoon.length],
      ["Expiradas por Descartar", data.expiredNotDiscarded.length],
    ]
  )

  section(
    "Amostras por Tipo",
    ["Tipo", "Quantidade", "Percentagem"],
    data.samplesByType.map((item) => [item.value, item.count, `${item.percentage}%`])
  )

  section(
    "Amostras por Projecto",
    ["Projecto", "Quantidade", "Percentagem"],
    data.samplesByProject.map((item) => [item.value, item.count, `${item.percentage}%`])
  )

  section(
    "Amostras por Mês",
    ["Mês", "Quantidade"],
    data.samplesOverTime.map((item) => [item.month, item.count])
  )

  section(
    "Ocupação de Equipamento",
    ["Código", "Nome", "Tipo", "Amostras", "Capacidade", "Utilização %"],
    data.equipmentOccupancy.map((item) => [
      item.code,
      item.name,
      item.typeLabel,
      item.currentSamples,
      item.capacity,
      item.utilizationPercentage,
    ])
  )

  section(
    "A Expirar em Breve",
    ["Paciente", "Tipo", "Projecto", "Equipamento", "Data de Validade"],
    data.expiringSoon.map((s) => [s.patientCode, s.sampleType, s.project, s.equipmentCode, s.expiryDate])
  )

  section(
    "Expiradas por Descartar",
    ["Paciente", "Tipo", "Projecto", "Equipamento", "Data de Validade"],
    data.expiredNotDiscarded.map((s) => [s.patientCode, s.sampleType, s.project, s.equipmentCode, s.expiryDate])
  )

  if (isSuperAdmin && data.departmentComparison) {
    section(
      "Visão Institucional",
      ["Departamento", "Amostras", "Equipamentos", "Utilização %"],
      data.departmentComparison.map((d) => [d.departmentName, d.totalSamples, d.totalEquipment, d.utilizationPercentage])
    )
  }

  return lines.join("\n")
}

// Uma única cor (o teal primário da app) para todos os gráficos de
// contagem simples — mantém a identidade visual consistente em vez do
// arco-íris genérico de chart-1/2/3 do shadcn. As cores de
// semáforo (vermelho/âmbar/verde) ficam reservadas para os gráficos de
// utilização, onde a cor é sinal, não decoração.
const countChartConfig = { count: { label: "Amostras", color: "hsl(var(--primary))" } } satisfies ChartConfig
const utilizationChartConfig = { utilizationPercentage: { label: "Utilização %" } } satisfies ChartConfig

function truncateLabel(value: string, max = 20): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
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

  const handleExportCSV = () => {
    if (!data) return
    const csv = buildReportCSV(data, isSuperAdmin)
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `relatorio-plagea_${from}_a_${to}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const timeChartData = data?.samplesOverTime.map((item) => ({ month: formatMonth(item.month), count: item.count })) || []
  const typeChartData = data?.samplesByType.map((item) => ({ name: item.value, count: item.count, percentage: item.percentage })) || []
  const projectChartData = data?.samplesByProject.map((item) => ({ name: item.value, count: item.count, percentage: item.percentage })) || []
  const occupancyChartData = data?.equipmentOccupancy.map((item) => ({
    name: `${item.code} - ${item.name}`,
    utilizationPercentage: item.utilizationPercentage,
    isNearFull: item.isNearFull,
  })) || []
  const departmentChartData = data?.departmentComparison?.map((d) => ({
    name: d.departmentName,
    utilizationPercentage: d.utilizationPercentage,
  })) || []

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral da actividade de amostras e ocupação de equipamento
          </p>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1">
            <Label htmlFor="from" className="text-xs text-muted-foreground">De</Label>
            <Input id="from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to" className="text-xs text-muted-foreground">Até</Label>
            <Input id="to" type="date" value={to} min={from} max={todayStr()} onChange={(e) => setTo(e.target.value)} className="h-9" />
          </div>
          <Button variant="outline" className="h-9 gap-2" onClick={handleExportCSV} disabled={!data}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" className="h-9 gap-2" onClick={() => window.print()} disabled={!data}>
            <Printer className="h-4 w-4" />
            Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* Visível apenas na impressão/exportação para PDF, para dar contexto ao período coberto */}
      {data && (
        <p className="hidden print:block text-sm text-muted-foreground">
          Relatório PlaGeA — período de {data.range.from} a {data.range.to}
        </p>
      )}

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
          <Card className="print:break-inside-avoid">
            <CardHeader>
              <CardTitle>Amostras ao Longo do Tempo</CardTitle>
              <CardDescription>Entradas de amostras por mês, no período seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              {timeChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem amostras neste período.</p>
              ) : (
                // Com um intervalo de datas longo, muitos meses espremidos na
                // largura do cartão sobrepunham-se; cada mês passa a ter uma
                // largura mínima garantida, com scroll horizontal se não couber.
                <div className="overflow-x-auto print:overflow-visible">
                  <div style={{ minWidth: Math.max(100, timeChartData.length * 64) }}>
                    <ChartContainer config={countChartConfig} className="aspect-auto h-64 w-full">
                      <BarChart data={timeChartData} margin={{ top: 24, right: 8, left: -16 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} interval={0} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                        <ChartTooltip content={<ChartTooltipContent hideLabel={false} />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                        <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} maxBarSize={48}>
                          <LabelList dataKey="count" position="top" offset={8} className="fill-foreground text-xs font-medium" />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Samples by Type */}
            <Card className="print:break-inside-avoid">
              <CardHeader>
                <CardTitle>Amostras por Tipo</CardTitle>
                <CardDescription>Distribuição de tipos de amostra no período</CardDescription>
              </CardHeader>
              <CardContent>
                {typeChartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados neste período.</p>
                ) : (
                  <ChartContainer
                    config={countChartConfig}
                    className="aspect-auto w-full"
                    style={{ height: Math.max(140, typeChartData.length * 44) }}
                  >
                    <BarChart data={typeChartData} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 4 }} barCategoryGap={10}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                      <XAxis type="number" hide allowDecimals={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        width={128}
                        interval={0}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value: string) => truncateLabel(value, 15)}
                      />
                      <ChartTooltip
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                        content={<ChartTooltipContent />}
                        formatter={(value, _name, item) => `${value} amostras (${item.payload.percentage}%)`}
                      />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} maxBarSize={22}>
                        <LabelList dataKey="count" position="right" offset={8} className="fill-foreground text-xs font-medium" />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Samples by Project */}
            <Card className="print:break-inside-avoid">
              <CardHeader>
                <CardTitle>Amostras por Projecto</CardTitle>
                <CardDescription>Distribuição por projecto de investigação no período</CardDescription>
              </CardHeader>
              <CardContent>
                {projectChartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados neste período.</p>
                ) : (
                  <ChartContainer
                    config={countChartConfig}
                    className="aspect-auto w-full"
                    style={{ height: Math.max(140, projectChartData.length * 44) }}
                  >
                    <BarChart data={projectChartData} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 4 }} barCategoryGap={10}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                      <XAxis type="number" hide allowDecimals={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        width={128}
                        interval={0}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value: string) => truncateLabel(value, 15)}
                      />
                      <ChartTooltip
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                        content={<ChartTooltipContent />}
                        formatter={(value, _name, item) => `${value} amostras (${item.payload.percentage}%)`}
                      />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} maxBarSize={22}>
                        <LabelList dataKey="count" position="right" offset={8} className="fill-foreground text-xs font-medium" />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Equipment occupancy */}
          <Card className="print:break-inside-avoid">
            <CardHeader>
              <CardTitle>Ocupação de Equipamento</CardTitle>
              <CardDescription>Estado actual de todos os congeladores, arquivos de blocos e arquivos de lâminas</CardDescription>
            </CardHeader>
            <CardContent>
              {occupancyChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem equipamento registado.</p>
              ) : (
                <>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-xs bg-primary" /> Normal
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-xs bg-amber-600" /> Alto (≥75%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-xs bg-destructive" /> Quase cheio (≥90%)
                    </span>
                  </div>
                  <ChartContainer
                    config={utilizationChartConfig}
                    className="aspect-auto w-full"
                    style={{ height: Math.max(140, occupancyChartData.length * 44) }}
                  >
                    <BarChart data={occupancyChartData} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 4 }} barCategoryGap={10}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        width={160}
                        interval={0}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value: string) => truncateLabel(value, 18)}
                      />
                      <ChartTooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} content={<ChartTooltipContent />} formatter={(value) => `${value}%`} />
                      <Bar dataKey="utilizationPercentage" radius={[0, 6, 6, 0]} maxBarSize={22}>
                        {occupancyChartData.map((item, index) => (
                          <Cell key={index} fill={utilizationFill(item.utilizationPercentage)} />
                        ))}
                        <LabelList
                          dataKey="utilizationPercentage"
                          position="right"
                          offset={8}
                          className="fill-foreground text-xs font-medium"
                          formatter={(v: number) => `${v}%`}
                        />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expiring soon */}
            <Card className="print:break-inside-avoid">
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
                  <div className="space-y-3 max-h-96 overflow-y-auto print:max-h-none">
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
            <Card className="print:break-inside-avoid">
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
                  <div className="space-y-3 max-h-96 overflow-y-auto print:max-h-none">
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
            <Card className="print:break-inside-avoid">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Visão Institucional
                </CardTitle>
                <CardDescription>Comparação entre todos os departamentos</CardDescription>
              </CardHeader>
              <CardContent>
                {departmentChartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum departamento registado.</p>
                ) : (
                  <ChartContainer
                    config={utilizationChartConfig}
                    className="aspect-auto w-full"
                    style={{ height: Math.max(140, departmentChartData.length * 44) }}
                  >
                    <BarChart data={departmentChartData} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 4 }} barCategoryGap={10}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        width={130}
                        interval={0}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value: string) => truncateLabel(value, 14)}
                      />
                      <ChartTooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} content={<ChartTooltipContent />} formatter={(value) => `${value}%`} />
                      <Bar dataKey="utilizationPercentage" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {departmentChartData.map((item, index) => (
                          <Cell key={index} fill={utilizationFill(item.utilizationPercentage)} />
                        ))}
                        <LabelList
                          dataKey="utilizationPercentage"
                          position="right"
                          offset={8}
                          className="fill-foreground text-xs font-medium"
                          formatter={(v: number) => `${v}%`}
                        />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
