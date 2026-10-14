"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))

type TimePickerProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function TimePicker({ value, onChange, placeholder = "Seleccione a hora", disabled }: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedHourRef = useRef<HTMLButtonElement>(null)
  const selectedMinuteRef = useRef<HTMLButtonElement>(null)

  const [hour, minute] = value ? value.split(":") : ["", ""]

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  useEffect(() => {
    if (!open) return
    selectedHourRef.current?.scrollIntoView({ block: "center" })
    selectedMinuteRef.current?.scrollIntoView({ block: "center" })
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        className={cn("w-full justify-start gap-2 text-left font-normal", !value && "text-muted-foreground")}
      >
        <Clock className="h-4 w-4 shrink-0" />
        {value || placeholder}
      </Button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 flex w-36 overflow-hidden rounded-md border border-border bg-popover shadow-md">
          <div className="max-h-56 flex-1 overflow-y-auto border-r border-border py-1">
            {HOURS.map((h) => (
              <button
                key={h}
                ref={h === hour ? selectedHourRef : undefined}
                type="button"
                onClick={() => onChange(`${h}:${minute || "00"}`)}
                className={cn(
                  "w-full px-3 py-1.5 text-center text-sm hover:bg-accent hover:text-accent-foreground",
                  hour === h && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                {h}
              </button>
            ))}
          </div>
          <div className="max-h-56 flex-1 overflow-y-auto py-1">
            {MINUTES.map((m) => (
              <button
                key={m}
                ref={m === minute ? selectedMinuteRef : undefined}
                type="button"
                onClick={() => {
                  onChange(`${hour || "00"}:${m}`)
                  setOpen(false)
                }}
                className={cn(
                  "w-full px-3 py-1.5 text-center text-sm hover:bg-accent hover:text-accent-foreground",
                  minute === m && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
