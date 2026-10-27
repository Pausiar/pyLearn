import { describe, expect, it } from 'vitest'
import { looksLikeWholeProgram } from './clipboard'

describe('looksLikeWholeProgram', () => {
  it('no avisa de una línea suelta', () => {
    expect(looksLikeWholeProgram('avanzar()')).toBe(false)
    expect(looksLikeWholeProgram('  regar()  ')).toBe(false)
  })

  it('no avisa de dos líneas cortas', () => {
    expect(looksLikeWholeProgram('avanzar()\nregar()')).toBe(false)
  })

  it('avisa a partir de tres líneas con contenido', () => {
    expect(looksLikeWholeProgram('avanzar()\nregar()\navanzar()')).toBe(true)
  })

  it('no cuenta las líneas vacías', () => {
    expect(looksLikeWholeProgram('avanzar()\n\n\nregar()')).toBe(false)
  })

  it('avisa de un texto largo aunque venga en una línea', () => {
    expect(looksLikeWholeProgram('a'.repeat(120))).toBe(true)
    expect(looksLikeWholeProgram('a'.repeat(119))).toBe(false)
  })

  it('no avisa de un pegado vacío', () => {
    expect(looksLikeWholeProgram('   \n  ')).toBe(false)
  })
})
