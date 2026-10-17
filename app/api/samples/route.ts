import { ObjectId } from "mongodb"
import { type NextRequest, NextResponse } from "next/server"
import { getDepartmentFilter, requireSession } from "@/lib/auth"
import { findConflicts, reserveSlots } from "@/lib/sample-slots"

export async function GET(request: NextRequest) {
  const auth = await requireSession(request)
  if (!auth.ok) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const sampleType = searchParams.get("sampleType")
    const project = searchParams.get("project")
    const equipmentId = searchParams.get("equipmentId")

    const query: any = { ...getDepartmentFilter(auth.session) }

    if (equipmentId) {
      query.equipmentId = equipmentId
    }

    // Search term (patientCode, sampleType, project, notes)
    if (search) {
      const regex = new RegExp(search, "i") // case-insensitive
      query.$or = [
        { patientCode: regex },
        { sampleType: regex },
        { project: regex },
        { notes: regex },
      ]
    }

    // Case-insensitive sampleType filter
    if (sampleType && sampleType !== "all") {
      query.sampleType = new RegExp(`^${sampleType}$`, "i")
    }

    // Case-insensitive project filter
    if (project && project !== "all") {
      query.project = new RegExp(`^${project}$`, "i")
    }

    const samples = await auth.db.collection("samples").find(query).toArray()

    return NextResponse.json(samples)
  } catch (error) {
    console.error("Error fetching samples:", error)
    return NextResponse.json({ error: "Failed to fetch samples" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const departmentFilter = getDepartmentFilter(auth.session)

    // O equipamento referenciado tem de pertencer ao mesmo departamento.
    if (!ObjectId.isValid(body.equipmentId)) {
      return NextResponse.json({ error: "Equipamento inválido" }, { status: 400 })
    }
    const equipment = await auth.db
      .collection("equipment")
      .findOne({ _id: new ObjectId(body.equipmentId), ...departmentFilter })
    if (!equipment) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    }

    const positions: unknown = body.positions
    if (
      !Array.isArray(positions) ||
      positions.length === 0 ||
      !positions.every((p) => Number.isInteger(p) && p > 0) ||
      new Set(positions).size !== positions.length
    ) {
      return NextResponse.json({ error: "Posições inválidas" }, { status: 400 })
    }

    // Verifica se alguma das posições pedidas já está ocupada por outra amostra
    const conflicts = await findConflicts(auth.db, body.equipmentId, body.path, positions)
    if (conflicts.length > 0) {
      const conflictingSample = await auth.db
        .collection("samples")
        .findOne({ _id: new ObjectId(conflicts[0].sampleId) })
      return NextResponse.json(
        {
          error: `Posição(ões) ${conflicts.map((c) => `P${c.position}`).join(", ")} já ocupada(s) por ${
            conflictingSample?.patientCode || "outra amostra"
          }.`,
        },
        { status: 400 }
      )
    }

    const departmentId = auth.session.role === "superadmin" ? equipment.departmentId : auth.session.departmentId

    const result = await auth.db.collection("samples").insertOne({
      ...body,
      positions,
      departmentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const reserveResult = await reserveSlots(auth.db, {
      sampleId: result.insertedId,
      equipmentId: body.equipmentId,
      path: body.path,
      positions,
    })

    if (!reserveResult.ok) {
      await auth.db.collection("samples").deleteOne({ _id: result.insertedId })
      return NextResponse.json(
        { error: "Conflito de concorrência ao reservar a posição. Tente novamente." },
        { status: 409 }
      )
    }

    const newSample = await auth.db.collection("samples").findOne({ _id: result.insertedId })

    await auth.db.collection("equipment").updateOne(
      { _id: new ObjectId(body.equipmentId) },
      { $inc: { currentSamples: positions.length } }
    )

    return NextResponse.json(newSample, { status: 201 })
  } catch (error) {
    console.error("Error creating sample:", error)
    return NextResponse.json({ error: "Failed to create sample" }, { status: 500 })
  }
}
