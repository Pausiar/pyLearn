import type { SceneStep } from './scene'

/** Las tres líneas del plan de la jornada, en orden. */
export const PLAN_LINES: readonly string[] = ['Hora 6: Riego', 'Hora 7: Cosecha', 'Hora 9: Venta']

/** Un paso por línea impresa, acumulando el plan que se va escribiendo. */
export function planSteps(output: readonly string[], complete: boolean): SceneStep[] {
  const steps: SceneStep[] = [{ kind: 'plan', lines: [], done: false }]
  output.forEach((_, index) => {
    steps.push({ kind: 'plan', lines: output.slice(0, index + 1), done: false })
  })
  if (complete) steps.push({ kind: 'plan', lines: [...output], done: true })
  return steps
}

export function judgePlan(output: readonly string[]): { complete: boolean; missing: string } {
  if (output.length === 0) {
    return { complete: false, missing: 'El plan está en blanco: escribe la primera línea con print().' }
  }

  const expected = [...PLAN_LINES]
  if (output.length === expected.length && output.every((line, index) => line === expected[index])) {
    return { complete: true, missing: '' }
  }

  if (output.length < expected.length) {
    return {
      complete: false,
      missing: `El plan lleva ${output.length} de ${expected.length} líneas. Falta: «${expected[output.length]}».`,
    }
  }

  const index = output.findIndex((line, i) => line !== expected[i])
  const at = index === -1 ? expected.length : index
  return {
    complete: false,
    missing: `Sobra o no coincide la línea ${at + 1}. Tiene que decir «${expected[at] ?? '(ninguna)'}», y solo tres líneas.`,
  }
}
