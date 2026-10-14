import { connectToDatabase } from "@/lib/mongodb"
import { type NextRequest, NextResponse } from "next/server"

// Uma "box" é identificada pela combinação freezerId+shelf+rightLeft+box
// (a mesma chave já usada para saber se uma posição está ocupada). Não é
// uma colecção pré-populada: só passa a existir quando alguém define as
// suas dimensões pela primeira vez.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const freezerId = searchParams.get("freezerId")
    const shelf = searchParams.get("shelf")
    const rightLeft = searchParams.get("rightLeft")
    const box = searchParams.get("box")

    if (!freezerId || !shelf || !rightLeft || !box) {
      return NextResponse.json(
        { error: "freezerId, shelf, rightLeft e box são obrigatórios" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    const boxConfig = await db.collection("boxes").findOne({ freezerId, shelf, rightLeft, box })

    return NextResponse.json(boxConfig)
  } catch (error) {
    console.error("Error fetching box config:", error)
    return NextResponse.json({ error: "Failed to fetch box config" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { freezerId, shelf, rightLeft, box, rows, columns } = body

    if (!freezerId || !shelf || !rightLeft || !box || !rows || !columns) {
      return NextResponse.json({ error: "Dados em falta" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const now = new Date().toISOString()

    await db.collection("boxes").updateOne(
      { freezerId, shelf, rightLeft, box },
      {
        $set: { freezerId, shelf, rightLeft, box, rows, columns, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    )

    const updated = await db.collection("boxes").findOne({ freezerId, shelf, rightLeft, box })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error saving box config:", error)
    return NextResponse.json({ error: "Failed to save box config" }, { status: 500 })
  }
}
