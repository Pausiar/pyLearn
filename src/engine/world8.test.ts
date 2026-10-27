import { describe, expect, it } from 'vitest'
import { run } from '../interp/run'
import { createBeast, createBeastApi, judgeBeast } from './beasts'
import { createForge, createForgeApi, judgeForge } from './forge'
import { createPet, createPetApi, judgePet } from './pet'
import { createRace, createRaceApi, judgeRace } from './race'
import { createWorkshop, createWorkshopApi, judgeWorkshop } from './workshop'

const PET_CODE = [
  'class Mascota:',
  '    def __init__(self, nombre):',
  '        self.nombre = nombre',
  '        self.energia = 3',
  '',
  '    def jugar(self):',
  '        self.energia = self.energia - 1',
  '        return self.energia',
  '',
  'rex = Mascota("Rex")',
  'print("Nombre: " + rex.nombre)',
  'print("Energia: " + str(rex.energia))',
  'print("Jugar: " + str(rex.jugar()))',
  'print("Ahora: " + str(rex.energia))',
  'apuntar(rex.nombre, rex.energia)',
].join('\n')

const WORKSHOP_CODE = [
  'class Robot:',
  '    def __init__(self, nombre):',
  '        self.nombre = nombre',
  '        self.piezas = []',
  '',
  '    def montar(self, pieza):',
  '        self.piezas.append(pieza)',
  '',
  '    def listo(self):',
  '        return len(self.piezas) >= 2',
  '',
  'bruno = Robot("Bruno")',
  'bruno.montar("rueda")',
  'bruno.montar("antena")',
  'print(bruno.nombre + " con " + str(len(bruno.piezas)) + " piezas")',
  'revisar(bruno.nombre, bruno.piezas)',
  'entregar(bruno.listo())',
].join('\n')

const BEAST_CODE = [
  'class Monstruo:',
  '    def __init__(self, nombre, vida):',
  '        self.nombre = nombre',
  '        self.vida = vida',
  '',
  '    def golpe(self):',
  '        self.vida = self.vida - 1',
  '        return self.vida',
  '',
  '    def presentar(self):',
  '        return self.nombre + " con " + str(self.vida)',
  '',
  'class Dragon(Monstruo):',
  '    def __init__(self, nombre):',
  '        super().__init__(nombre, 5)',
  '',
  '    def rugir(self):',
  '        return "¡GRRR!"',
  '',
  'smaug = Dragon("Smaug")',
  'print(smaug.presentar())',
  'print("Rugido: " + smaug.rugir())',
  'print("Golpe: " + str(smaug.golpe()))',
  'combate(smaug.nombre, smaug.vida)',
].join('\n')

const RACE_CODE = [
  'pilotos = ["Sara", "Leo", "Nuria", "Teo"]',
  'tiempos = [48, 39, 55, 42]',
  'ordenados = sorted(tiempos)',
  'print(ordenados)',
  'mejor = ordenados[0]',
  'print("Mejor: " + str(mejor))',
  'ganador = tiempos.index(mejor)',
  'print("Piloto: " + pilotos[ganador])',
  'random.seed(11)',
  'secreto = random.randint(1, 10)',
  'print("Secreto: " + str(secreto))',
  'carrera(pilotos[ganador], mejor)',
  'adivinar(secreto)',
].join('\n')

const FORGE_CODE = [
  'def crear(nombre):',
  '    return {"nombre": nombre, "vida": 3, "pasos": 0}',
  '',
  'def mover(estado, direccion):',
  '    estado["pasos"] = estado["pasos"] + 1',
  '    if direccion == "norte":',
  '        estado["vida"] = estado["vida"] - 1',
  '    return estado',
  '',
  'jugar(crear, mover)',
].join('\n')

describe('nivel 36: la mascota', () => {
  it('se completa con la ficha apuntada', () => {
    const pet = createPet()
    const result = run(PET_CODE, createPetApi(pet))

    expect(result.error).toBeUndefined()
    expect(judgePet(pet, result.output).complete).toBe(true)
  })

  it('avisa si jugar() no gasta energía', () => {
    const pet = createPet()
    const code = PET_CODE.replace(
      '        self.energia = self.energia - 1\n',
      '        pass\n',
    )
    const result = run(code, createPetApi(pet))

    expect(judgePet(pet, result.output).complete).toBe(false)
  })

  it('rechaza apuntar sin el nombre', () => {
    const pet = createPet()

    expect(run('apuntar(3, 2)', createPetApi(pet)).error?.message).toContain('nombre de la mascota')
  })
})

