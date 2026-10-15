import { type NextRequest, NextResponse } from "next/server"
import { getDepartmentFilter, requireSession } from "@/lib/auth"
import { EQUIPMENT_TYPES, type EquipmentType } from "@/lib/equipment-types"

// Formato "YYYY-MM-DD" (consistente com o formato já usado em entryDate/
// expiryDate nos documentos de samples).
function toDateOnly(date: Date): string {
  return date.toISOString().split("T")[0]
}

function monthKey(dateOnly: string): string {
  return dateOnly.slice(0, 7) // "YYYY-MM"
}

export async function GET(request: NextRequest) {
  const auth = await requireSession(request)
  if (!auth.ok) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const departmentFilter = getDepartmentFilter(auth.session)
    const today = toDateOnly(new Date())

    // Intervalo de datas para as métricas de actividade (entradas de
    // amostras por tipo/projecto/mês). Por omissão, os últimos 12 meses —
    // mas é um intervalo livre, não "mensal" nem "anual" fixos.
    const defaultFrom = new Date()
    defaultFrom.setMonth(defaultFrom.getMonth() - 12)
    const from = searchParams.get("from") || toDateOnly(defaultFrom)
    const to = searchParams.get("to") || today

    const samplesInRange = await auth.db
      .collection("samples")
      .find({ ...departmentFilter, entryDate: { $gte: from, $lte: to } })
      .toArray()

    const countBy = (key: "sampleType" | "project") => {
      const counts = new Map<string, number>()
      for (const sample of samplesInRange) {
        const value = sample[key] || "—"
        counts.set(value, (counts.get(value) || 0) + 1)
      }
      const total = samplesInRange.length || 1
      return Array.from(counts.entries())
        .map(([value, count]) => ({ value, count, percentage: Math.round((count / total) * 100) }))
        .sort((a, b) => b.count - a.count)
    }

    const samplesByType = countBy("sampleType")
    const samplesByProject = countBy("project")

    const monthCounts = new Map<string, number>()
    for (const sample of samplesInRange) {
      if (!sample.entryDate) continue
      const key = monthKey(sample.entryDate)
      monthCounts.set(key, (monthCounts.get(key) || 0) + 1)
    }
    const samplesOverTime = Array.from(monthCounts.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Ocupação de equipamento: estado actual (não depende do intervalo de
    // datas), agrupado por tipo.
    const equipment = await auth.db.collection("equipment").find(departmentFilter).toArray()
    const equipmentOccupancy = equipment
      .map((item) => {
        const typeConfig = EQUIPMENT_TYPES[item.type as EquipmentType] || EQUIPMENT_TYPES.freezer
        const capacity = item.capacity || 0
        const currentSamples = item.currentSamples || 0
        const utilizationPercentage = capacity ? Math.round((currentSamples / capacity) * 100) : 0
        return {
          _id: item._id.toString(),
          code: `${typeConfig.prefix}${item.code}`,
          name: item.name,
          type: item.type,
          typeLabel: typeConfig.label,
          capacity,
          currentSamples,
          utilizationPercentage,
          isNearFull: utilizationPercentage >= (item.capacityThreshold ?? 90),
        }
      })
      .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage)

    // Validade/conformidade: olha sempre para "hoje", independentemente do
    // intervalo de datas escolhido para a actividade.
    const in30Days = new Date()
    in30Days.setDate(in30Days.getDate() + 30)

    const expiringSoon = await auth.db
      .collection("samples")
      .find({ ...departmentFilter, expiryDate: { $gte: today, $lte: toDateOnly(in30Days) } })
      .sort({ expiryDate: 1 })
      .toArray()

    const expiredNotDiscarded = await auth.db
      .collection("samples")
      .find({ ...departmentFilter, expiryDate: { $lt: today } })
      .sort({ expiryDate: 1 })
      .toArray()

    const projectSample = (sample: any) => ({
      _id: sample._id.toString(),
      patientCode: sample.patientCode,
      sampleType: sample.sampleType,
      project: sample.project,
      expiryDate: sample.expiryDate,
      equipmentCode: sample.equipmentCode,
    })

    // Visão institucional: só para superadmin, comparação entre todos os
    // departamentos.
    let departmentComparison: unknown[] | undefined
    if (auth.session.role === "superadmin") {
      const departments = await auth.db.collection("departments").find().toArray()
      departmentComparison = await Promise.all(
        departments.map(async (dept) => {
          const deptFilter = { departmentId: dept._id.toString() }
          const [totalSamples, deptEquipment] = await Promise.all([
            auth.db.collection("samples").countDocuments(deptFilter),
            auth.db.collection("equipment").find(deptFilter).toArray(),
          ])
          const totalCapacity = deptEquipment.reduce((sum, item) => sum + (item.capacity || 0), 0)
          const totalCurrentSamples = deptEquipment.reduce((sum, item) => sum + (item.currentSamples || 0), 0)
          return {
            departmentId: dept._id.toString(),
            departmentName: dept.name,
            totalSamples,
            totalEquipment: deptEquipment.length,
            utilizationPercentage: totalCapacity ? Math.round((totalCurrentSamples / totalCapacity) * 100) : 0,
          }
        })
      )
    }

    return NextResponse.json({
      range: { from, to },
      totalSamplesInRange: samplesInRange.length,
      samplesByType,
      samplesByProject,
      samplesOverTime,
      equipmentOccupancy,
      expiringSoon: expiringSoon.map(projectSample),
      expiredNotDiscarded: expiredNotDiscarded.map(projectSample),
      departmentComparison,
    })
  } catch (error) {
    console.error("Failed to fetch reports:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}
