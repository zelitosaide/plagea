import { TodoList } from "@/components/todo-list"
import { AddTodoForm } from "@/components/add-todo-form"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Todo App</h1>
          <p className="text-muted-foreground mt-2">A simple Next.js app with MongoDB integration</p>
        </div>

        <AddTodoForm />
        <TodoList />
      </div>
    </main>
  )
}
