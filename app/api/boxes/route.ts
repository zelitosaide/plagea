import { type NextRequest, NextResponse } from "next/server"
import { ObjectId, type Db } from "mongodb"
import { getDepartmentFilter, requireSession } from "@/lib/auth"
import { toPathKey } from "@/lib/equipment-types"

// Uma "box" é identificada pela combinação equipmentId+pathKey (pathKey =
// os níveis de localização, ex. ["S1","D","B1"], unidos por "/"). Não é
// uma colecção pré-populada: só passa a existir quando alguém define as
// suas dimensões pela primeira vez.

async function verifyEquipmentOwnership(db: Db, equipmentId: string, departmentFilter: Record<string, unknown>) {
  if (!ObjectId.isValid(equipmentId)) return false
  const equipment = await db.collection("equipment").findOne({ _id: new ObjectId(equipmentId), ...departmentFilter })
  return !!equipment
}

export async function GET(request: NextRequest) {
  const auth = await requireSession(request)
  if (!auth.ok) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const equipmentId = searchParams.get("equipmentId")
    const pathParam = searchParams.get("path")

    if (!equipmentId || !pathParam) {
      return NextResponse.json({ error: "equipmentId e path são obrigatórios" }, { status: 400 })
    }

    const departmentFilter = getDepartmentFilter(auth.session)
    const owned = await verifyEquipmentOwnership(auth.db, equipmentId, departmentFilter)
    if (!owned) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    }

    const boxConfig = await auth.db.collection("boxes").findOne({ equipmentId, pathKey: pathParam })

    return NextResponse.json(boxConfig)
  } catch (error) {
    console.error("Error fetching box config:", error)
    return NextResponse.json({ error: "Failed to fetch box config" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { equipmentId, path, rows, columns } = body

    if (!equipmentId || !Array.isArray(path) || path.length === 0 || !rows || !columns) {
      return NextResponse.json({ error: "Dados em falta" }, { status: 400 })
    }

    const departmentFilter = getDepartmentFilter(auth.session)
    const owned = await verifyEquipmentOwnership(auth.db, equipmentId, departmentFilter)
    if (!owned) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    }

    const pathKey = toPathKey(path)
    const now = new Date().toISOString()

    await auth.db.collection("boxes").updateOne(
      { equipmentId, pathKey },
      {
        $set: { equipmentId, path, pathKey, rows, columns, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    )

    const updated = await auth.db.collection("boxes").findOne({ equipmentId, pathKey })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error saving box config:", error)
    return NextResponse.json({ error: "Failed to save box config" }, { status: 500 })
  }
}
