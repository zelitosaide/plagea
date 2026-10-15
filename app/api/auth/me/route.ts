import { type NextRequest, NextResponse } from "next/server";
import { getSessionTokenFromRequest, verifySessionToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = getSessionTokenFromRequest(request);
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    id: session.sub,
    name: session.name,
    email: session.email,
    role: session.role,
    departmentId: session.departmentId,
  });
}
