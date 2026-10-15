import { NextRequest, NextResponse } from "next/server"
import { getDepartmentFilter, requireSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const auth = await requireSession(request)
  if (!auth.ok) return auth.response

  try {
    const departmentFilter = getDepartmentFilter(auth.session)

    const totalSamples = await auth.db.collection("samples").countDocuments(departmentFilter)
    const totalEquipment = await auth.db.collection("equipment").countDocuments(departmentFilter)

    const now = new Date()
    const in7Days = new Date()
    in7Days.setDate(now.getDate() + 7)

    const expiringSoon = await auth.db.collection("samples").countDocuments({
      ...departmentFilter,
      expiryDate: {
        $gte: now.toISOString().split("T")[0],
        $lte: in7Days.toISOString().split("T")[0],
      },
    })

    const equipment = await auth.db.collection("equipment").find(departmentFilter).toArray()
    const availablePositions = equipment.reduce((acc, item) => {
      const cap = item.capacity ?? 0
      const current = item.currentSamples ?? 0
      return acc + Math.max(cap - current, 0)
    }, 0)

    const stats = {
      totalSamples,
      totalEquipment,
      expiringSoon,
      availablePositions,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Failed to fetch stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
