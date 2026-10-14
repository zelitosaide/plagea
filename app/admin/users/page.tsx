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
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Loader2, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

type AdminUser = {
  _id: string
  name: string
  email: string
  role: "admin" | "user"
  isActive: boolean
  createdAt: string
}

type UserFormState = {
  name: string
  email: string
  password: string
  role: "admin" | "user"
  isActive: boolean
}

const EMPTY_FORM: UserFormState = {
  name: "",
  email: "",
  password: "",
  role: "user",
  isActive: true,
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      setUsers(await response.json())
      setError("")
    } catch {
      setError("Não foi possível carregar os utilizadores.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const openCreateDialog = () => {
    setEditingUser(null)
    setForm(EMPTY_FORM)
    setFormError("")
    setDialogOpen(true)
  }

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, password: "", role: user.role, isActive: user.isActive })
    setFormError("")
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError("")

    try {
      const response = editingUser
        ? await fetch(`/api/admin/users/${editingUser._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name,
              role: form.role,
              isActive: form.isActive,
              ...(form.password ? { password: form.password } : {}),
            }),
          })
        : await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setFormError(data?.error || "Não foi possível guardar o utilizador.")
        return
      }

      setDialogOpen(false)
      fetchUsers()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (user: AdminUser) => {
    const confirmed = confirm(
      `Tem a certeza que quer remover o utilizador ${user.name} (${user.email})?\n\nEsta acção não pode ser revertida.`
    )
    if (!confirmed) return

    fetch(`/api/admin/users/${user._id}`, { method: "DELETE" }).then((response) => {
      if (response.ok) {
        fetchUsers()
      } else {
        response.json().then((data) => alert(data?.error || "Falha ao remover utilizador."))
      }
    })
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Administração de Utilizadores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerir quem tem acesso ao PlaGeA e com que permissões</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo utilizador
        </Button>
      </div>

        <Card>
          <CardHeader>
            <CardTitle>Utilizadores</CardTitle>
            <CardDescription>{users.length} conta(s) registada(s)</CardDescription>
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
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "Administrador" : "Utilizador"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "destructive"}>
                          {user.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString("pt-PT")}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user)}
                          disabled={user._id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
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
              <DialogTitle>{editingUser ? "Editar utilizador" : "Novo utilizador"}</DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Actualize os dados e permissões deste utilizador."
                  : "Cria uma nova conta de acesso ao PlaGeA."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  disabled={saving || !!editingUser}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{editingUser ? "Nova password (opcional)" : "Password"}</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  required={!editingUser}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label>Papel</Label>
                <Select
                  value={form.role}
                  onValueChange={(value: "admin" | "user") => setForm((prev) => ({ ...prev, role: value }))}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utilizador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingUser && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Conta activa</Label>
                  <Switch
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
                    disabled={saving || editingUser._id === currentUser?.id}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
