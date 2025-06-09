import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const sampleType = searchParams.get("sampleType")
    const project = searchParams.get("project")

    const query: any = {}

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

    const { db } = await connectToDatabase()

    const samples = await db.collection("samples").find(query).toArray()

    return NextResponse.json(samples)
  } catch (error) {
    console.error("Error fetching samples:", error)
    return NextResponse.json({ error: "Failed to fetch samples" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { db } = await connectToDatabase()

    // Verifica se já existe uma amostra na mesma localização
    const existingSample = await db.collection("samples").findOne({
      freezerId: body.freezerId,
      shelf: body.shelf,
      rightLeft: body.rightLeft,
      box: body.box,
      position: body.position,
    })

    if (existingSample) {
      return NextResponse.json(
        { error: "Localização já ocupada por outra amostra." },
        { status: 400 }
      )
    }

    const result = await db.collection("samples").insertOne({
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const newSample = await db.collection("samples").findOne({ _id: result.insertedId })

    // 3. Atualiza o campo `currentSamples` no freezer correspondente
    await db.collection("freezers").updateOne(
      { _id: new ObjectId(body.freezerId) },
      { $inc: { currentSamples: 1 } }
    )

    return NextResponse.json(newSample, { status: 201 })
  } catch (error) {
    console.error("Error creating sample:", error)
    return NextResponse.json({ error: "Failed to create sample" }, { status: 500 })
  }
}
