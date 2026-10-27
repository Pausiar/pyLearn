import { describe, expect, it } from 'vitest'
import { mulberry32 } from './modules'
import { run } from './run'
import type { Api, Value } from './types'

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

describe('diccionarios: claves y valores', () => {
  it('se imprime como en Python', () => {
    expect(printed('print({"a": 1, "b": 2})')).toEqual(["{'a': 1, 'b': 2}"])
    expect(printed('print({})')).toEqual(['{}'])
  })

  it('lee, cambia y añade claves', () => {
    const code = [
      'agenda = {"mando": "puente"}',
      'agenda["bodega"] = "deposito"',
      'agenda["mando"] = "cabina"',
      'print(agenda["mando"])',
      'print(agenda)',
    ].join('\n')

    expect(printed(code)).toEqual(['cabina', "{'mando': 'cabina', 'bodega': 'deposito'}"])
  })

  it('cuenta con len() y busca con in', () => {
    expect(
      printed('agenda = {"a": 1, "b": 2}\nprint(len(agenda), "a" in agenda, "z" in agenda)'),
    ).toEqual(['2 True False'])
  })

  it('avisa cuando la clave no está', () => {
    expect(failure('print({"a": 1}["z"])').message).toContain('no está en el diccionario')
  })

  it('recorre las claves con for', () => {
    expect(printed('for clave in {"a": 1, "b": 2}:\n    print(clave)')).toEqual(['a', 'b'])
  })

  it('acepta números y tuplas como claves', () => {
    expect(printed('tablero = {(0, 1): "tesoro"}\nprint(tablero[(0, 1)])')).toEqual(['tesoro'])
  })

  it('no acepta una lista como clave', () => {
    expect(failure('print({[1]: 2})').message).toContain('claves de un diccionario')
  })

  it('no deja cambiar una letra de un texto', () => {
    expect(failure('texto = "hola"\ntexto[0] = "H"').message).toContain(
      'Solo puedo cambiar una posición de una lista',
    )
  })
})

describe('diccionarios: métodos', () => {
  it('get() trae un valor o el de por defecto', () => {
    const code = [
      'censo = {"marte": 12}',
      'print(censo.get("marte"))',
      'print(censo.get("venus", 0))',
      'print(censo.get("venus"))',
    ].join('\n')

    expect(printed(code)).toEqual(['12', '0', 'None'])
  })

  it('keys(), values() e items() dan listas', () => {
    const code = [
      'censo = {"marte": 12, "luna": 5}',
      'print(censo.keys())',
      'print(censo.values())',
      'print(censo.items())',
    ].join('\n')

    expect(printed(code)).toEqual([
      "['marte', 'luna']",
      '[12, 5]',
      "[('marte', 12), ('luna', 5)]",
    ])
  })

  it('recorre items() y saca la pareja por posición', () => {
    const code = [
      'censo = {"marte": 12, "luna": 5}',
      'total = 0',
      'for pareja in censo.items():',
      '    total = total + pareja[1]',
      'print(total)',
    ].join('\n')

    expect(printed(code)).toEqual(['17'])
  })

  it('pop() saca la pareja del diccionario', () => {
    expect(printed('censo = {"a": 1}\nprint(censo.pop("a"))\nprint(censo)')).toEqual(['1', '{}'])
    expect(printed('print({"a": 1}.pop("z", "nada"))')).toEqual(['nada'])
  })

  it('avisa de un método que no existe', () => {
    expect(failure('print({"a": 1}.sumar())').message).toContain('get()')
  })
})

describe('tuplas', () => {
  it('se imprime con paréntesis y una coma cuando va sola', () => {
    expect(printed('print((1, 2), (1,), ())')).toEqual(['(1, 2) (1,) ()'])
  })

  it('lee posiciones, rebanadas y len()', () => {
    expect(
      printed('ficha = ("gol", 1, "mate")\nprint(ficha[0], ficha[-1], ficha[1:], len(ficha))'),
    ).toEqual(["gol mate (1, 'mate') 3"])
  })

  it('se une con + y contesta a in', () => {
    expect(printed('print((1, 2) + (3,), 2 in (1, 2))')).toEqual(['(1, 2, 3) True'])
  })

  it('no se puede cambiar', () => {
    expect(failure('ficha = (1, 2)\nficha[0] = 9').message).toContain(
      'Solo puedo cambiar una posición de una lista',
    )
  })

  it('no es lo mismo que una lista', () => {
    expect(printed('print((1, 2) == [1, 2])')).toEqual(['False'])
  })
})

describe('conjuntos', () => {
  it('quita los repetidos al crearse', () => {
    expect(printed('print({1, 3, 1, 2})')).toEqual(['{1, 3, 2}'])
    expect(printed('print(set())')).toEqual(['set()'])
  })

  it('se construye desde una lista', () => {
    expect(printed('repes = ["gol", "gol", "mate"]\nprint(set(repes), len(set(repes)))')).toEqual([
      "{'gol', 'mate'} 2",
    ])
  })

  it('añade, quita y busca', () => {
    const code = [
      'album = {"gol"}',
      'album.add("mate")',
      'album.add("gol")',
      'album.remove("gol")',
      'print(album, "mate" in album)',
    ].join('\n')

    expect(printed(code)).toEqual(["{'mate'} True"])
  })

  it('se compara sin importar el orden', () => {
    expect(printed('print({1, 2} == {2, 1})')).toEqual(['True'])
  })

  it('avisa si el valor no está', () => {
    expect(failure('caja = {1}\ncaja.remove(9)').message).toContain('El conjunto no tiene 9')
  })
})

