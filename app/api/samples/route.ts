import { type NextRequest, NextResponse } from "next/server"

// Mock data storage (in a real app, this would be in a database)
const mockSamples = [
  {
    id: "1",
    patientCode: "PT-2024-001",
    sampleType: "Blood Serum",
    project: "COVID-19 Study",
    freezerId: "F1",
    shelf: "S2",
    box: "B3",
    position: "P15",
    entryDate: "2024-01-15",
    expiryDate: "2024-07-15",
    notes: "High priority sample",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    patientCode: "PT-2024-002",
    sampleType: "Plasma",
    project: "Diabetes Research",
    freezerId: "F2",
    shelf: "S1",
    box: "B1",
    position: "P8",
    entryDate: "2024-01-14",
    expiryDate: "2024-06-14",
    notes: "Control sample",
    createdAt: "2024-01-14T09:15:00Z",
    updatedAt: "2024-01-14T09:15:00Z",
  },
  {
    id: "3",
    patientCode: "PT-2024-003",
    sampleType: "DNA",
    project: "Genetic Analysis",
    freezerId: "F1",
    shelf: "S1",
    box: "B2",
    position: "P5",
    entryDate: "2024-01-13",
    expiryDate: "2025-01-13",
    notes: "Long-term storage",
    createdAt: "2024-01-13T14:45:00Z",
    updatedAt: "2024-01-13T14:45:00Z",
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const sampleType = searchParams.get("sampleType")
    const project = searchParams.get("project")

    let filteredSamples = [...mockSamples]

    if (search) {
      filteredSamples = filteredSamples.filter(
        (sample) =>
          sample.patientCode.toLowerCase().includes(search.toLowerCase()) ||
          sample.sampleType.toLowerCase().includes(search.toLowerCase()) ||
          sample.project.toLowerCase().includes(search.toLowerCase()),
      )
    }

    if (sampleType && sampleType !== "all") {
      filteredSamples = filteredSamples.filter((sample) => sample.sampleType === sampleType)
    }

    if (project && project !== "all") {
      filteredSamples = filteredSamples.filter((sample) => sample.project === project)
    }

    return NextResponse.json(filteredSamples)
  } catch (error) {
    console.error("Error fetching samples:", error)
    return NextResponse.json({ error: "Failed to fetch samples" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if location is already occupied
    const existingLocation = mockSamples.find(
      (sample) =>
        sample.freezerId === body.freezerId &&
        sample.shelf === body.shelf &&
        sample.box === body.box &&
        sample.position === body.position,
    )

    if (existingLocation) {
      return NextResponse.json({ error: "This storage location is already occupied" }, { status: 400 })
    }

    // Check if patient code already exists
    const existingPatient = mockSamples.find((sample) => sample.patientCode === body.patientCode)

    if (existingPatient) {
      return NextResponse.json({ error: "A sample with this patient code already exists" }, { status: 400 })
    }

    const now = new Date().toISOString()
    const newSample = {
      id: (mockSamples.length + 1).toString(),
      ...body,
      createdAt: now,
      updatedAt: now,
    }

    mockSamples.push(newSample)

    return NextResponse.json(newSample)
  } catch (error) {
    console.error("Error creating sample:", error)
    return NextResponse.json({ error: "Failed to create sample" }, { status: 500 })
  }
}
