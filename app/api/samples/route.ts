import { ObjectId } from "mongodb"
import { type NextRequest, NextResponse } from "next/server"
import { getDepartmentFilter, requireSession } from "@/lib/auth"

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

    // Verifica se já existe uma amostra na mesma localização
    const existingSample = await auth.db.collection("samples").findOne({
      equipmentId: body.equipmentId,
      path: body.path,
      position: body.position,
    })

    if (existingSample) {
      return NextResponse.json(
        { error: "Localização já ocupada por outra amostra." },
        { status: 400 }
      )
    }

    const departmentId = auth.session.role === "superadmin" ? equipment.departmentId : auth.session.departmentId

    const result = await auth.db.collection("samples").insertOne({
      ...body,
      departmentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const newSample = await auth.db.collection("samples").findOne({ _id: result.insertedId })

    await auth.db.collection("equipment").updateOne(
      { _id: new ObjectId(body.equipmentId) },
      { $inc: { currentSamples: 1 } }
    )

    return NextResponse.json(newSample, { status: 201 })
  } catch (error) {
    console.error("Error creating sample:", error)
    return NextResponse.json({ error: "Failed to create sample" }, { status: 500 })
  }
}
