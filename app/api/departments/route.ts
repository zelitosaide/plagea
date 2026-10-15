import { type NextRequest, NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdminSession(request);
  if (!auth.ok) return auth.response;

  const departments = await auth.db.collection("departments").find({}).sort({ name: 1 }).toArray();
  return NextResponse.json(departments);
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdminSession(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "Nome do departamento é obrigatório" }, { status: 400 });
    }

    const existing = await auth.db.collection("departments").findOne({ name });
    if (existing) {
      return NextResponse.json({ error: "Já existe um departamento com este nome" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const result = await auth.db.collection("departments").insertOne({
      name,
      createdAt: now,
      updatedAt: now,
    });

    const newDepartment = await auth.db.collection("departments").findOne({ _id: result.insertedId });
    return NextResponse.json(newDepartment, { status: 201 });
  } catch (error) {
    console.error("Error creating department:", error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
