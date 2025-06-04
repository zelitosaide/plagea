"use client"

import { useEffect, useState } from "react"

interface Todo {
  _id: string
  title: string
  completed: boolean
  createdAt: string
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTodos = async () => {
    try {
      const response = await fetch("/api/todos")
      if (response.ok) {
        const data = await response.json()
        setTodos(data)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="text-muted-foreground">Loading todos...</span>
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <span className="text-muted-foreground">No todos yet. Add one above to get started!</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {todos.map((todo) => (
        <div key={todo._id}>
          <div className="flex items-center gap-3 py-4">
            <span className={`flex-1 ${todo.completed ? "line-through text-muted-foreground" : ""}`}>{todo.title}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
