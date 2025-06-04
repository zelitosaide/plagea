"use client"

import type React from "react"

import { useState } from "react"

export function AddTodoForm() {
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      })

      if (response.ok) {
        setTitle("")
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to add todo:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input 
        type="text"
        placeholder="Add a new todo..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 p-2 border rounded"
      />
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="flex items-center justify-center h-8 px-4 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        <span className="flex items-center justify-center h-8 px-4 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Adding..." : "Add Todo"}
        </span>
      </button>
    </form>
  )
}
