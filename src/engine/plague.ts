import type { SceneStep } from './scene'

/** Las tres líneas que tiene que anunciar el programa arreglado, en orden. */
export const PLAGUE_LINES: readonly string[] = ['Zonas: 4', 'Bichos: 8', 'Plaga: activa']

/** Una pista por línea, para el momento de depurar. */
export const PLAGUE_HINTS: readonly string[] = [
  'Para contar las zonas del almacén sobra la lista entera: pide su número con len(zonas).',
  'El bucle recorre 3 de las 4 zonas: usa range(len(zonas)) para no dejarte ninguna.',
  'Con 8 bichos la plaga está activa si pasan de 6: revisa la comparación del if.',
]

/** Qué líneas han salido bien y cuáles no. */
export function plagueReport(output: readonly string[]): { text: string; ok: boolean }[] {
  return PLAGUE_LINES.map((expected, index) => ({
    text: output[index] ?? '(sin línea)',
    ok: output[index] === expected,
  }))
}

export function judgePlague(output: readonly string[]): { complete: boolean; missing: string } {
  const wrong = PLAGUE_LINES.findIndex((expected, index) => output[index] !== expected)
  if (wrong === -1) return { complete: true, missing: '' }

  const shown = output[wrong] === undefined ? 'nada' : `«${output[wrong]}»`
  return {
    complete: false,
    missing: `La línea ${wrong + 1} dice ${shown} y tiene que decir «${PLAGUE_LINES[wrong]}». ${PLAGUE_HINTS[wrong]}`,
  }
}

/** Traza visual: las tres líneas del informe con su visto bueno o su bicho. */
export function plagueSteps(output: readonly string[]): SceneStep[] {
  const report = plagueReport(output)
  const steps: SceneStep[] = [{ kind: 'plague', lines: report.map((line) => ({ ...line, ok: false })) }]

  report.forEach((_, index) => {
    steps.push({ kind: 'plague', lines: report.slice(0, index + 1) })
  })

  return steps
}
