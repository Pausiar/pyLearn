import { describe, expect, it } from 'vitest'
import { run } from '../interp/run'
import { judgePlan, PLAN_LINES, planSteps } from './plan'

describe('plan de la jornada', () => {
  it('se conforma con las tres líneas exactas y en orden', () => {
    expect(judgePlan([...PLAN_LINES]).complete).toBe(true)
  })

  it('pide la primera línea si el plan está en blanco', () => {
    expect(judgePlan([]).missing).toContain('en blanco')
  })

  it('indica la línea que falta', () => {
    const verdict = judgePlan([PLAN_LINES[0]])

    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain(PLAN_LINES[1])
  })

  it('señala la línea que no coincide', () => {
    const verdict = judgePlan([PLAN_LINES[0], 'Hora 7: cosecha', PLAN_LINES[2]])

    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('línea 2')
  })

  it('marca el rescate solo cuando el plan está completo', () => {
    const steps = planSteps([...PLAN_LINES], true)

    expect(steps[steps.length - 1]).toMatchObject({ kind: 'plan', done: true })
    expect(planSteps([PLAN_LINES[0]], false).every((step) => step.kind === 'plan' && !step.done)).toBe(true)
  })

  it('la solución con variables imprime el plan completo', () => {
    const solution = [
      'h1 = 6',
      'h2 = 7',
      'h3 = 9',
      'print("Hora " + str(h1) + ": Riego")',
      'print("Hora " + str(h2) + ": Cosecha")',
      'print("Hora " + str(h3) + ": Venta")',
    ].join('\n')
    const result = run(solution, {})

    expect(result.error).toBeUndefined()
    expect(judgePlan(result.output).complete).toBe(true)
  })
})
