import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const todos = await db.collection("todos").find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(todos)
  } catch (error) {
    console.error("Error fetching todos:", error)
    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json()

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const result = await db.collection("todos").insertOne({
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    })

    const newTodo = await db.collection("todos").findOne({ _id: result.insertedId })

    return NextResponse.json(newTodo, { status: 201 })
  } catch (error) {
    console.error("Error creating todo:", error)
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 })
  }
}