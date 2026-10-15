import { type NextRequest, NextResponse } from "next/server";
import { getDepartmentFilter, hashPassword, requireAdminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.response;

  const users = await auth.db
    .collection("users")
    .find(getDepartmentFilter(auth.session), { projection: { passwordHash: 0 } })
    .sort({ createdAt: 1 })
    .toArray();

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, email e password são obrigatórios" }, { status: 400 });
    }

    const isSuperAdmin = auth.session.role === "superadmin";

    // Um admin de departamento só cria utilizadores (user/admin) dentro do
    // seu próprio departamento; só o superadmin escolhe o departamento e
    // pode criar outro superadmin.
    let role: "superadmin" | "admin" | "user" = "user";
    let departmentId: string | null = auth.session.departmentId;

    if (isSuperAdmin) {
      role = body.role === "superadmin" ? "superadmin" : body.role === "admin" ? "admin" : "user";
      departmentId = role === "superadmin" ? null : typeof body.departmentId === "string" ? body.departmentId : null;

      if (role !== "superadmin" && !departmentId) {
        return NextResponse.json({ error: "Departamento é obrigatório para este papel" }, { status: 400 });
      }
    } else {
      role = body.role === "admin" ? "admin" : "user";
    }

    const existing = await auth.db.collection("users").findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Já existe um utilizador com este email" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    const result = await auth.db.collection("users").insertOne({
      name,
      email,
      passwordHash,
      role,
      departmentId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const newUser = await auth.db
      .collection("users")
      .findOne({ _id: result.insertedId }, { projection: { passwordHash: 0 } });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
