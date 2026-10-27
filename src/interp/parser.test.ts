import { describe, expect, it } from 'vitest'
import type { Expression, Statement } from './ast'
import { tokenize } from './lexer'
import { parse } from './parser'

function parseSource(source: string): Statement[] {
  return parse(tokenize(source))
}

function firstExpression(source: string): Expression {
  const statement = parseSource(source)[0]
  if (statement?.type !== 'expr') throw new Error('La primera sentencia no es una expresión')
  return statement.expression
}

describe('parse', () => {
  it('da más prioridad a la multiplicación que a la suma', () => {
    const tree = firstExpression('2 + 3 * 2')

    expect(tree).toMatchObject({ type: 'binop', op: '+' })
    if (tree.type !== 'binop') throw new Error('Se esperaba una suma')
    expect(tree.right).toMatchObject({ type: 'binop', op: '*' })
  })

  it('agrupa las potencias por la derecha', () => {
    const tree = firstExpression('2 ** 3 ** 2')

    expect(tree).toMatchObject({ type: 'binop', op: '**' })
    if (tree.type !== 'binop') throw new Error('Se esperaba una potencia')
    expect(tree.right).toMatchObject({ type: 'binop', op: '**' })
  })

  it('respeta los paréntesis', () => {
    const tree = firstExpression('(2 + 3) * 2')

    expect(tree).toMatchObject({ type: 'binop', op: '*' })
    if (tree.type !== 'binop') throw new Error('Se esperaba una multiplicación')
    expect(tree.left).toMatchObject({ type: 'binop', op: '+' })
  })

  it('aplica el menos unario antes de la potencia', () => {
    expect(firstExpression('-2 ** 2')).toMatchObject({ type: 'unary', op: '-' })
  })

  it('encadena comparaciones', () => {
    const tree = firstExpression('1 < x < 10')

    expect(tree).toMatchObject({ type: 'compare', ops: ['<', '<'] })
  })

  it('no ejecuta la parte derecha del and y el or al parsear', () => {
    expect(firstExpression('a and b or c')).toMatchObject({ type: 'boolop', op: 'or' })
  })

  it('lee un if con elif y else', () => {
    const [statement] = parseSource('if a:\n    x = 1\nelif b:\n    x = 2\nelse:\n    x = 3')

    expect(statement).toMatchObject({ type: 'if', line: 1 })
    if (statement?.type !== 'if') throw new Error('Se esperaba un if')
    expect(statement.branches).toHaveLength(2)
    expect(statement.orelse).toHaveLength(1)
  })

  it('lee un for con su bloque', () => {
    const [statement] = parseSource('for i in range(3):\n    print(i)')

    expect(statement).toMatchObject({ type: 'for', target: 'i', line: 1 })
    if (statement?.type !== 'for') throw new Error('Se esperaba un for')
    expect(statement.body).toHaveLength(1)
  })

  it('lee una función con parámetros', () => {
    const [statement] = parseSource('def sumar(a, b):\n    return a + b')

    expect(statement).toMatchObject({
      type: 'def',
      name: 'sumar',
      params: [
        { name: 'a', default: null },
        { name: 'b', default: null },
      ],
    })
  })

  it('lee un valor por defecto en un parámetro', () => {
    const [statement] = parseSource('def pizza(sabor, cantidad=1):\n    return sabor')

    expect(statement).toMatchObject({
      type: 'def',
      name: 'pizza',
      params: [
        { name: 'sabor', default: null },
        { name: 'cantidad', default: { type: 'constant', value: 1 } },
      ],
    })
  })

  it('lee asignaciones encadenadas', () => {
    expect(parseSource('a = b = 1')[0]).toMatchObject({
      type: 'assign',
      targets: ['a', 'b'],
    })
  })

  it('lee la asignación aumentada como su propio operador', () => {
    expect(parseSource('x += 1')[0]).toMatchObject({ type: 'augassign', target: 'x', op: '+' })
  })

  it('exige dos puntos al final del if', () => {
    expect(() => parseSource('if x\n    y = 1')).toThrowError(
      'A la condición del if le faltan los dos puntos (:) al final',
    )
  })

  it('exige sangría después de los dos puntos', () => {
    expect(() => parseSource('for i in range(2):\nprint(i)')).toThrowError(
      'Después de los dos puntos (:) hace falta una línea con sangría',
    )
  })

  it('rechaza una sangría que no abre bloque', () => {
    expect(() => parseSource('x = 1\n    y = 2')).toThrowError(
      'Sangría inesperada: revisa los espacios al inicio de la línea',
    )
  })

  it('señala un paréntesis sin cerrar', () => {
    expect(() => parseSource('print(1')).toThrowError('Falta cerrar un paréntesis')
  })

  it('señala un else sin if', () => {
    expect(() => parseSource('else:\n    x = 1')).toThrowError('Este «else» no tiene un if delante')
  })

  it('señala una asignación a algo que no es un nombre', () => {
    expect(() => parseSource('1 = x')).toThrowError(
      'A la izquierda del = hace falta el nombre de una variable',
    )
  })

  it('señala basura al final de una línea', () => {
    expect(() => parseSource('print(1) 2')).toThrowError(
      'No entiendo esta línea. ¿Falta un paréntesis o los dos puntos?',
    )
  })
})
