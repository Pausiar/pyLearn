import { describe, expect, it } from 'vitest'
import { run } from '../interp/run'
import { createAgenda, createAgendaApi, judgeAgenda } from './agenda'
import { createCensus, createCensusApi, judgeCensus } from './census'
import { createAlbum, createAlbumApi, judgeAlbum } from './album'
import { createHunt, createHuntApi, judgeHunt } from './hunt'
import { createArchive, createArchiveApi, judgeArchive } from './archive'

const AGENDA = 'agenda = {"mando": "puente", "ingenieria": "taller", "bodega": "deposito"}'
const CENSO = 'censo = {"marte": 12, "venus": 8, "luna": 5}'

function agendaRun(code: string) {
  const agenda = createAgenda()
  const result = run(code, createAgendaApi(agenda))
  return { result, outcome: judgeAgenda(agenda, result.output) }
}

function censusRun(code: string) {
  const census = createCensus()
  const result = run(code, createCensusApi(census))
  return { result, outcome: judgeCensus(census, result.output) }
}

function albumRun(code: string) {
  const album = createAlbum()
  const result = run(code, createAlbumApi(album))
  return { result, outcome: judgeAlbum(album, result.output) }
}

function huntRun(code: string) {
  const hunt = createHunt()
  const result = run(code, createHuntApi(hunt))
  return { result, outcome: judgeHunt(hunt, result.output) }
}

function archiveRun(code: string) {
  const archive = createArchive()
  const result = run(code, createArchiveApi(archive))
  return { result, outcome: judgeArchive(archive, result.output) }
}

describe('nivel 26: la agenda de la nave', () => {
  it('se completa con la agenda entera', () => {
    const { outcome } = agendaRun(
      [
        AGENDA,
        'print("Puesto: " + agenda["mando"])',
        'print("Cocina: " + agenda.get("cocina", "comedor"))',
        'agenda["cocina"] = "comedor"',
        'print("En la agenda: " + str("cocina" in agenda))',
        'enviar(agenda)',
      ].join('\n'),
    )

    expect(outcome.complete).toBe(true)
  })

  it('avisa si la agenda no ha llegado al puente', () => {
    const { outcome } = agendaRun(
      [
        AGENDA,
        'print("Puesto: " + agenda["mando"])',
        'print("Cocina: " + agenda.get("cocina", "comedor"))',
        'print("En la agenda: " + "True")',
      ].join('\n'),
    )

    expect(outcome.complete).toBe(false)
    expect(outcome.missing).toContain('enviar(agenda)')
  })

  it('avisa si falta la cocina en el diccionario', () => {
    const { outcome } = agendaRun(
      [
        AGENDA,
        'print("Puesto: " + agenda["mando"])',
        'print("Cocina: " + agenda.get("cocina", "comedor"))',
        'print("En la agenda: " + "True")',
        'enviar(agenda)',
      ].join('\n'),
    )

    expect(outcome.complete).toBe(false)
    expect(outcome.missing).toContain('ha llegado con 3')
  })

  it('avisa si el canal de la cocina no es el suyo', () => {
    const { outcome } = agendaRun(
      [
        'agenda = {"mando": "puente", "ingenieria": "taller", "bodega": "deposito", "cocina": "bodega"}',
        'print("Puesto: " + agenda["mando"])',
        'print("Cocina: " + "comedor")',
        'print("En la agenda: " + "True")',
        'enviar(agenda)',
      ].join('\n'),
    )

    expect(outcome.missing).toContain('con el canal «comedor»')
  })

  it('rechaza lo que no es un diccionario', () => {
    expect(agendaRun('enviar(3)').result.error?.message).toContain('espera la agenda entera')
  })
})

describe('nivel 27: el censo', () => {
  it('avisa si el total de habitantes no cuadra', () => {
    const { outcome } = censusRun(
      [
        CENSO,
        'print("Planetas: 3")',
        'print("Habitantes: 24")',
        'print("marte: 12")',
        'print("venus: 8")',
        'print("luna: 5")',
        'cerrar(censo)',
      ].join('\n'),
    )

    expect(outcome.complete).toBe(false)
    expect(outcome.missing).toContain('«Habitantes: 25»')
  })

  it('avisa si el censo no vuelve a la oficina', () => {
    const { outcome } = censusRun(
      [
        CENSO,
        'print("Planetas: 3")',
        'print("Habitantes: 25")',
        'print("marte: 12")',
        'print("venus: 8")',
        'print("luna: 5")',
      ].join('\n'),
    )

    expect(outcome.missing).toContain('cerrar(censo)')
  })

  it('no admite planetas de más', () => {
    const { outcome } = censusRun(
      [
        'censo = {"marte": 12, "venus": 8, "luna": 5, "sol": 1}',
        'print("Planetas: 3")',
        'print("Habitantes: 25")',
        'print("marte: 12")',
        'print("venus: 8")',
        'print("luna: 5")',
        'cerrar(censo)',
      ].join('\n'),
    )

    expect(outcome.missing).toContain('ha llegado con 4')
  })
})

