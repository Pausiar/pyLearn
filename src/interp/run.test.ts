import { describe, expect, it } from 'vitest'
import { run, STEP_LIMIT } from './run'
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

function printed(source: string): string[] {
  const result = run(source)
  expect(result.error).toBeUndefined()
  return result.output
}

describe('run: expresiones', () => {
  it('respeta la precedencia de los operadores', () => {
    expect(printed('print(2 + 3 * 2)')).toEqual(['8'])
  })

  it('agrupa las potencias por la derecha', () => {
    expect(printed('print(2 ** 3 ** 2)')).toEqual(['512'])
  })

  it('calcula división, división entera y módulo', () => {
    expect(printed('print(7 / 2, 7 // 2, 7 % 3)')).toEqual(['3.5 3 1'])
  })

  it('usa el módulo con el signo de Python', () => {
    expect(printed('print(-1 % 3)')).toEqual(['2'])
  })

  it('aplica el menos unario', () => {
    expect(printed('print(-(2 + 3))')).toEqual(['-5'])
  })

  it('junta textos con + y los repite con *', () => {
    expect(printed('print("pi" + "pa", "ja" * 3)')).toEqual(['pipa jajaja'])
  })

  it('avisa si se intenta unir un texto con un número', () => {
    const result = run('print("nivel " + 2)')

    expect(result.error?.message).toBe(
      'No puedo unir un texto con un número. Usa str() para convertir el número en texto',
    )
  })

  it('no compara un número con un texto', () => {
    const result = run('print(1 < "2")')

    expect(result.error?.line).toBe(1)
    expect(result.error?.message).toBe('No puedo comparar un número con un texto')
  })

  it('evalúa comparaciones encadenadas', () => {
    expect(printed('x = 5\nprint(1 < x < 10, 1 < x < 3)')).toEqual(['True False'])
  })

  it('compara con == sin convertir tipos', () => {
    expect(printed('print(1 == "1", 1 == 1)')).toEqual(['False True'])
  })

  it('cortocircuita and y or', () => {
    expect(printed('print(True or romper(), 0 or 3, 1 and 2)')).toEqual(['True 3 2'])
  })
})

describe('run: sentencias', () => {
  it('ejecuta llamadas en orden', () => {
    const { calls, api } = recorder()
    const result = run('marcar(1)\nmarcar(2)', api)

    expect(result.error).toBeUndefined()
    expect(result.lines).toBe(2)
    expect(calls).toEqual(['1', '2'])
  })

  it('asigna variables y las usa', () => {
    const { calls, api } = recorder()
    run('a = 2\nb = 3\nmarcar(a * b)', api)

    expect(calls).toEqual(['6'])
  })

  it('asigna en cadena', () => {
    expect(printed('a = b = 4\nprint(a, b)')).toEqual(['4 4'])
  })

  it('aplica la asignación aumentada', () => {
    expect(printed('x = 5\nx += 3\nx *= 2\nprint(x)')).toEqual(['16'])
  })

  it('avisa si la asignación aumentada usa una variable que no existe', () => {
    const result = run('x += 1')

    expect(result.error).toEqual({ line: 1, message: 'La variable «x» todavía no existe' })
  })

  it('elige la primera rama verdadera del if, elif y else', () => {
    const source = [
      'nota = 7',
      'if nota >= 9:',
      '    print("sobresaliente")',
      'elif nota >= 7:',
      '    print("notable")',
      'else:',
      '    print("a seguir")',
    ].join('\n')

    expect(printed(source)).toEqual(['notable'])
  })

  it('repite con while hasta que la condición falla', () => {
    const source = ['i = 0', 'while i < 3:', '    marcar(i)', '    i += 1'].join('\n')
    const { calls, api } = recorder()

    run(source, api)
    expect(calls).toEqual(['0', '1', '2'])
  })

  it('sale del bucle con break y salta con continue', () => {
    const source = [
      'for i in range(6):',
      '    if i == 2:',
      '        continue',
      '    if i == 4:',
      '        break',
      '    marcar(i)',
    ].join('\n')
    const { calls, api } = recorder()

    run(source, api)
    expect(calls).toEqual(['0', '1', '3'])
  })

  it('recorre un range con inicio, fin y paso negativo', () => {
    const { calls, api } = recorder()
    run('for i in range(10, 0, -3):\n    marcar(i)', api)

    expect(calls).toEqual(['10', '7', '4', '1'])
  })

  it('recorre un texto carácter a carácter', () => {
    expect(printed('for letra in "abc":\n    print(letra)')).toEqual(['a', 'b', 'c'])
  })

  it('avisa si se intenta recorrer un número', () => {
    const result = run('for x in 3:\n    print(x)')

    expect(result.error?.message).toBe(
      'Solo puedo recorrer un range o un texto, y he recibido un número',
    )
  })

  it('llama a una función propia y recoge su return', () => {
    const source = ['def doble(n):', '    return n * 2', 'print(doble(21))'].join('\n')
    expect(printed(source)).toEqual(['42'])
  })

  it('admite recursión', () => {
    const source = [
      'def factorial(n):',
      '    if n <= 1:',
      '        return 1',
      '    return n * factorial(n - 1)',
      'print(factorial(5))',
    ].join('\n')

    expect(printed(source)).toEqual(['120'])
  })

  it('no ve las variables locales de una función desde fuera', () => {
    const result = run('def f():\n    secreto = 1\nf()\nprint(secreto)')

    expect(result.error).toEqual({ line: 4, message: 'La variable «secreto» todavía no existe' })
  })

  it('exige el número de argumentos de una función propia', () => {
    const result = run('def f(a):\n    return a\nf()')

    expect(result.error?.message).toBe('La función f() espera 1 valor y ha recibido 0')
  })

  it('pasa los argumentos de la API como valores simples', () => {
    const result = run('marcar(range(3))', recorder().api)

    expect(result.error?.message).toBe('marcar() no acepta un range')
  })
})

