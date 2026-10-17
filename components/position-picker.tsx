"use client"

import { cn } from "@/lib/utils"

export type OccupiedSlot = {
  position: number
  patientCode: string
}

type PositionPickerProps = {
  occupied: OccupiedSlot[]
  selected: number[]
  onSelect: (position: number) => void
  maxPosition?: number
  columns?: number
  disabled?: boolean
  /**
   * "grid" (por defeito): grelha 2D fluida, células dividem a largura
   * disponível — usado pela Box do Congelador.
   * "sequence": fila única (Linha do AB, Gaveta do AL). Células de
   * tamanho fixo em vez de se espremerem para caber na largura; a fila
   * ganha scroll horizontal quando é mais longa do que o contentor, em
   * vez de ficar ilegível.
   */
  layout?: "grid" | "sequence"
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
  layout = "grid",
}: PositionPickerProps) {
  const occupiedMap = new Map(occupied.map((slot) => [slot.position, slot.patientCode]))
  const occupiedCount = occupiedMap.size
  const positions = Array.from({ length: maxPosition }, (_, i) => i + 1)

  const renderButton = (pos: number) => {
    const patientCode = occupiedMap.get(pos)
    const isOccupied = !!patientCode
    const isSelected = selected.includes(pos)

    return (
      <button
        key={pos}
        type="button"
        disabled={disabled || isOccupied}
        onClick={() => onSelect(pos)}
        title={isOccupied ? `Ocupado: ${patientCode}` : `Posição ${pos} livre`}
        className={cn(
          "flex h-9 items-center justify-center rounded-sm border text-[11px] font-semibold transition-colors",
          layout === "sequence" && "w-10 shrink-0",
          isOccupied
            ? "border-destructive bg-destructive text-destructive-foreground cursor-not-allowed line-through"
            : isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary hover:bg-accent hover:text-accent-foreground cursor-pointer"
        )}
      >
        {pos}
      </button>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">
          {occupiedCount} de {maxPosition} posições ocupadas
        </span>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs border border-border bg-card" /> Livre
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-destructive" /> Ocupado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-primary" /> Seleccionado
          </span>
        </div>
      </div>
      {layout === "sequence" ? (
        <div className="overflow-x-auto overflow-y-hidden">
          <div className="flex gap-1.5">{positions.map(renderButton)}</div>
        </div>
      ) : (
        <div className="max-h-[26rem] overflow-y-auto">
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {positions.map(renderButton)}
          </div>
        </div>
      )}
    </div>
  )
}
