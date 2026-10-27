/** Tres estrellas hasta el par, dos hasta dos líneas más, una por terminarlo. */
export function starsForLines(lines: number, par = 8): number {
  if (lines <= par) return 3
  if (lines <= par + 2) return 2
  return 1
}