describe('run: funciones integradas', () => {
  it('imprime varios valores separados por un espacio', () => {
    expect(printed('print(True, False, None, 1.5)')).toEqual(['True False None 1.5'])
  })

  it('calcula len, int, str, abs, round, min y max', () => {
    expect(printed('print(len("dron"), int("42") + 1)')).toEqual(['4 43'])
    expect(printed('print(str(3.0), abs(-4), round(2.567, 2))')).toEqual(['3 4 2.57'])
    expect(printed('print(min(3, 1, 2), max(3, 1, 2))')).toEqual(['1 3'])
  })

  it('avisa si len recibe un número', () => {
    const result = run('print(len(3))')

    expect(result.error?.message).toBe('len() necesita un texto y ha recibido un número')
  })

  it('avisa si range no recibe enteros', () => {
    expect(run('for i in range(2.5):\n    print(i)').error?.message).toBe(
      'range() necesita números enteros, sin decimales',
    )
  })

  it('avisa si min mezcla números y textos', () => {
    expect(run('print(min(1, "a"))').error?.message).toBe(
      'min() no puede comparar un número con un texto',
    )
  })
})

describe('run: errores', () => {
  it('señala una función que no existe con su línea', () => {
    const result = run('marcar(1)\navanzr()', recorder().api)

    expect(result.error).toEqual({
      line: 2,
      message: 'La función avanzr() no existe. Revisa cómo la has escrito',
    })
  })

  it('señala una variable que todavía no existe', () => {
    const result = run('print(x)')

    expect(result.error).toEqual({ line: 1, message: 'La variable «x» todavía no existe' })
  })

  it('convierte un error de la API en un error de la línea', () => {
    const result = run('marcar(1)\nromper()', recorder().api)

    expect(result.error).toEqual({ line: 2, message: 'El robot no puede pasar por aquí' })
  })

  it('no divide entre cero', () => {
    expect(run('print(4 / 0)').error?.message).toBe('No se puede dividir entre cero')
    expect(run('print(4 % 0)').error?.message).toBe('No se puede dividir entre cero')
  })

  it('señala la falta de sangría después de los dos puntos', () => {
    const result = run('for i in range(2):\nmarcar(i)')

    expect(result.error).toEqual({
      line: 1,
      message: 'Después de los dos puntos (:) hace falta una línea con sangría',
    })
  })

  it('rechaza tabuladores en la sangría', () => {
    expect(run('for i in range(2):\n\tmarcar(i)').error?.message).toBe(
      'Usa espacios para la sangría, no tabuladores',
    )
  })

  it('conserva lo impreso antes de fallar', () => {
    const result = run('print("antes")\nprint(desconocida)')

    expect(result.output).toEqual(['antes'])
    expect(result.error?.line).toBe(2)
  })

  it('detiene un bucle infinito con un mensaje', () => {
    const result = run('while True:\n    pass')

    expect(result.error).toEqual({
      line: 2,
      message: 'Demasiados pasos: puede que haya un bucle infinito',
    })
    expect(STEP_LIMIT).toBe(20_000)
  })

  it('detiene una recursión sin fin', () => {
    const result = run('def f():\n    return f()\nf()')

    expect(result.error?.message).toBe(
      'Demasiadas llamadas seguidas: revisa si una función se llama a sí misma sin parar',
    )
  })

  it('no ejecuta nada después de un error', () => {
    const { calls, api } = recorder()

    run('romper()\nmarcar(1)', api)
    expect(calls).toEqual([])
  })
})

describe('run: recuento de líneas', () => {
  it('cuenta solo el código con contenido', () => {
    const { api } = recorder()
    const result = run('# comentario\nmarcar(1)\n\nmarcar(2)\n', api)

    expect(result.lines).toBe(2)
  })

  it('devuelve un resultado vacío sin código', () => {
    expect(run('   \n# solo un comentario\n')).toEqual({ lines: 0, output: [] })
  })
})
