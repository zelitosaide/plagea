"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

/**
 * Barra fina de progresso no topo da página durante a navegação entre
 * rotas — arranca em qualquer clique num link interno, completa quando o
 * pathname muda. Sem dependência nova; um temporizador de segurança evita
 * que fique presa caso a navegação não altere a rota (ex. link para a
 * própria página).
 */
export function RouteProgressBar() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const visibleRef = useRef(false)

  useEffect(() => {
    visibleRef.current = visible
  }, [visible])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const start = () => {
    clearTimers()
    setVisible(true)
    setWidth(20)
    timers.current.push(setTimeout(() => setWidth(55), 150))
    timers.current.push(setTimeout(() => setWidth(75), 500))
    timers.current.push(
      setTimeout(() => {
        setVisible(false)
        setWidth(0)
      }, 3000)
    )
  }

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const link = (event.target as HTMLElement)?.closest("a")
      if (!link) return

      const href = link.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return
      if (link.target === "_blank") return

      start()
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  useEffect(() => {
    if (!visibleRef.current) return
    clearTimers()
    setWidth(100)
    timers.current.push(
      setTimeout(() => {
        setVisible(false)
        setWidth(0)
      }, 200)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-100 h-0.5 pointer-events-none print:hidden">
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
