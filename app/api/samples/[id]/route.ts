import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de amostra inválido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const sample = await db.collection("samples").findOne({ _id: new ObjectId(id) })

    if (!sample) {
      return NextResponse.json({ error: "Amostra não encontrada" }, { status: 404 })
    }

    return NextResponse.json(sample)
  } catch (error) {
    console.error("Erro ao buscar a amostra:", error)
    return NextResponse.json({ error: "Erro ao buscar a amostra" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid sample ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Find the sample to get the freezerId before deleting
    const sample = await db.collection("samples").findOne({ _id: new ObjectId(id) })
    if (!sample) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 })
    }

    const result = await db.collection("samples").deleteOne({ _id: new ObjectId(id) })
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 })
    }

    // Decrease the freezer's currentSamples count
    if (sample.freezerId && ObjectId.isValid(sample.freezerId)) {
      await db.collection("freezers").updateOne(
        { _id: new ObjectId(sample.freezerId) },
        { $inc: { currentSamples: -1 } }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting sample:", error)
    return NextResponse.json({ error: "Failed to delete sample" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid sample ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Fetch the current sample
    const currentSample = await db.collection("samples").findOne({ _id: new ObjectId(id) })
    if (!currentSample) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 })
    }

    const oldFreezerId = currentSample.freezerId?.toString()
    const newFreezerId = body.freezerId

    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
    }

    delete updateData._id

    // Update the sample
    const result = await db.collection("samples").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Sample not found after update" }, { status: 404 })
    }

    // If freezer has changed, update both freezers
    if (newFreezerId && newFreezerId !== oldFreezerId) {
      if (ObjectId.isValid(oldFreezerId)) {
        await db.collection("freezers").updateOne(
          { _id: new ObjectId(oldFreezerId) },
          { $inc: { currentSamples: -1 } }
        )
      }

      if (ObjectId.isValid(newFreezerId)) {
        await db.collection("freezers").updateOne(
          { _id: new ObjectId(newFreezerId) },
          { $inc: { currentSamples: 1 } }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating sample:", error)
    return NextResponse.json({ error: "Failed to update sample" }, { status: 500 })
  }
}