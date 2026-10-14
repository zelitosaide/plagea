"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))

const ITEM_HEIGHT = 36
const VISIBLE_ITEMS = 5
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS
const SPACER_HEIGHT = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2

function Wheel({
  items,
  selected,
  onSelect,
  open,
}: {
  items: string[]
  selected: string
  onSelect: (value: string) => void
  open: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const scrollToIndex = (index: number, smooth: boolean) => {
    containerRef.current?.scrollTo({
      top: index * ITEM_HEIGHT,
      behavior: smooth ? "smooth" : "instant",
    })
  }

  // Centra o valor seleccionado assim que o popover abre, sem animação
  // (para não competir com a transição de entrada do próprio popover).
  useEffect(() => {
    if (!open) return
    const index = Math.max(0, items.indexOf(selected))
    requestAnimationFrame(() => scrollToIndex(index, false))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    scrollTimeout.current = setTimeout(() => {
      const container = containerRef.current
      if (!container) return
      const index = Math.min(
        items.length - 1,
        Math.max(0, Math.round(container.scrollTop / ITEM_HEIGHT))
      )
      onSelect(items[index])
    }, 120)
  }

  const handleClick = (index: number) => {
    scrollToIndex(index, true)
    onSelect(items[index])
  }

  return (
    <div className="relative w-14">
      {/* Faixa de destaque ao centro, atrás dos valores */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-md bg-accent"
        style={{ height: ITEM_HEIGHT }}
      />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative snap-y snap-mandatory overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ height: WHEEL_HEIGHT }}
      >
        <div style={{ height: SPACER_HEIGHT }} />
        {items.map((item, index) => (
          <button
            key={item}
            type="button"
            onClick={() => handleClick(index)}
            className={cn(
              "flex w-full snap-center items-center justify-center text-sm tabular-nums transition-colors",
              item === selected
                ? "font-semibold text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            style={{ height: ITEM_HEIGHT }}
          >
            {item}
          </button>
        ))}
        <div style={{ height: SPACER_HEIGHT }} />
      </div>
      {/* Desvanecimento nas bordas, como num seletor de roda nativo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-linear-to-b from-popover to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t from-popover to-transparent" />
    </div>
  )
}

type TimePickerProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function TimePicker({ value, onChange, placeholder = "Seleccione a hora", disabled }: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [hour, minute] = value ? value.split(":") : ["00", "00"]

  const setNow = () => {
    const now = new Date()
    onChange(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("w-full justify-start gap-2 text-left font-normal tabular-nums", !value && "text-muted-foreground")}
        >
          <Clock className="h-4 w-4 shrink-0" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex items-center gap-1">
          <Wheel items={HOURS} selected={hour} onSelect={(h) => onChange(`${h}:${minute}`)} open={open} />
          <span className="text-lg font-semibold text-muted-foreground">:</span>
          <Wheel items={MINUTES} selected={minute} onSelect={(m) => onChange(`${hour}:${m}`)} open={open} />
        </div>
        <div className="mt-2 flex justify-center border-t border-border pt-2">
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={setNow}>
            Agora
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