describe('nivel 28: cromos únicos', () => {
  it('avisa si el álbum llega con repes', () => {
    const { outcome } = albumRun(
      [
        'repes = ["gol", "gol", "mate", "rey", "mate", "gol"]',
        'print("Únicos: 3")',
        'print("Ficha: gol, 1")',
        'entregar(repes, ("gol", 1))',
      ].join('\n'),
    )

    expect(outcome.complete).toBe(false)
    expect(outcome.missing).toContain('un conjunto')
  })

  it('avisa si la ficha no es la tupla esperada', () => {
    const { outcome } = albumRun(
      [
        'repes = ["gol", "gol", "mate", "rey", "mate", "gol"]',
        'print("Únicos: 3")',
        'print("Ficha: gol, 1")',
        'entregar(set(repes), ("mate", 2))',
      ].join('\n'),
    )

    expect(outcome.missing).toContain('La ficha tiene que ser la tupla')
  })

  it('rechaza entregar sin ficha', () => {
    const { result } = albumRun('entregar({1, 2})')

    expect(result.error?.message).toContain('espera la ficha')
  })
})

describe('nivel 29: cazamonstruos', () => {
  it('avisa si se cuelan monstruos que no tocan', () => {
    const { outcome } = huntRun(
      [
        'print("Peligrosos: 3")',
        "print(['goblin', 'ogro', 'trol'])",
        'capturar(["draco", "ogro", "trol"])',
      ].join('\n'),
    )

    expect(outcome.complete).toBe(false)
    expect(outcome.missing).toContain('«ogro»')
  })

  it('avisa si el orden no es el del bosque', () => {
    const { outcome } = huntRun(
      [
        'print("Peligrosos: 3")',
        "print(['goblin', 'ogro', 'trol'])",
        'capturar(sorted(["ogro", "trol", "goblin"]))',
      ].join('\n'),
    )

    expect(outcome.missing).toContain('posición 1')
  })

  it('rechaza capturar algo que no es una lista', () => {
    expect(huntRun('capturar(3)').result.error?.message).toContain('espera la lista')
  })
})

describe('nivel 30: el archivo del museo', () => {
  it('avisa si el archivo no se entrega', () => {
    const { outcome } = archiveRun(
      [
        'print("dinos -> norte")',
        'print("arte -> sur")',
        'print("tecno -> este")',
        'print("Piezas: 25")',
      ].join('\n'),
    )

    expect(outcome.complete).toBe(false)
    expect(outcome.missing).toContain('entregar(archivo)')
  })

  it('avisa si se añade una sala que no está', () => {
    const { outcome } = archiveRun(
      [
        'archivo = {"dinos": {"piezas": 12, "sala": "norte"}, "arte": {"piezas": 8, "sala": "sur"}, "tecno": {"piezas": 5, "sala": "este"}, "extra": {"piezas": 0, "sala": "sur"}}',
        'print("dinos -> norte")',
        'print("arte -> sur")',
        'print("tecno -> este")',
        'print("Piezas: 25")',
        'entregar(archivo)',
      ].join('\n'),
    )

    expect(outcome.missing).toContain('tres salas')
  })

  it('avisa si una ficha pierde sus piezas', () => {
    const { outcome } = archiveRun(
      [
        'archivo = {"dinos": {"piezas": 12, "sala": "norte"}, "arte": {"piezas": 9, "sala": "sur"}, "tecno": {"piezas": 5, "sala": "este"}}',
        'print("dinos -> norte")',
        'print("arte -> sur")',
        'print("tecno -> este")',
        'print("Piezas: 25")',
        'entregar(archivo)',
      ].join('\n'),
    )

    expect(outcome.missing).toContain('La ficha de «arte»')
  })
})
