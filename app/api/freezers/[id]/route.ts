import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID do congelador inválido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const freezer = await db.collection("freezers").findOne({ _id: new ObjectId(id) })

    if (!freezer) {
      return NextResponse.json({ error: "Congelador não encontrada" }, { status: 404 })
    }

    return NextResponse.json(freezer)
  } catch (error) {
    console.error("Erro ao buscar o congelador:", error)
    return NextResponse.json({ error: "Erro ao buscar o congelador" }, { status: 500 })
  }
}