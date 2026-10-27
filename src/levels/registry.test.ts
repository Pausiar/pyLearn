import { describe, expect, it } from 'vitest'
import { run } from '../interp/run'
import { LEVELS } from './catalog'
import { PLAYABLE_LEVELS, isPlayable, playableLevel } from './registry'

describe('registro de niveles', () => {
  it('publica los niveles 1 a 5', () => {
    expect(PLAYABLE_LEVELS.map((level) => level.id)).toEqual([1, 2, 3, 4, 5])
  })

  it('coincide con el catálogo en título y concepto', () => {
    for (const level of PLAYABLE_LEVELS) {
      const summary = LEVELS.find((entry) => entry.id === level.id)
      // El catálogo marca los jefes con el prefijo «Jefe:» y en minúscula; el nivel no lleva el prefijo.
      expect(summary?.title.replace(/^Jefe: /, '').toLowerCase()).toBe(level.title.toLowerCase())
      expect(summary?.concept).toBe(level.concept)
    }
  })

  it('responde por id y distingue lo que aún no existe', () => {
    expect(playableLevel(3)?.title).toBe('La mochila')
    expect(playableLevel(6)).toBeUndefined()
    expect(isPlayable(5)).toBe(true)
    expect(isPlayable(6)).toBe(false)
  })

  for (const level of PLAYABLE_LEVELS) {
    it(`el nivel ${level.id} se completa con su solución`, () => {
      const session = level.start()
      const result = run(level.solution, session.api)

      expect(result.error).toBeUndefined()
      const outcome = session.finish(result)
      expect(outcome.complete).toBe(true)
      expect(outcome.missing).toBe('')
      expect(outcome.steps.length).toBeGreaterThan(0)
    })

    it(`el nivel ${level.id} no se completa con su código inicial`, () => {
      const session = level.start()
      const result = run(level.starter, session.api)

      expect(result.error).toBeUndefined()
      expect(session.finish(result).complete).toBe(false)
    })

    it(`la solución del nivel ${level.id} cabe en su par de estrellas`, () => {
      const session = level.start()
      const result = run(level.solution, session.api)

      expect(result.lines).toBeLessThanOrEqual(level.par)
    })
  }
})
