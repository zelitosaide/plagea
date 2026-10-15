import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDepartmentFilter, requireSession } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireSession(request)
  if (!auth.ok) return auth.response

  try {
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de equipamento inválido" }, { status: 400 })
    }

    const equipment = await auth.db
      .collection("equipment")
      .findOne({ _id: new ObjectId(id), ...getDepartmentFilter(auth.session) })

    if (!equipment) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    }

    return NextResponse.json(equipment)
  } catch (error) {
    console.error("Erro ao buscar o equipamento:", error)
    return NextResponse.json({ error: "Erro ao buscar o equipamento" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireSession(request)
  if (!auth.ok) return auth.response

  try {
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid equipment ID" }, { status: 400 })
    }

    const result = await auth.db
      .collection("equipment")
      .deleteOne({ _id: new ObjectId(id), ...getDepartmentFilter(auth.session) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 })
    }

    // Remove também as amostras e configurações de caixa associadas.
    await auth.db.collection("samples").deleteMany({ equipmentId: id })
    await auth.db.collection("boxes").deleteMany({ equipmentId: id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting equipment:", error)
    return NextResponse.json({ error: "Failed to delete equipment" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireSession(request)
  if (!auth.ok) return auth.response

  try {
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de equipamento inválido" }, { status: 400 })
    }

    const body = await request.json()

    const equipmentData = { ...body, updatedAt: new Date().toISOString() }
    delete equipmentData._id
    delete equipmentData.departmentId // não se muda o departamento por aqui

    const result = await auth.db
      .collection("equipment")
      .updateOne({ _id: new ObjectId(id), ...getDepartmentFilter(auth.session) }, { $set: equipmentData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao atualizar o equipamento:", error)
    return NextResponse.json({ error: "Erro ao atualizar o equipamento" }, { status: 500 })
  }
}
