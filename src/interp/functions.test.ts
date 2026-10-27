import { describe, expect, it } from 'vitest'
import { run } from './run'
import { ApiError, isApiFunction, type Api } from './types'

function printed(source: string): string[] {
  const result = run(source)
  expect(result.error).toBeUndefined()
  return result.output
}

function failure(source: string, api?: Api): { line: number; message: string } {
  const result = run(source, api)
  expect(result.error).toBeDefined()
  return result.error!
}

/** Motor mínimo que llama a la función que le entregue el alumno. */
function repeat(seen: unknown[]): Api {
  return {
    repetir(valor) {
      if (!isApiFunction(valor)) throw new ApiError('repetir() necesita una función')
      seen.push(valor(3))
      seen.push(valor(5))
    },
  }
}

describe('funciones: parámetros con valor por defecto', () => {
  it('usa el valor por defecto cuando falta el argumento', () => {
    const code = [
      'def saludo(nombre, cortesia="hola"):',
      '    return cortesia + ", " + nombre',
      'print(saludo("Pau"))',
      'print(saludo("Pau", "buenas"))',
    ].join('\n')

    expect(printed(code)).toEqual(['hola, Pau', 'buenas, Pau'])
  })

  it('calcula el valor por defecto al definir la función, no al llamarla', () => {
    expect(printed('x = 1\ndef f(a=x):\n    return a\nx = 9\nprint(f())')).toEqual(['1'])
  })

  it('admite None como valor por defecto', () => {
    expect(printed('def f(a=None):\n    return a\nprint(f())')).toEqual(['None'])
  })

  it('cuenta los valores obligatorios y los que llevan defecto', () => {
    expect(failure('def f(a, b=2):\n    return a\nf()').message).toBe(
      'La función f() espera entre 1 y 2 valores y ha recibido 0',
    )
    expect(failure('def f(a, b=2):\n    return a\nf(1, 2, 3)').message).toBe(
      'La función f() espera entre 1 y 2 valores y ha recibido 3',
    )
  })

  it('exige que los parámetros con defecto vayan al final', () => {
    expect(failure('def f(a=1, b):\n    return a').message).toContain(
      'los que lo llevan van al final',
    )
  })
})

describe('funciones: ámbito local y global', () => {
  it('lee las variables globales desde dentro', () => {
    expect(printed('factor = 3\ndef triple(n):\n    return n * factor\nprint(triple(2))')).toEqual([
      '6',
    ])
  })

  it('lo que se asigna dentro de una función es local', () => {
    expect(printed('total = 0\ndef f():\n    total = 5\nf()\nprint(total)')).toEqual(['0'])
  })

  it('trabaja con variables locales dentro de un bucle', () => {
    const code = [
      'def suma():',
      '    cuenta = 0',
      '    for i in range(3):',
      '        cuenta = cuenta + 1',
      '    return cuenta',
      'print(suma())',
    ].join('\n')

    expect(printed(code)).toEqual(['3'])
  })

  it('avisa si se lee un nombre local antes de darle valor', () => {
    const error = failure('total = 0\ndef f():\n    total = total + 1\nf()')

    expect(error).toEqual({
      line: 3,
      message: '«total» es local en esta función y todavía no tiene valor: dale uno antes de leerla',
    })
  })

  it('ve las variables del ámbito donde se definió la función', () => {
    const code = [
      'def exterior():',
      '    mensaje = "dentro"',
      '    def interior():',
      '        return mensaje',
      '    return interior()',
      'print(exterior())',
    ].join('\n')

    expect(printed(code)).toEqual(['dentro'])
  })
})

describe('funciones: pasar una función a la API', () => {
  it('deja que el motor llame a la función del alumno', () => {
    const seen: unknown[] = []
    const result = run('def doble(n):\n    return n * 2\nrepetir(doble)', repeat(seen))

    expect(result.error).toBeUndefined()
    expect(seen).toEqual([6, 10])
  })

  it('respeta los valores por defecto en las llamadas del motor', () => {
    const voces: string[] = []
    const api: Api = {
      gritar(valor) {
        if (!isApiFunction(valor)) throw new ApiError('gritar() necesita una función')
        voces.push(String(valor('Pau')))
        voces.push(String(valor('Pau', 'buenas')))
      },
    }
    const code = [
      'def saludo(nombre, cortesia="hola"):',
      '    return cortesia + " " + nombre',
      'gritar(saludo)',
    ].join('\n')
    const result = run(code, api)

    expect(result.error).toBeUndefined()
    expect(voces).toEqual(['hola Pau', 'buenas Pau'])
  })

  it('señala con su línea un error dentro de la función que llama el motor', () => {
    const error = failure('def malo(n):\n    return n / 0\nrepetir(malo)', repeat([]))

    expect(error).toEqual({ line: 2, message: 'No se puede dividir entre cero' })
  })

  it('propaga el error del motor con la línea de la llamada', () => {
    const api: Api = {
      repetir(valor) {
        if (!isApiFunction(valor)) throw new ApiError('repetir() necesita una función')
        valor()
      },
    }
    const error = failure('def f(a):\n    return a\nrepetir(f)', api)

    expect(error).toEqual({
      line: 3,
      message: 'La función f() espera 1 valor y ha recibido 0',
    })
  })

  it('cuenta las llamadas del motor para frenar una recursión', () => {
    const api: Api = {
      bucle(valor) {
        if (!isApiFunction(valor)) throw new ApiError('bucle() necesita una función')
        valor(0)
      },
    }
    const code = ['def revienta(n):', '    return bucle(revienta)', 'bucle(revienta)'].join('\n')
    const error = failure(code, api)

    expect(error.message).toContain('Demasiadas llamadas seguidas')
  })

  it('avisa si el motor recibe algo que no es una función', () => {
    const error = failure('repetir(3)', repeat([]))

    expect(error).toEqual({ line: 1, message: 'repetir() necesita una función' })
  })
})
