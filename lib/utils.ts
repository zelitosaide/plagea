import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Lista "em janela" dos números de página a mostrar — sempre a primeira
 * e a última, mais 1 página de cada lado da actual, com "ellipsis" a
 * representar o que fica de fora. Evita renderizar um botão por página
 * quando há muitas (ex. 52 páginas com 500+ amostras). */
export function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const delta = 1
  const left = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)

  const pages: (number | "ellipsis")[] = [1]
  if (left > 2) pages.push("ellipsis")
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < total - 1) pages.push("ellipsis")
  pages.push(total)

  return pages
}
