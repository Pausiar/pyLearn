import { describe, expect, it } from 'vitest'
import { STEP_LIMIT, runPrototype } from './prototype'
import { ApiError, type Api } from './types'

function recorder() {
  const calls: string[] = []
  const api: Api = {
    marcar(valor) {
      calls.push(String(valor))
    },
    romper() {
      throw new ApiError('El robot no puede pasar por aquí')
    },
  }
  return { calls, api }
}

describe('runPrototype', () => {
  it('ejecuta llamadas en orden', () => {
    const { calls, api } = recorder()
    const result = runPrototype('marcar(1)\nmarcar(2)', api)

    expect(result.error).toBeUndefined()
    expect(result.lines).toBe(2)
    expect(calls).toEqual(['1', '2'])
  })

  it('asigna variables y las usa en expresiones', () => {
    const { calls, api } = recorder()
    runPrototype('a = 2\nb = 3\nmarcar(a + b)', api)

    expect(calls).toEqual(['5'])
  })

  it('evalúa de izquierda a derecha, sin precedencia: limitación conocida del prototipo', () => {
    // La Fase 1 sustituye esto por un parser con precedencia real; el nivel 1 no la necesita.
    const { calls, api } = recorder()
    runPrototype('a = 2\nb = 3\nmarcar(a + b * 2)', api)

    expect(calls).toEqual(['10'])
  })

  it('concatena texto con números', () => {
    const { calls, api } = recorder()
    runPrototype('nombre = "dron"\nmarcar("hola " + nombre)', api)

    expect(calls).toEqual(['hola dron'])
  })

  it('repite un bloque con for y range', () => {
    const { calls, api } = recorder()
    runPrototype('for i in range(3):\n    marcar(i)\nmarcar("fin")', api)

    expect(calls).toEqual(['0', '1', '2', 'fin'])
  })

  it('ignora comentarios y líneas vacías al contar', () => {
    const { calls, api } = recorder()
    const result = runPrototype('# comentario\n\nmarcar(1)\n', api)

    expect(result.lines).toBe(1)
    expect(calls).toEqual(['1'])
  })

  it('señala una función que no existe con su línea', () => {
    const { api } = recorder()
    const result = runPrototype('marcar(1)\navanzr()', api)

    expect(result.error).toEqual({
      line: 2,
      message: 'La función avanzr() no existe. Revisa cómo la has escrito',
    })
  })

  it('señala una variable que todavía no existe', () => {
    const { api } = recorder()
    const result = runPrototype('marcar(x)', api)

    expect(result.error?.line).toBe(1)
    expect(result.error?.message).toBe('La variable «x» todavía no existe')
  })

  it('señala la falta de sangría después de los dos puntos', () => {
    const { api } = recorder()
    const result = runPrototype('for i in range(2):\nmarcar(i)', api)

    expect(result.error?.line).toBe(1)
    expect(result.error?.message).toBe(
      'Después de los dos puntos (:) hace falta una línea con sangría',
    )
  })

  it('rechaza tabuladores en la sangría', () => {
    const { api } = recorder()
    const result = runPrototype('for i in range(2):\n\tmarcar(i)', api)

    expect(result.error?.message).toBe('Usa espacios para la sangría, no tabuladores')
  })

  it('convierte un error de la API en un error de la línea', () => {
    const { api } = recorder()
    const result = runPrototype('romper()', api)

    expect(result.error).toEqual({ line: 1, message: 'El robot no puede pasar por aquí' })
  })

  it('no divide entre cero', () => {
    const { api } = recorder()
    const result = runPrototype('marcar(4 / 0)', api)

    expect(result.error?.message).toBe('No se puede dividir entre cero')
  })

  it('corta los bucles infinitos con un mensaje', () => {
    const { api } = recorder()
    const result = runPrototype('for i in range(20001):\n    marcar(i)', api)

    expect(result.error?.line).toBe(2)
    expect(result.error?.message).toBe('Demasiados pasos: puede que haya un bucle infinito')
    expect(STEP_LIMIT).toBe(20_000)
  })

  it('devuelve un resultado vacío sin código', () => {
    const { api } = recorder()
    expect(runPrototype('   \n# solo un comentario\n', api)).toEqual({ lines: 0 })
  })
})
