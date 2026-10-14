"use client"

import { cn } from "@/lib/utils"

export type OccupiedSlot = {
  position: number
  patientCode: string
}

type PositionPickerProps = {
  occupied: OccupiedSlot[]
  selected?: number
  onSelect: (position: number) => void
  maxPosition?: number
  columns?: number
  disabled?: boolean
}

/**
 * Grelha visual de posições dentro de uma caixa. Não existe, nos dados,
 * nenhum conceito de "tamanho da caixa" — 81 (9x9) é o tamanho padrão mais
 * comum em criocaixas de laboratório, usado aqui como valor por defeito.
 * Para posições fora deste intervalo, o campo numérico ao lado continua a
 * aceitar qualquer valor manualmente.
 */
export function PositionPicker({
  occupied,
  selected,
  onSelect,
  maxPosition = 81,
  columns = 9,
  disabled = false,
}: PositionPickerProps) {
  const occupiedMap = new Map(occupied.map((slot) => [slot.position, slot.patientCode]))

  return (
    <div className="space-y-2">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: maxPosition }, (_, i) => i + 1).map((pos) => {
          const patientCode = occupiedMap.get(pos)
          const isOccupied = !!patientCode
          const isSelected = selected === pos

          return (
            <button
              key={pos}
              type="button"
              disabled={disabled || isOccupied}
              onClick={() => onSelect(pos)}
              title={isOccupied ? `Ocupado: ${patientCode}` : `Posição ${pos} livre`}
              className={cn(
                "flex aspect-square items-center justify-center rounded-sm text-[10px] font-medium transition-colors",
                isOccupied
                  ? "bg-destructive/15 text-destructive/70 cursor-not-allowed"
                  : isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
              )}
            >
              {pos}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-muted" /> Livre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-destructive/15" /> Ocupado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-primary" /> Seleccionado
        </span>
      </div>
    </div>
  )
}
