import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDepartmentFilter, requireSession } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireSession(request)
  if (!auth.ok) return auth.response

  try {
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de amostra inválido" }, { status: 400 })
    }

    const sample = await auth.db
      .collection("samples")
      .findOne({ _id: new ObjectId(id), ...getDepartmentFilter(auth.session) })

    if (!sample) {
      return NextResponse.json({ error: "Amostra não encontrada" }, { status: 404 })
    }

    return NextResponse.json(sample)
  } catch (error) {
    console.error("Erro ao buscar a amostra:", error)
    return NextResponse.json({ error: "Erro ao buscar a amostra" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireSession(request)
  if (!auth.ok) return auth.response

  try {
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid sample ID" }, { status: 400 })
    }

    const departmentFilter = getDepartmentFilter(auth.session)

    // Find the sample to get the equipmentId before deleting
    const sample = await auth.db.collection("samples").findOne({ _id: new ObjectId(id), ...departmentFilter })
    if (!sample) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 })
    }

    const result = await auth.db.collection("samples").deleteOne({ _id: new ObjectId(id) })
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 })
    }

    // Decrease the equipment's currentSamples count
    if (sample.equipmentId && ObjectId.isValid(sample.equipmentId)) {
      await auth.db.collection("equipment").updateOne(
        { _id: new ObjectId(sample.equipmentId) },
        { $inc: { currentSamples: -1 } }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting sample:", error)
    return NextResponse.json({ error: "Failed to delete sample" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireSession(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid sample ID" }, { status: 400 })
    }

    const departmentFilter = getDepartmentFilter(auth.session)

    // Fetch the current sample
    const currentSample = await auth.db.collection("samples").findOne({ _id: new ObjectId(id), ...departmentFilter })
    if (!currentSample) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 })
    }

    const oldEquipmentId = currentSample.equipmentId?.toString()
    const newEquipmentId = body.equipmentId

    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
    }

    delete updateData._id
    delete updateData.departmentId // não se muda o departamento de uma amostra por aqui

    // Update the sample
    const result = await auth.db.collection("samples").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Sample not found after update" }, { status: 404 })
    }

    // If equipment has changed, update both
    if (newEquipmentId && newEquipmentId !== oldEquipmentId) {
      if (ObjectId.isValid(oldEquipmentId)) {
        await auth.db.collection("equipment").updateOne(
          { _id: new ObjectId(oldEquipmentId) },
          { $inc: { currentSamples: -1 } }
        )
      }

      if (ObjectId.isValid(newEquipmentId)) {
        await auth.db.collection("equipment").updateOne(
          { _id: new ObjectId(newEquipmentId) },
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
