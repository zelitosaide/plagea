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
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchTodos = async () => {
    try {
      const response = await fetch("/api/todos")
      if (response.ok) {
        const data = await response.json()
        setTodos(data)
      }
    } catch (error) {
      // toast({
      //   title: "Error",
      //   description: "Failed to fetch todos",
      //   variant: "destructive",
      // })
    } finally {
      setLoading(false)
    }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    setUpdating(id)
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      })

      if (response.ok) {
        setTodos(todos.map((todo) => (todo._id === id ? { ...todo, completed: !completed } : todo)))
        // toast({
        //   title: "Success",
        //   description: "Todo updated successfully",
        // })
      }
    } catch (error) {
      // toast({
      //   title: "Error",
      //   description: "Failed to update todo",
      //   variant: "destructive",
      // })
    } finally {
      setUpdating(null)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTodos(todos.filter((todo) => todo._id !== id))
        // toast({
        //   title: "Success",
        //   description: "Todo deleted successfully",
        // })
      }
    } catch (error) {
      // toast({
      //   title: "Error",
      //   description: "Failed to delete todo",
      //   variant: "destructive",
      // })
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
            <button
              onClick={() => toggleTodo(todo._id, todo.completed)}
              disabled={updating === todo._id}
              className={`flex items-center justify-center w-6 h-6 rounded ${todo.completed ? "bg-green-500" : "bg-gray-200"}`}
            >
              {todo.completed && (
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className={`flex-1 ${todo.completed ? "line-through text-muted-foreground" : ""}`}>{todo.title}</span>
            <button
              onClick={() => deleteTodo(todo._id)}
              className="text-destructive hover:text-destructive disabled:opacity-50"
              disabled={updating === todo._id}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-2 14H7L5 7m3-4h8a1 1 0 011 1v1H7V4a1 1 0 011-1zM9 4v2m6-2v2m-6 4h6m-3 0v10m-3-10v10m6-10v10" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
