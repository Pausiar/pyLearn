import { run } from '../interp/run'
import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

export interface Reading {
  /** «sala» es el termómetro de dentro de la función; «fuera», el global. */
  room: string
  value: number
}

/** Los dos termostatos con los que se prueba el programa. */
export const LAB_BASES: readonly number[] = [20, 30]

/** Lo que tiene que apuntar el cuaderno con cada termostato. */
export function expectedReadings(base: number): Reading[] {
  return [
    { room: 'sala', value: base + 5 },
    { room: 'fuera', value: base },
    { room: 'sala', value: base + 8 },
    { room: 'fuera', value: base },
  ]
}

export interface LabState {
  base: number
  readings: Reading[]
}

export function createLab(base: number = LAB_BASES[0] ?? 20): LabState {
  return { base, readings: [] }
}

/** API del nivel: el termostato marca la base y el cuaderno apunta las lecturas. */
export function createLabApi(state: LabState): Api {
  return {
    termostato: () => state.base,
    medir(sitio, valor) {
      if (sitio !== 'sala' && sitio !== 'fuera') {
        throw new ApiError('medir() anota dos sitios: "sala" o "fuera"')
      }
      if (typeof valor !== 'number') {
        throw new ApiError('medir() necesita el número que marca el termómetro')
      }
      if (state.readings.length >= expectedReadings(state.base).length) {
        throw new ApiError('El cuaderno ya tiene sus cuatro lecturas de hoy')
      }
      state.readings.push({ room: sitio, value: valor })
    },
  }
}

function findMismatch(readings: readonly Reading[], expected: readonly Reading[]): number {
  return expected.findIndex(
    (reading, index) =>
      readings[index]?.room !== reading.room || readings[index]?.value !== reading.value,
  )
}

/**
 * El laboratorio se juzga con el termostato de hoy y otra vez con otro más alto:
 * así la sala tiene que salir del termostato y no de números escritos a mano.
 */
export function judgeLab(
  first: LabState,
  code: string,
): { complete: boolean; missing: string; steps: SceneStep[] } {
  const steps = labSteps(first)
  const expected = expectedReadings(first.base)

  const firstWrong = findMismatch(first.readings, expected)
  if (firstWrong !== -1) {
    const want = expected[firstWrong]!
    const got = first.readings[firstWrong]
    return {
      complete: false,
      missing: `La lectura ${firstWrong + 1} tiene que ser «${want.room}» en ${want.value} y ha sido ${got ? `«${got.room}» en ${got.value}` : 'nada'}.`,
      steps,
    }
  }

  const other = createLab(LAB_BASES[1])
  const second = run(code, createLabApi(other))
  if (second.error) {
    return {
      complete: false,
      missing: `Con el termostato en ${other.base} grados el programa falla: ${second.error.message}`,
      steps,
    }
  }

  const secondWrong = findMismatch(other.readings, expectedReadings(other.base))
  if (secondWrong !== -1) {
    return {
      complete: false,
      missing: `Con el termostato en ${other.base} grados, la lectura ${secondWrong + 1} no cuadra: la sala se calcula a partir de lo que marca termostato(), no con números fijos.`,
      steps,
    }
  }

  return { complete: true, missing: '', steps }
}

/** Traza visual: el cuaderno se va llenando lectura a lectura. */
export function labSteps(state: LabState): SceneStep[] {
  if (state.readings.length === 0) return [{ kind: 'lab', readings: [] }]

  return state.readings.map((_, index) => ({
    kind: 'lab' as const,
    readings: state.readings.slice(0, index + 1).map((reading) => ({ ...reading })),
  }))
}
