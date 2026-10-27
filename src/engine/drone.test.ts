import { describe, expect, it } from 'vitest'
import { run } from '../interp/run'
import { LEVEL_01, starsForLines } from '../levels/level01'
import { createApi, createField, describeField, isComplete, type DroneAction } from './drone'

function play(source: string) {
  const field = createField()
  const actions: DroneAction[] = []
  const result = run(source, createApi(field, actions))
  return { field, actions, result }
}

describe('minijuego del dron', () => {
  it('empieza en el hangar y sin cultivos regados', () => {
    const field = createField()

    expect(field.x).toBe(0)
    expect(isComplete(field)).toBe(false)
    expect(describeField(field)).toBe('El dron está en la casilla 0. Cultivos regados: 0 de 4.')
  })

  it('la solución de referencia riega los cuatro cultivos y da 3 estrellas', () => {
    const { field, result } = play(LEVEL_01.solution)

    expect(result.error).toBeUndefined()
    expect(isComplete(field)).toBe(true)
    expect(starsForLines(result.lines)).toBe(3)
    expect(result.lines).toBeLessThanOrEqual(8)
  })

  it('el código inicial no completa el nivel', () => {
    const { field, result } = play(LEVEL_01.starter)

    expect(result.error).toBeUndefined()
    expect(isComplete(field)).toBe(false)
  })

  it('no deja regar donde no hay cultivo', () => {
    const { result } = play('regar()')

    expect(result.error).toEqual({ line: 1, message: 'Aquí no hay ningún cultivo que regar' })
  })

  it('no deja que el dron se salga del campo', () => {
    const { result } = play('avanzar()\navanzar()\navanzar()\navanzar()\navanzar()\navanzar()')

    expect(result.error?.line).toBe(6)
    expect(result.error?.message).toBe('El dron se sale del campo')
  })

  it('anota una acción por cada llamada para poder animarlas', () => {
    const { actions } = play('avanzar()\nregar()')

    expect(actions).toEqual([{ type: 'move' }, { type: 'water' }])
  })

  it('una línea de más baja a 2 estrellas, y 11 a 1', () => {
    expect(starsForLines(8)).toBe(3)
    expect(starsForLines(9)).toBe(2)
    expect(starsForLines(10)).toBe(2)
    expect(starsForLines(11)).toBe(1)
  })
})