describe('nivel 37: el taller', () => {
  it('se completa con el robot revisado y listo', () => {
    const workshop = createWorkshop()
    const result = run(WORKSHOP_CODE, createWorkshopApi(workshop))

    expect(result.error).toBeUndefined()
    expect(judgeWorkshop(workshop, result.output).complete).toBe(true)
  })

  it('avisa si falta una pieza', () => {
    const workshop = createWorkshop()
    const result = run(
      WORKSHOP_CODE.replace('bruno.montar("antena")\n', ''),
      createWorkshopApi(workshop),
    )

    expect(judgeWorkshop(workshop, result.output).complete).toBe(false)
  })

  it('rechaza revisar sin la lista de piezas', () => {
    const workshop = createWorkshop()

    expect(run('revisar("Bruno", 3)', createWorkshopApi(workshop)).error?.message).toContain(
      'lista de piezas',
    )
  })
})

describe('nivel 38: herencia', () => {
  it('se completa con el dragón heredado', () => {
    const beast = createBeast()
    const result = run(BEAST_CODE, createBeastApi(beast))

    expect(result.error).toBeUndefined()
    expect(judgeBeast(beast, result.output).complete).toBe(true)
  })

  it('sin el super() el dragón no tiene los atributos de la madre', () => {
    const beast = createBeast()
    const result = run(
      BEAST_CODE.replace('        super().__init__(nombre, 5)\n', '        pass\n'),
      createBeastApi(beast),
    )

    // El __init__ de Monstruo nunca corrió, así que no hay ni nombre ni vida.
    expect(result.error?.message).toContain('Dragon no tiene «nombre»')
  })

  it('rechaza combate sin la vida como número', () => {
    const beast = createBeast()

    expect(run('combate("Smaug", "mucha")', createBeastApi(beast)).error?.message).toContain(
      'vida como número',
    )
  })
})

describe('nivel 39: la carrera', () => {
  it('se completa con podio y número secreto', () => {
    const race = createRace()
    const result = run(RACE_CODE, createRaceApi(race))

    expect(result.error).toBeUndefined()
    expect(judgeRace(race, result.output).complete).toBe(true)
  })

  it('avisa si el número no sale de la semilla 11', () => {
    const race = createRace()
    const result = run(RACE_CODE.replace('random.seed(11)', 'random.seed(5)'), createRaceApi(race))

    expect(judgeRace(race, result.output).complete).toBe(false)
  })

  it('rechaza el podio sin piloto', () => {
    const race = createRace()

    expect(run('carrera(3, 39)', createRaceApi(race)).error?.message).toContain(
      'nombre del piloto',
    )
  })
})

describe('nivel 40: tu minijuego', () => {
  it('el motor juega el minijuego completo', () => {
    const forge = createForge()
    const result = run(FORGE_CODE, createForgeApi(forge))

    expect(result.error).toBeUndefined()
    expect(judgeForge(forge).complete).toBe(true)
  })

  it('avisa si mover() no quita vida al ir al norte', () => {
    const forge = createForge()
    const code = [
      'def crear(nombre):',
      '    return {"nombre": nombre, "vida": 3, "pasos": 0}',
      '',
      'def mover(estado, direccion):',
      '    estado["pasos"] = estado["pasos"] + 1',
      '    return estado',
      '',
      'jugar(crear, mover)',
    ].join('\n')
    const result = run(code, createForgeApi(forge))

    expect(result.error).toBeUndefined()
    expect(judgeForge(forge).complete).toBe(false)
  })

  it('avisa si crear() no devuelve el diccionario del héroe', () => {
    const forge = createForge()
    const result = run(
      'def crear(nombre):\n    return nombre\n\ndef mover(estado, direccion):\n    return estado\n\njugar(crear, mover)',
      createForgeApi(forge),
    )

    expect(result.error?.message).toContain('diccionario del héroe')
  })

  it('rechaza jugar sin las dos funciones', () => {
    const forge = createForge()

    expect(run('jugar(1, 2)', createForgeApi(forge)).error?.message).toContain('crear(nombre)')
  })
})
