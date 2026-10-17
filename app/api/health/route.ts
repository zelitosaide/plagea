import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// Usado pelo smoke test do deploy (ver scripts/deploy.sh) e por qualquer
// monitorização externa — confirma não só que o processo Node está de pé,
// mas que também consegue falar com o MongoDB.
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    await db.command({ ping: 1 });
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