describe('comprensiones', () => {
  it('transforma cada elemento de una lista', () => {
    expect(printed('print([n * 2 for n in range(4)])')).toEqual(['[0, 2, 4, 6]'])
  })

  it('filtra con su if', () => {
    expect(printed('print([n for n in [3, 8, 2, 9] if n > 5])')).toEqual(['[8, 9]'])
  })

  it('recorre textos y claves de un diccionario', () => {
    expect(printed('print([letra for letra in "abc"])')).toEqual(["['a', 'b', 'c']"])
    expect(printed('print([clave for clave in {"a": 1, "b": 2}])')).toEqual(["['a', 'b']"])
  })

  it('deja su variable dentro, como Python', () => {
    expect(failure('print([n for n in range(3)])\nprint(n)').message).toContain(
      'La variable «n» todavía no existe',
    )
  })
})

describe('funciones integradas de los datos', () => {
  it('list(), tuple() y set() convierten lo que se pueda recorrer', () => {
    expect(printed('print(list(range(3)))')).toEqual(['[0, 1, 2]'])
    expect(printed('print(list("ab"))')).toEqual(["['a', 'b']"])
    expect(printed('print(tuple([1, 2]))')).toEqual(['(1, 2)'])
    expect(printed('print(set([1, 1, 2]))')).toEqual(['{1, 2}'])
  })

  it('sorted() ordena sin tocar el original', () => {
    expect(printed('notas = [7, 3, 9]\nprint(sorted(notas), notas)')).toEqual([
      '[3, 7, 9] [7, 3, 9]',
    ])
    expect(printed('print(sorted({"b", "a"}))')).toEqual(["['a', 'b']"])
  })

  it('sum() suma los números', () => {
    expect(printed('print(sum([1, 2, 3]), sum(range(5)))')).toEqual(['6 10'])
    expect(failure('print(sum([1, "a"]))').message).toContain('sum() solo suma números')
  })

  it('avisa si sorted() mezcla tipos', () => {
    expect(failure('print(sorted([1, "a"]))').message).toContain('sin mezclarlos')
  })
})

describe('módulos: random y math', () => {
  it('randint() con semilla siempre da lo mismo', () => {
    const generator = mulberry32(7)
    const expected = Array.from({ length: 3 }, () => 1 + Math.floor(generator() * 6))

    const code = [
      'random.seed(7)',
      'print(random.randint(1, 6))',
      'print(random.randint(1, 6))',
      'print(random.randint(1, 6))',
    ].join('\n')

    expect(printed(code)).toEqual(expected.map((value) => String(value)))
  })

  it('choice() elige uno de la lista', () => {
    const generator = mulberry32(3)
    const options = ['antorcha', 'llave', 'mapa']
    const chosen = options[Math.floor(generator() * options.length)]!

    expect(
      printed('random.seed(3)\nprint(random.choice(["antorcha", "llave", "mapa"]))'),
    ).toEqual([chosen])
  })

  it('math trae raíz, suelo, techo y pi', () => {
    expect(printed('print(math.sqrt(16), math.floor(2.7), math.ceil(2.1))')).toEqual(['4 2 3'])
    expect(printed('print(round(math.pi, 2))')).toEqual(['3.14'])
  })

  it('avisa de un miembro que no existe', () => {
    expect(failure('print(math.tangente(1))').message).toContain('El módulo math no tiene')
    expect(failure('print(random.pi)').message).toContain('El módulo random no tiene')
  })

  it('seed() quiere un número entero', () => {
    expect(failure('random.seed("x")').message).toContain('seed() necesita un número')
  })
})

describe('los datos cruzan la API del nivel', () => {
  it('manda los diccionarios como objetos de JavaScript', () => {
    const received: Value[] = []
    const api: Api = {
      enviar(valor) {
        received.push(valor)
      },
    }
    const result = run('enviar({"a": 1, "b": [2]})', api)

    expect(result.error).toBeUndefined()
    expect(received).toEqual([{ a: 1, b: [2] }])
  })

  it('recibe objetos de JavaScript como diccionarios', () => {
    const api: Api = { ficha: () => ({ nombre: 'Rex', energia: 3 }) }
    const result = run('datos = ficha()\nprint(datos["nombre"], datos.get("vidas", 0))', api)

    expect(result.error).toBeUndefined()
    expect(result.output).toEqual(['Rex 0'])
  })

  it('manda tuplas y conjuntos como arrays', () => {
    const received: Value[] = []
    const api: Api = {
      enviar(valor) {
        received.push(valor)
      },
    }
    run('enviar((1, 2))\nenviar({3, 1, 3})', api)

    expect(received).toEqual([
      [1, 2],
      [3, 1],
    ])
  })
})
