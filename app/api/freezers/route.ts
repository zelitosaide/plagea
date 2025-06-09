import { connectToDatabase } from "@/lib/mongodb"
import { type NextRequest, NextResponse } from "next/server"


export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const freezers = await db.collection("freezers").find({}).sort({ createdAt: -1 }).toArray()

    const freezersWithCounts = freezers.map((freezer) => {
      const code = `F${freezer.code}`
      const currentSamples = freezer.currentSamples
      const utilizationPercentage = Math.round((currentSamples / freezer.capacity) * 100)

      return {
        ...freezer,
        code,
        currentSamples,
        utilizationPercentage,
        lastMaintenance: `2025-01-${10 + freezer.code}`,
      }
    })

    return NextResponse.json(freezersWithCounts)
    // return NextResponse.json(freezers)
  } catch (error) {
    console.error("Error fetching freezers:", error)
    return NextResponse.json({ error: "Failed to fetch freezers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { db } = await connectToDatabase()

    // 🟡 Buscar o último freezer criado, ordenado por code desc
    const lastFreezer = await db
      .collection("freezers")
      .find({})
      .sort({ code: -1 }) // Ordenar do maior para o menor
      .limit(1)
      .toArray();

    const newCode = lastFreezer.length > 0 ? lastFreezer[0].code + 1 : 1;

    const result = await db.collection("freezers").insertOne({
      ...body,
      code: newCode,
      currentSamples: 0,
      // "maintenance" | "operational"
      status: "operational",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const newFreezer = await db.collection("freezers").findOne({ _id: result.insertedId })

    return NextResponse.json(newFreezer, { status: 201 })
  } catch (error) {
    console.error("Error creating freezer:", error)
    return NextResponse.json({ error: "Failed to create freezer" }, { status: 500 })
  }
}
