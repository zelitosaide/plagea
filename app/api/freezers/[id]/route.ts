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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid freezer ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Find the sample to get the freezerId before deleting
    const freezer = await db.collection("freezers").findOne({ _id: new ObjectId(id) })
    if (!freezer) {
      return NextResponse.json({ error: "Freezer not found" }, { status: 404 })
    }

    const result = await db.collection("freezers").deleteOne({ _id: new ObjectId(id) })
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Freezer not found" }, { status: 404 })
    }

    // Delete all samples associated with this freezer
    await db.collection("samples").deleteMany({ freezerId: id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting freezer:", error)
    return NextResponse.json({ error: "Failed to delete freezer" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID do congelador inválido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const body = await request.json()

    const freezerData = {
      ...body,
      updatedAt: new Date().toISOString(),
    }

    delete freezerData._id // Remove _id if it exists in the body

    const result = await db.collection("freezers").updateOne(
      { _id: new ObjectId(id) },
      { $set: freezerData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Congelador não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao atualizar o congelador:", error)
    return NextResponse.json({ error: "Erro ao atualizar o congelador" }, { status: 500 })
  }
}