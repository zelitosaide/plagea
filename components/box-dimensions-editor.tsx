"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

const GRID_PRESETS = [
  { label: "9 x 9 (81)", rows: 9, columns: 9 },
  { label: "10 x 10 (100)", rows: 10, columns: 10 },
  { label: "8 x 12 (96)", rows: 8, columns: 12 },
]

const SEQUENCE_PRESETS = [10, 20, 30, 50]

type BoxDimensionsEditorProps = {
  initialRows: number
  initialColumns: number
  onSave: (rows: number, columns: number) => void
  onCancel?: () => void
  saving?: boolean
  /**
   * "grid" (por defeito): linhas e colunas livremente configuráveis,
   * usado pela Box do Congelador.
   * "sequence": fila simples numerada 1..N (Linha do AB, Gaveta do AL) —
   * as linhas ficam sempre fixas em 1, só o número de posições é editável.
   */
  layout?: "grid" | "sequence"
}

export function BoxDimensionsEditor({
  initialRows,
  initialColumns,
  onSave,
  onCancel,
  saving = false,
  layout = "grid",
}: BoxDimensionsEditorProps) {
  const [rows, setRows] = useState(initialRows)
  const [columns, setColumns] = useState(initialColumns)

  if (layout === "sequence") {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-3">
        <div className="flex flex-wrap gap-2">
          {SEQUENCE_PRESETS.map((count) => (
            <Button
              key={count}
              type="button"
              size="sm"
              variant={columns === count ? "default" : "outline"}
              onClick={() => setColumns(count)}
            >
              {count} posições
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-normal text-muted-foreground">Número de posições</Label>
            <Input
              type="number"
              min={1}
              value={columns}
              onChange={(e) => setColumns(Number.parseInt(e.target.value) || 1)}
              className="w-24"
            />
          </div>
          <Button type="button" size="sm" onClick={() => onSave(1, columns)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar dimensões"}
          </Button>
          {onCancel && (
            <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap gap-2">
        {GRID_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            size="sm"
            variant={rows === preset.rows && columns === preset.columns ? "default" : "outline"}
            onClick={() => {
              setRows(preset.rows)
              setColumns(preset.columns)
            }}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-normal text-muted-foreground">Linhas</Label>
          <Input
            type="number"
            min={1}
            value={rows}
            onChange={(e) => setRows(Number.parseInt(e.target.value) || 1)}
            className="w-20"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-normal text-muted-foreground">Colunas</Label>
          <Input
            type="number"
            min={1}
            value={columns}
            onChange={(e) => setColumns(Number.parseInt(e.target.value) || 1)}
            className="w-20"
          />
        </div>
        <Button type="button" size="sm" onClick={() => onSave(rows, columns)} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar dimensões"}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}
