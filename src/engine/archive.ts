import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** Las salas del museo: nombre, sala y piezas, tal y como empieza el archivo. */
export const ARCHIVE_START: readonly (readonly [string, string, number])[] = [
  ['dinos', 'norte', 12],
  ['arte', 'sur', 8],
  ['tecno', 'este', 5],
]

/** Lo que tiene que salir por la consola, en orden. */
export const ARCHIVE_LINES: readonly string[] = [
  'dinos -> norte',
  'arte -> sur',
  'tecno -> este',
  'Piezas: 25',
]

export interface ArchiveState {
  archive: Record<string, Record<string, unknown>> | null
}

export function createArchive(): ArchiveState {
  return { archive: null }
}

/** API del nivel: el archivo vuelve entero, con una ficha anidada por sala. */
export function createArchiveApi(state: ArchiveState): Api {
  return {
    entregar(archivo) {
      if (typeof archivo !== 'object' || archivo === null || Array.isArray(archivo)) {
        throw new ApiError('entregar() espera el archivo entero: un diccionario con una ficha por sala')
      }

      state.archive = archivo as Record<string, Record<string, unknown>>
    },
  }
}

export function judgeArchive(
  state: ArchiveState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  const announced = ARCHIVE_LINES.findIndex((expected, index) => output[index] !== expected)
  if (announced !== -1) {
    return {
      complete: false,
      missing: `La línea ${announced + 1} no es la esperada: con print() tiene que salir «${ARCHIVE_LINES[announced]}».`,
    }
  }

  if (output.length < ARCHIVE_LINES.length) {
    return {
      complete: false,
      missing: `Faltan líneas del archivo: la siguiente tiene que ser «${ARCHIVE_LINES[output.length]}».`,
    }
  }

  if (state.archive === null) {
    return { complete: false, missing: 'El archivo no ha vuelto: entrégalo con entregar(archivo).' }
  }

  if (Object.keys(state.archive).length !== ARCHIVE_START.length) {
    return {
      complete: false,
      missing: 'El archivo tiene que llevar las tres salas del principio, sin añadir ni quitar.',
    }
  }

  for (const [name, hall, pieces] of ARCHIVE_START) {
    const room = state.archive[name]
    if (typeof room !== 'object' || room === null) {
      return { complete: false, missing: `En el archivo falta la ficha de «${name}».` }
    }
    if (room.sala !== hall || room.piezas !== pieces) {
      return {
        complete: false,
        missing: `La ficha de «${name}» tiene que llevar la sala «${hall}» y ${pieces} piezas.`,
      }
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: las salas del museo y las que ya se han consultado. */
export function archiveSteps(state: ArchiveState): SceneStep[] {
  const rooms = ARCHIVE_START.map(([name, hall, pieces]) => ({ name, hall, pieces }))
  if (state.archive === null) return [{ kind: 'archive', rooms, visited: [], delivered: false }]

  return rooms.map((_, index) => ({
    kind: 'archive' as const,
    rooms,
    visited: rooms.slice(0, index + 1).map((room) => room.name),
    delivered: index === rooms.length - 1,
  }))
}
