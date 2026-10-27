import { describe, expect, it } from 'vitest'
import { parseHash, toHash } from './router'

describe('rutas por hash', () => {
  it('abre el mapa por defecto', () => {
    expect(parseHash('')).toEqual({ name: 'map' })
    expect(parseHash('#/')).toEqual({ name: 'map' })
    expect(parseHash('#/cualquier-cosa')).toEqual({ name: 'map' })
  })

  it('lee un nivel', () => {
    expect(parseHash('#/nivel/1')).toEqual({ name: 'level', id: 1 })
    expect(parseHash('/nivel/12')).toEqual({ name: 'level', id: 12 })
    expect(parseHash('#/nivel/40/')).toEqual({ name: 'level', id: 40 })
  })

  it('rechaza niveles fuera de rango o inventados', () => {
    expect(parseHash('#/nivel/0')).toEqual({ name: 'map' })
    expect(parseHash('#/nivel/41')).toEqual({ name: 'map' })
    expect(parseHash('#/nivel/abc')).toEqual({ name: 'map' })
  })

  it('genera el hash que vuelve a leer', () => {
    expect(toHash({ name: 'map' })).toBe('#/')
    expect(parseHash(toHash({ name: 'level', id: 7 }))).toEqual({ name: 'level', id: 7 })
  })
})
