import { describe, expect, it } from 'vitest'
import { tokenize } from './lexer'

function kinds(source: string): string[] {
  return tokenize(source).map((token) => token.kind)
}

function onlyKinds(source: string, kind: string): number {
  return tokenize(source).filter((token) => token.kind === kind).length
}

describe('tokenize', () => {
  it('emite un INDENT y un DEDENT por bloque', () => {
    const source = 'if True:\n    x = 1\ny = 2'

    expect(onlyKinds(source, 'indent')).toBe(1)
    expect(onlyKinds(source, 'dedent')).toBe(1)
    expect(kinds(source).at(0)).toBe('keyword')
    expect(kinds(source).at(-1)).toBe('eof')
  })

  it('cierra todos los bloques abiertos al final del archivo', () => {
    const source = 'if True:\n    if True:\n        x = 1'
    expect(onlyKinds(source, 'indent')).toBe(2)
    expect(onlyKinds(source, 'dedent')).toBe(2)
  })

  it('ignora comentarios y líneas vacías', () => {
    const tokens = tokenize('# solo un comentario\n\n   \nx = 1 # al final')
    const names = tokens.filter((token) => token.kind === 'name').map((token) => token.value)

    expect(names).toEqual(['x'])
    expect(tokens.filter((token) => token.kind === 'newline')).toHaveLength(1)
  })

  it('no confunde una almohadilla dentro de una cadena con un comentario', () => {
    const tokens = tokenize('print("# no es un comentario")')
    const text = tokens.find((token) => token.kind === 'string')

    expect(text?.value).toBe('# no es un comentario')
  })

  it('lee los escapes de las cadenas', () => {
    const tokens = tokenize('print("a\\nb\\t\\"c\\"")')
    expect(tokens.find((token) => token.kind === 'string')?.value).toBe('a\nb\t"c"')
  })

  it('lee números enteros y decimales', () => {
    const numbers = tokenize('1 2.5 30').filter((token) => token.kind === 'number')

    expect(numbers.map((token) => Number(token.value))).toEqual([1, 2.5, 30])
  })

  it('lee operadores compuestos antes que los simples', () => {
    const operators = tokenize('x **= 2\nx //= 3').filter((token) => token.kind === 'op')

    expect(operators.map((token) => token.value)).toEqual(['**=', '//='])
  })

  it('acepta nombres con acentos y eñe', () => {
    const tokens = tokenize('años = 1\nriego = años')
    expect(tokens.filter((token) => token.kind === 'name').map((token) => token.value)).toContain(
      'años',
    )
  })

  it('rechaza tabuladores en la sangría con su línea', () => {
    expect(() => tokenize('if True:\n\tx = 1')).toThrowError(/tabuladores/)
    try {
      tokenize('if True:\n\tx = 1')
    } catch (error) {
      expect((error as { line: number }).line).toBe(2)
    }
  })

  it('señala una sangría que no coincide con ningún bloque', () => {
    expect(() => tokenize('if True:\n    x = 1\n  y = 2')).toThrowError(
      'La sangría no coincide con ningún bloque anterior',
    )
  })

  it('señala una cadena sin cerrar', () => {
    expect(() => tokenize('print("hola)')).toThrowError('Falta cerrar las comillas')
  })

  it('señala un símbolo desconocido con su línea', () => {
    expect(() => tokenize('x = 1\n?')).toThrowError('No entiendo el símbolo «?»')
  })
})
