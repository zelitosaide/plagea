"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Building2, Loader2, Plus } from "lucide-react"

type Department = {
  _id: string
  name: string
  createdAt: string
}

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/departments")
      if (!response.ok) throw new Error("Failed to fetch departments")
      setDepartments(await response.json())
      setError("")
    } catch {
      setError("Não foi possível carregar os departamentos.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  const openCreateDialog = () => {
    setName("")
    setFormError("")
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError("")

    try {
      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setFormError(data?.error || "Não foi possível criar o departamento.")
        return
      }

      setDialogOpen(false)
      fetchDepartments()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Departamentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cada departamento tem o seu próprio equipamento, amostras e utilizadores, isolados dos restantes
          </p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo departamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de departamentos</CardTitle>
          <CardDescription>{departments.length} departamento(s) registado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              A carregar...
            </div>
          ) : error ? (
            <p className="text-destructive py-8 text-center">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((department) => (
                  <TableRow key={department._id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>{new Date(department.createdAt).toLocaleDateString("pt-PT")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Novo departamento</DialogTitle>
              <DialogDescription>
                Cria um novo departamento isolado, com o seu próprio equipamento e utilizadores.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <div className="space-y-2">
                <Label htmlFor="name">Nome do departamento</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Microbiologia"
                  required
                  disabled={saving}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Criar departamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
