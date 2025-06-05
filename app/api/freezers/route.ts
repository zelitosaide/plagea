import { type NextRequest, NextResponse } from "next/server"

// Freezer Management API - Mock Data Implementation

// Mock freezer data
const mockFreezers = [
  {
    id: "1",
    name: "Main Lab Freezer",
    location: "Lab Room A",
    capacity: 500,
    temperature: "-80°C",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Backup Freezer",
    location: "Lab Room B",
    capacity: 300,
    temperature: "-80°C",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Long-term Storage",
    location: "Storage Room",
    capacity: 1000,
    temperature: "-150°C",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Research Freezer",
    location: "Research Lab",
    capacity: 400,
    temperature: "-80°C",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Mock sample counts per freezer
const mockSampleCounts = {
  F1: 387,
  F2: 156,
  F3: 234,
  F4: 298,
}

export async function GET() {
  try {
    const freezersWithCounts = mockFreezers.map((freezer, index) => {
      const freezerId = `F${index + 1}`
      const currentSamples = mockSampleCounts[freezerId] || 0
      const utilizationPercentage = Math.round((currentSamples / freezer.capacity) * 100)

      return {
        ...freezer,
        freezerId,
        currentSamples,
        utilizationPercentage,
        status: index === 3 ? "maintenance" : "operational",
        lastMaintenance: `2024-01-${10 + index}`,
      }
    })

    return NextResponse.json(freezersWithCounts)
  } catch (error) {
    console.error("Error fetching freezers:", error)
    return NextResponse.json({ error: "Failed to fetch freezers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newFreezer = {
      id: (mockFreezers.length + 1).toString(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(newFreezer)
  } catch (error) {
    console.error("Error creating freezer:", error)
    return NextResponse.json({ error: "Failed to create freezer" }, { status: 500 })
  }
}
