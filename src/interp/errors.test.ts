import { describe, expect, it } from 'vitest'
import { run } from './run'
import { ApiError, type Api } from './types'

function printed(source: string, api: Api = {}): string[] {
  const result = run(source, api)
  expect(result.error).toBeUndefined()
  return result.output
}

function failure(source: string): { line: number; message: string } {
  const result = run(source)
  expect(result.error).toBeDefined()
  return result.error!
}

describe('try y except', () => {
  it('recoge el error con nombre y sigue con el programa', () => {
    const code = [
      'try:',
      '    print(1 / 0)',
      'except ZeroDivisionError:',
      '    print("no se puede")',
      'print("fin")',
    ].join('\n')

    expect(printed(code)).toEqual(['no se puede', 'fin'])
  })

  it('el except sin nombre recoge cualquier error', () => {
    const code = ['try:', '    print(desconocida)', 'except:', '    print("vaya")'].join('\n')

    expect(printed(code)).toEqual(['vaya'])
  })

  it('deja pasar el error que no le toca', () => {
    const code = ['try:', '    print(1 / 0)', 'except ValueError:', '    print("no es este")'].join('\n')
    const result = run(code)

    expect(result.error?.message).toBe('No se puede dividir entre cero')
  })

  it('recoge los errores que lanza la API del nivel', () => {
    const api: Api = {
      romper() {
        throw new ApiError('El puente está cortado', 'ValueError')
      },
    }

    const code = ['try:', '    romper()', 'except ValueError:', '    print("puente roto")'].join('\n')
    expect(printed(code, api)).toEqual(['puente roto'])
  })

  it('deja salir de una función desde dentro del try', () => {
    const code = ['def f():', '    try:', '        return 1', '    except:', '        return 2', 'print(f())'].join(
      '\n',
    )

    expect(printed(code)).toEqual(['1'])
  })
})

describe('raise', () => {
  it('lanza un error con su mensaje', () => {
    expect(run('raise ValueError("no vale")').error).toEqual({ line: 1, message: 'no vale' })
  })

  it('se puede lanzar y recoger en el mismo programa', () => {
    const code = [
      'try:',
      '    raise KeyError("falta la pieza")',
      'except KeyError:',
      '    print("pieza perdida")',
    ].join('\n')

    expect(printed(code)).toEqual(['pieza perdida'])
  })
})

describe('errores de Python con nombre', () => {
  it('una clave que falta es KeyError', () => {
    const code = ['try:', '    print({"a": 1}["b"])', 'except KeyError:', '    print("clave perdida")'].join('\n')

    expect(printed(code)).toEqual(['clave perdida'])
  })

  it('una posición que no existe es IndexError', () => {
    const code = ['try:', '    print([1, 2][9])', 'except IndexError:', '    print("fuera de la lista")'].join('\n')

    expect(printed(code)).toEqual(['fuera de la lista'])
  })

  it('int() con un texto que no es número es ValueError', () => {
    const code = ['try:', '    print(int("hola"))', 'except ValueError:', '    print("no es un número")'].join('\n')

    expect(printed(code)).toEqual(['no es un número'])
  })
})

describe('archivos en memoria', () => {
  it('escribe con with y lo lee otra vez', () => {
    const code = [
      'with open("nota.txt", "w") as nota:',
      '    nota.write("hola\\n")',
      'with open("nota.txt") as nota:',
      '    print(nota.read().strip())',
    ].join('\n')

    expect(printed(code)).toEqual(['hola'])
  })

  it('deja los archivos en el resultado', () => {
    const result = run('with open("nota.txt", "w") as nota:\n    nota.write("hola\\n")')

    expect(result.error).toBeUndefined()
    expect(result.files).toEqual({ 'nota.txt': 'hola\n' })
  })

  it('recorre el archivo línea a línea', () => {
    const code = [
      'with open("carta.txt", "w") as carta:',
      '    carta.write("uno\\ndos\\n")',
      'with open("carta.txt") as carta:',
      '    for linea in carta:',
      '        print(linea.strip())',
    ].join('\n')

    expect(printed(code)).toEqual(['uno', 'dos'])
  })

  it('readlines() devuelve la lista de líneas', () => {
    const code = [
      'with open("carta.txt", "w") as carta:',
      '    carta.write("uno\\ndos\\n")',
      'with open("carta.txt") as carta:',
      '    print(len(carta.readlines()))',
    ].join('\n')

    expect(printed(code)).toEqual(['2'])
  })

  it('avisa si el archivo no existe', () => {
    expect(failure('open("fantasma.txt")').message).toContain('No existe el archivo')
  })

  it('avisa si se escribe en un archivo abierto para leer', () => {
    const code = [
      'with open("nota.txt", "w") as nota:',
      '    nota.write("hola")',
      'with open("nota.txt") as nota:',
      '    nota.write("otra")',
    ].join('\n')

    expect(failure(code).message).toContain('abierto para leer')
  })

  it('avisa si el archivo ya está cerrado', () => {
    const code = ['diario = open("nota.txt", "w")', 'diario.close()', 'diario.write("tarde")'].join('\n')

    expect(failure(code).message).toContain('ya está cerrado')
  })

  it('el resultado no lleva archivos si el programa no usa ninguno', () => {
    expect(run('print(1)')).toEqual({ lines: 1, output: ['1'] })
  })
})
