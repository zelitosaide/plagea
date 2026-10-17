import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDepartmentFilter, requireSession } from "@/lib/auth"
import { findConflicts, releaseSlots, reserveSlots } from "@/lib/sample-slots"

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

    await releaseSlots(auth.db, sample._id)

    // Decrease the equipment's currentSamples count by the number of
    // positions this sample occupied (not just 1).
    const occupiedCount = Array.isArray(sample.positions) ? sample.positions.length : 1
    if (sample.equipmentId && ObjectId.isValid(sample.equipmentId)) {
      await auth.db.collection("equipment").updateOne(
        { _id: new ObjectId(sample.equipmentId) },
        { $inc: { currentSamples: -occupiedCount } }
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
    const oldPositions: number[] = Array.isArray(currentSample.positions) ? currentSample.positions : []
    const oldPath: string[] = currentSample.path || []

    const newPositions: unknown = body.positions
    if (
      !Array.isArray(newPositions) ||
      newPositions.length === 0 ||
      !newPositions.every((p) => Number.isInteger(p) && p > 0) ||
      new Set(newPositions).size !== newPositions.length
    ) {
      return NextResponse.json({ error: "Posições inválidas" }, { status: 400 })
    }

    // Verifica colisão com outras amostras na nova localização, excluindo
    // esta própria amostra (que já ocupa as posições antigas).
    const conflicts = await findConflicts(
      auth.db,
      newEquipmentId,
      body.path,
      newPositions,
      currentSample._id
    )
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

    // Liberta as posições antigas e reserva as novas. Se a reserva falhar
    // (corrida real entre a verificação acima e esta escrita), repõe as
    // posições antigas em vez de deixar a amostra sem nenhuma.
    await releaseSlots(auth.db, currentSample._id)

    const reserveResult = await reserveSlots(auth.db, {
      sampleId: currentSample._id,
      equipmentId: newEquipmentId,
      path: body.path,
      positions: newPositions,
    })

    if (!reserveResult.ok) {
      if (oldPositions.length > 0) {
        await reserveSlots(auth.db, {
          sampleId: currentSample._id,
          equipmentId: oldEquipmentId,
          path: oldPath,
          positions: oldPositions,
        })
      }
      return NextResponse.json(
        { error: "Não foi possível actualizar — conflito de concorrência; as posições anteriores foram mantidas." },
        { status: 409 }
      )
    }

    const updateData = {
      ...body,
      positions: newPositions,
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

    // Ajusta currentSamples pela diferença de posições ocupadas, incluindo
    // quando a amostra muda de equipamento.
    if (newEquipmentId && newEquipmentId !== oldEquipmentId) {
      if (ObjectId.isValid(oldEquipmentId)) {
        await auth.db.collection("equipment").updateOne(
          { _id: new ObjectId(oldEquipmentId) },
          { $inc: { currentSamples: -oldPositions.length } }
        )
      }

      if (ObjectId.isValid(newEquipmentId)) {
        await auth.db.collection("equipment").updateOne(
          { _id: new ObjectId(newEquipmentId) },
          { $inc: { currentSamples: newPositions.length } }
        )
      }
    } else if (ObjectId.isValid(newEquipmentId) && newPositions.length !== oldPositions.length) {
      await auth.db.collection("equipment").updateOne(
        { _id: new ObjectId(newEquipmentId) },
        { $inc: { currentSamples: newPositions.length - oldPositions.length } }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating sample:", error)
    return NextResponse.json({ error: "Failed to update sample" }, { status: 500 })
  }
}
