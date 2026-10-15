import { type NextRequest, NextResponse } from "next/server"
import { getDepartmentFilter, requireSession } from "@/lib/auth"
import { EQUIPMENT_TYPES, type EquipmentType } from "@/lib/equipment-types"

export async function GET(request: NextRequest) {
  const auth = await requireSession(request)
  if (!auth.ok) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    const query: Record<string, unknown> = { ...getDepartmentFilter(auth.session) }
    if (type) {
      query.type = type
    }

    const equipment = await auth.db.collection("equipment").find(query).sort({ createdAt: -1 }).toArray()

    const equipmentWithCounts = equipment.map((item) => {
      const typeConfig = EQUIPMENT_TYPES[item.type as EquipmentType] || EQUIPMENT_TYPES.freezer
      const code = `${typeConfig.prefix}${item.code}`
      const utilizationPercentage = item.capacity
        ? Math.round((item.currentSamples / item.capacity) * 100)
        : 0

      return {
        ...item,
        code,
        utilizationPercentage,
        lastMaintenance: `2025-01-${10 + item.code}`,
      }
    })

    return NextResponse.json(equipmentWithCounts)
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const type: EquipmentType = body.type in EQUIPMENT_TYPES ? body.type : "freezer"

    // Um admin de departamento só cria equipamento no seu próprio
    // departamento; só o superadmin escolhe explicitamente o departamento.
    const isSuperAdmin = auth.session.role === "superadmin"
    const departmentId: string | null = isSuperAdmin
      ? typeof body.departmentId === "string"
        ? body.departmentId
        : null
      : auth.session.departmentId

    if (!departmentId) {
      return NextResponse.json({ error: "Departamento é obrigatório" }, { status: 400 })
    }

    // Numeração por departamento + tipo: cada departamento tem o seu
    // próprio F1, AB1, AL1 — isolados, por isso números repetidos entre
    // departamentos são normais e esperados.
    const lastOfType = await auth.db
      .collection("equipment")
      .find({ departmentId, type })
      .sort({ code: -1 })
      .limit(1)
      .toArray()

    const newCode = lastOfType.length > 0 ? lastOfType[0].code + 1 : 1

    const now = new Date().toISOString()
    const result = await auth.db.collection("equipment").insertOne({
      ...body,
      type,
      departmentId,
      code: newCode,
      currentSamples: 0,
      status: "operational",
      createdAt: now,
      updatedAt: now,
    })

    const newEquipment = await auth.db.collection("equipment").findOne({ _id: result.insertedId })

    return NextResponse.json(newEquipment, { status: 201 })
  } catch (error) {
    console.error("Error creating equipment:", error)
    return NextResponse.json({ error: "Failed to create equipment" }, { status: 500 })
  }
}
