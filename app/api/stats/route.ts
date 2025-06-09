import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase()

    const totalSamples = await db.collection("samples").countDocuments()
    const totalFreezers = await db.collection("freezers").countDocuments()

    const now = new Date()
    const in7Days = new Date()
    in7Days.setDate(now.getDate() + 7)

    const expiringSoon = await db.collection("samples").countDocuments({
      expiryDate: {
        $gte: now.toISOString().split("T")[0],
        $lte: in7Days.toISOString().split("T")[0],
      },
    })

    const freezers = await db.collection("freezers").find().toArray()
    const availablePositions = freezers.reduce((acc, freezer) => {
      const cap = freezer.capacity ?? 0
      const current = freezer.currentSamples ?? 0
      return acc + Math.max(cap - current, 0)
    }, 0)

    const stats = {
      totalSamples,
      totalFreezers,
      expiringSoon,
      availablePositions,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Failed to fetch stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}