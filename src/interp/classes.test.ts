import { describe, expect, it } from 'vitest'
import { run } from './run'
import type { Api } from './types'

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

const PET = [
  'class Mascota:',
  '    def __init__(self, nombre):',
  '        self.nombre = nombre',
  '        self.energia = 3',
  '',
  '    def jugar(self):',
  '        self.energia = self.energia - 1',
  '        return self.energia',
].join('\n')

describe('clases: objetos y atributos', () => {
  it('crea objetos con __init__ y lee sus atributos', () => {
    expect(printed(`${PET}\nrex = Mascota("Rex")\nprint(rex.nombre, rex.energia)`)).toEqual([
      'Rex 3',
    ])
  })

  it('cada objeto guarda sus propios atributos', () => {
    const code = [
      PET,
      'rex = Mascota("Rex")',
      'luna = Mascota("Luna")',
      'rex.jugar()',
      'print(rex.energia, luna.energia)',
    ].join('\n')

    expect(printed(code)).toEqual(['2 3'])
  })

  it('el método devuelve lo que dice su return', () => {
    expect(printed(`${PET}\nprint(Mascota("Rex").jugar())`)).toEqual(['2'])
  })

  it('imprime el objeto con el nombre de su clase', () => {
    expect(printed(`${PET}\nprint(Mascota("Rex"))`)).toEqual(['<Mascota>'])
  })

  it('avisa si al método le falta self', () => {
    const code = ['class Caja:', '    def abrir():', '        return 1', 'Caja().abrir()'].join('\n')

    expect(failure(code).message).toContain('le falta self')
  })

  it('avisa si el atributo no existe', () => {
    expect(failure(`${PET}\nprint(Mascota("Rex").vidas)`).message).toContain('no tiene «vidas»')
  })

  it('avisa si el método no existe y dice cuáles hay', () => {
    expect(failure(`${PET}\nMascota("Rex").volar()`).message).toContain('jugar')
  })

  it('no deja crear sin __init__ un objeto con valores', () => {
    expect(failure('class Vacia:\n    pass\nprint(Vacia(1))').message).toContain('no acepta valores')
  })

  it('no deja dar valor a un atributo de algo que no es un objeto', () => {
    expect(failure('numero = 3\nnumero.vida = 5').message).toContain('atributos de un objeto')
  })
})

describe('clases: atributos de clase y herencia', () => {
  it('los atributos de clase se leen desde la clase y desde el objeto', () => {
    const code = ['class Perro:', '    patas = 4', 'print(Perro.patas, Perro().patas)'].join('\n')

    expect(printed(code)).toEqual(['4 4'])
  })

  it('hereda los métodos de la clase madre', () => {
    const code = [
      PET,
      'class Perro(Mascota):',
      '    def ladrar(self):',
      '        return "guau"',
      'duna = Perro("Duna")',
      'print(duna.ladrar(), duna.jugar(), duna.nombre)',
    ].join('\n')

    expect(printed(code)).toEqual(['guau 2 Duna'])
  })

  it('super().__init__ llama a la clase madre', () => {
    const code = [
      PET,
      'class Robot(Mascota):',
      '    def __init__(self, nombre):',
      '        super().__init__(nombre)',
      '        self.energia = 9',
      'print(Robot("R2").energia)',
    ].join('\n')

    expect(printed(code)).toEqual(['9'])
  })

  it('un método heredado trabaja sobre el objeto de la clase hija', () => {
    const code = [
      PET,
      'class Perro(Mascota):',
      '    def __init__(self, nombre):',
      '        super().__init__(nombre)',
      '        self.energia = 5',
      'duna = Perro("Duna")',
      'duna.jugar()',
      'print(duna.energia, duna.nombre)',
    ].join('\n')

    expect(printed(code)).toEqual(['4 Duna'])
  })

  it('la clase hija puede cambiar un método de la madre', () => {
    const code = [
      PET,
      'class Perro(Mascota):',
      '    def jugar(self):',
      '        return "el perro no juega"',
      'print(Perro("Duna").jugar())',
    ].join('\n')

    expect(printed(code)).toEqual(['el perro no juega'])
  })

  it('super() también llama a otros métodos de la madre', () => {
    const code = [
      PET,
      'class Perro(Mascota):',
      '    def jugar(self):',
      '        return super().jugar() * 10',
      'print(Perro("Duna").jugar())',
    ].join('\n')

    expect(printed(code)).toEqual(['20'])
  })

  it('avisa si la clase madre no existe', () => {
    expect(failure('class Perro(Gato):\n    pass').message).toContain('no existe')
  })

  it('avisa si super() se usa fuera de un método', () => {
    expect(failure('super()').message).toContain('dentro de un método')
  })

  it('super() no lleva argumentos', () => {
    const code = [
      PET,
      'class Perro(Mascota):',
      '    def __init__(self):',
      '        super(1)',
      'Perro()',
    ].join('\n')

    expect(failure(code).message).toBe('super() no lleva argumentos')
  })
})

describe('clases: con la API del nivel', () => {
  it('no deja pasar un objeto a la API', () => {
    const api: Api = { enviar: () => null }

    expect(run(`${PET}\nenviar(Mascota("Rex"))`, api).error?.message).toContain('no acepta')
  })

  it('no deja pasar una clase a la API', () => {
    const api: Api = { enviar: () => null }

    expect(run(`${PET}\nenviar(Mascota)`, api).error?.message).toContain('no acepta')
  })
})
