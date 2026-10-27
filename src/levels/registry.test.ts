import { describe, expect, it } from 'vitest'
import { run } from '../interp/run'
import { LEVELS } from './catalog'
import { PLAYABLE_LEVELS, isPlayable, playableLevel } from './registry'

describe('registro de niveles', () => {
  it('publica los niveles 1 a 20', () => {
    expect(PLAYABLE_LEVELS.map((level) => level.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ])
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
    expect(playableLevel(21)).toBeUndefined()
    expect(isPlayable(20)).toBe(true)
    expect(isPlayable(21)).toBe(false)
  })

  for (const level of PLAYABLE_LEVELS) {
    it(`el nivel ${level.id} se completa con su solución`, () => {
      const session = level.start()
      const result = run(level.solution, session.api)

      expect(result.error).toBeUndefined()
      const outcome = session.finish(result, level.solution)
      expect(outcome.complete).toBe(true)
      expect(outcome.missing).toBe('')
      expect(outcome.steps.length).toBeGreaterThan(0)
    })

    it(`el nivel ${level.id} no se completa con su código inicial`, () => {
      const session = level.start()
      const result = run(level.starter, session.api)

      expect(result.error).toBeUndefined()
      expect(session.finish(result, level.starter).complete).toBe(false)
    })

    it(`la solución del nivel ${level.id} cabe en su par de estrellas`, () => {
      const session = level.start()
      const result = run(level.solution, session.api)

      expect(result.lines).toBeLessThanOrEqual(level.par)
    })
  }
})
