import { describe, expect, it } from 'vitest'
import { run } from '../interp/run'
import { PLAYABLE_02 } from '../levels/level02'
import { judgeLighthouse, lighthouseSteps } from './lighthouse'

describe('faro: juicio con explicación', () => {
  it('explica las mayúsculas, que es donde las cadenas se equivocan', () => {
    const verdict = judgeLighthouse(['sos', 'PYLEARN', 'AYUDA'])

    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('«sos»')
    expect(verdict.missing).toContain('«SOS»')
    expect(verdict.missing).toContain('mayúsculas')
  })

  it('no acepta un espacio sobrante dentro del texto', () => {
    expect(judgeLighthouse(['SOS ', 'PYLEARN', 'AYUDA']).complete).toBe(false)
  })

  it('un print sin comillas explica el error de Python en vez de juzgar el texto', () => {
    const session = PLAYABLE_02.start()
    const result = run('print(SOS)', session.api)

    expect(result.error).toBeDefined()
    expect(result.output).toEqual([])
  })
})

describe('faro: pasos de la escena', () => {
  it('no lanza el rescate si el juicio no está completo', () => {
    const steps = lighthouseSteps(['SOS'], false)

    expect(steps.every((step) => !step.rescued)).toBe(true)
  })

  it('termina con el barco cuando el faro ha acertado', () => {
    const steps = lighthouseSteps(['SOS', 'PYLEARN', 'AYUDA'], true)
    const last = steps[steps.length - 1]

    expect(last.rescued).toBe(true)
    expect(last.lines).toEqual(['SOS', 'PYLEARN', 'AYUDA'])
  })

  it('el nivel 2 manda el rescate solo con la solución', () => {
    const session = PLAYABLE_02.start()
    const outcome = session.finish(run(PLAYABLE_02.solution, session.api), PLAYABLE_02.solution)
    const last = outcome.steps[outcome.steps.length - 1]

    expect(outcome.complete).toBe(true)
    expect(last).toMatchObject({ kind: 'lighthouse', rescued: true })
  })
})
