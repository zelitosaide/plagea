import { type NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { hashPassword, requireAdminSession } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.response;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID de utilizador inválido" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    if (typeof body.name === "string" && body.name.trim()) {
      update.name = body.name.trim();
    }

    if (body.role === "admin" || body.role === "user") {
      if (body.role !== "admin" && id === auth.session.sub) {
        return NextResponse.json({ error: "Não pode remover o seu próprio papel de administrador" }, { status: 400 });
      }
      update.role = body.role;
    }

    if (typeof body.isActive === "boolean") {
      if (!body.isActive && id === auth.session.sub) {
        return NextResponse.json({ error: "Não pode desactivar a sua própria conta" }, { status: 400 });
      }
      update.isActive = body.isActive;
    }

    if (typeof body.password === "string" && body.password) {
      update.passwordHash = await hashPassword(body.password);
    }

    const result = await auth.db.collection("users").updateOne({ _id: new ObjectId(id) }, { $set: update });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
    }

    const updatedUser = await auth.db
      .collection("users")
      .findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.response;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID de utilizador inválido" }, { status: 400 });
  }

  if (id === auth.session.sub) {
    return NextResponse.json({ error: "Não pode remover a sua própria conta" }, { status: 400 });
  }

  try {
    const result = await auth.db.collection("users").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
