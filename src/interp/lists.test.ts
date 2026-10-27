import { describe, expect, it } from 'vitest'
import { run } from './run'

function printed(source: string): string[] {
  const result = run(source)
  expect(result.error).toBeUndefined()
  return result.output
}

function failure(source: string): { line: number; message: string } {
  const result = run(source)
  expect(result.error).toBeDefined()
  return result.error!
}

describe('listas: literales e índices', () => {
  it('imprime la lista como en Python', () => {
    expect(printed('print([1, 2, 3])')).toEqual(['[1, 2, 3]'])
    expect(printed('print(["uno", 2, True])')).toEqual(["['uno', 2, True]"])
    expect(printed('print([])')).toEqual(['[]'])
  })

  it('lee posiciones, también desde el final', () => {
    expect(printed('notas = [10, 20, 30]\nprint(notas[0], notas[2], notas[-1])')).toEqual([
      '10 30 30',
    ])
  })

  it('cuenta los elementos con len()', () => {
    expect(printed('print(len([1, 2, 3, 4]))')).toEqual(['4'])
  })

  it('cambia una posición con la asignación', () => {
    expect(printed('lista = ["a", "b"]\nlista[0] = "z"\nlista[-1] = "y"\nprint(lista)')).toEqual([
      "['z', 'y']",
    ])
  })

  it('avisa cuando la posición no existe', () => {
    expect(failure('lista = [1]\nprint(lista[3])').message).toContain('posición 3 no existe')
    expect(failure('print([1][-2])').message).toContain('posición -2 no existe')
  })

  it('pide posiciones enteras', () => {
    expect(failure('print([1, 2][1.5])').message).toContain('entero')
  })

  it('guarda listas dentro de listas', () => {
    expect(printed('malla = [[1, 2], [3, 4]]\nprint(malla[1][0])')).toEqual(['3'])
  })
})

describe('listas: rebanadas', () => {
  it('corta desde una posición hasta otra sin incluirla', () => {
    expect(
      printed('tren = ["locomotora", "a", "b", "c", "d", "furgón"]\nprint(tren[1:5])'),
    ).toEqual(["['a', 'b', 'c', 'd']"])
  })

  it('admite rebanadas abiertas y negativas', () => {
    expect(
      printed(
        'letras = ["a", "b", "c", "d"]\nprint(letras[:2])\nprint(letras[2:])\nprint(letras[-2:])',
      ),
    ).toEqual(["['a', 'b']", "['c', 'd']", "['c', 'd']"])
  })

  it('deja una lista nueva: cambiar el original no la toca', () => {
    expect(printed('uno = [1, 2, 3]\ndos = uno[1:]\nuno[1] = 9\nprint(dos)')).toEqual(['[2, 3]'])
  })

  it('recorta a los límites sin quejarse', () => {
    expect(printed('print([1, 2, 3][1:99])')).toEqual(['[2, 3]'])
  })

  it('también corta textos', () => {
    expect(printed('palabra = "pylearn"\nprint(palabra[0])\nprint(palabra[2:5])')).toEqual([
      'p',
      'lea',
    ])
  })
})

describe('listas: el operador in', () => {
  it('busca dentro de una lista', () => {
    expect(printed('print("b" in ["a", "b"])')).toEqual(['True'])
    expect(printed('print("z" in ["a", "b"])')).toEqual(['False'])
  })

  it('busca dentro de un texto', () => {
    expect(printed('print("l" in "hola")')).toEqual(['True'])
  })

  it('se queja si no hay dónde buscar', () => {
    expect(failure('print("a" in 3)').message).toContain('«in» funciona con listas')
  })
})

describe('listas: métodos', () => {
  it('añade, inserta, quita y saca valores', () => {
    const code = [
      'cola = ["barbacoa", "margarita"]',
      'cola.append("anchoas")',
      'cola.insert(0, "tarta")',
      'cola.remove("margarita")',
      'servida = cola.pop(0)',
      'print(servida)',
      'print(cola)',
    ].join('\n')

    expect(printed(code)).toEqual(['tarta', "['barbacoa', 'anchoas']"])
  })

  it('pop() saca el último cuando no le dices cuál', () => {
    expect(printed('lista = [1, 2, 3]\nprint(lista.pop())\nprint(lista)')).toEqual(['3', '[1, 2]'])
  })

  it('sort() ordena números y textos', () => {
    expect(printed('notas = [7, 3, 9, 1]\nnotas.sort()\nprint(notas)')).toEqual(['[1, 3, 7, 9]'])
    expect(printed('nombres = ["Teo", "Ana", "Leo"]\nnombres.sort()\nprint(nombres)')).toEqual([
      "['Ana', 'Leo', 'Teo']",
    ])
  })

  it('avisa de lo que no se puede hacer con la lista', () => {
    expect(failure('print([1, 2].pop(5))').message).toContain('posición 5 no existe')
    expect(failure('print([].pop())').message).toContain('lista vacía')
    expect(failure('print([1, 2].remove(7))').message).toContain('remove() solo quita')
    expect(failure('print([1, "a"].sort())').message).toContain('sin mezclar')
    expect(failure('print([1].sumar(2))').message).toContain('append()')
  })

  it('avisa cuando el valor no tiene métodos', () => {
    expect(failure('dato = 3\nprint(dato.append(1))').message).toContain('no tiene métodos')
  })
})

describe('listas: bucles y comparaciones', () => {
  it('recorre una lista con for', () => {
    expect(printed('suma = 0\nfor nota in [4, 5, 6]:\n    suma = suma + nota\nprint(suma)')).toEqual([
      '15',
    ])
  })

  it('filtra con un bucle y un condicional', () => {
    const code = [
      'pesos = [8, 2, 3, 6, 1, 1]',
      'ligeros = []',
      'for peso in pesos:',
      '    if peso <= 3:',
      '        ligeros.append(peso)',
      'print(ligeros)',
    ].join('\n')

    expect(printed(code)).toEqual(['[2, 3, 1, 1]'])
  })

  it('recorre posiciones con range(len(...))', () => {
    expect(
      printed('letras = ["a", "b"]\nfor i in range(len(letras)):\n    print(letras[i])'),
    ).toEqual(['a', 'b'])
  })

  it('compara listas por dentro, no por referencia', () => {
    expect(printed('print([1, 2] == [1, 2])\nprint([1, 2] == [2, 1])')).toEqual(['True', 'False'])
  })

  it('une dos listas con +', () => {
    expect(printed('print([1, 2] + [3])')).toEqual(['[1, 2, 3]'])
  })

  it('pasa las listas a la API del nivel como arrays', () => {
    const recibido: unknown[] = []
    const result = run('enviar(["pan", "agua"])', {
      enviar(valor) {
        recibido.push(valor)
      },
    })

    expect(result.error).toBeUndefined()
    expect(recibido).toEqual([['pan', 'agua']])
  })

  it('devuelve a Python las listas que recibe de la API', () => {
    const result = run('caja = listar()\ncaja.append("nuevo")\nprint(caja)', {
      listar: () => ['uno', 'dos'],
    })

    expect(result.error).toBeUndefined()
    expect(result.output).toEqual(["['uno', 'dos', 'nuevo']"])
  })
})
