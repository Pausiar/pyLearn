import { ApiError, type Api, type Scalar } from '../interp/types'
import type { SceneStep } from './scene'

/** Pasillos impares del almacén: los que alcanza el escáner. */
export const SCANNER_AISLES: readonly number[] = [1, 3, 5, 7, 9, 11]

/** Pasillos vacíos: gastar una lectura en ellos es un error, se saltan con continue. */
export const EMPTY_AISLES: readonly number[] = [3, 11]

/** Cajas que hay en cada pasillo con mercancía. */
export const AISLE_BOXES: Readonly<Record<number, number>> = { 1: 3, 5: 4, 7: 5, 9: 4 }

/** La caja transportadora se llena con diez cajas: ahí toca parar con break. */
export const CARGO_LIMIT = 10

/**
 * Los pasillos que se alcanzan antes de llenar la caja: 1, 5 y 7, que suman 12.
 * Los otros dos (9 y 11) quedan sin revisar porque el break llega antes.
 */
export const SCANNER_TOTAL: number = [1, 5, 7].reduce(
  (sum, aisle) => sum + (AISLE_BOXES[aisle] ?? 0),
  0,
)

/** Lo que el escáner anuncia al parar. */
export const SCANNER_MESSAGE = `Cajas cargadas: ${SCANNER_TOTAL}`

export interface ScannerState {
  /** Pasillos que han gastado una lectura, en orden. */
  readings: number[]
  /** Cajas cargadas hasta ahora. */
  boxes: number
}

export function createScanner(): ScannerState {
  return { readings: [], boxes: 0 }
}

function checkAisle(value: Scalar | undefined): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    !SCANNER_AISLES.includes(value)
  ) {
    throw new ApiError('El escáner recorre los pasillos impares: 1, 3, 5, 7, 9 y 11')
  }
  return value
}

/** API del nivel: vacio() es gratis y revisar() gasta una lectura. */
export function createScannerApi(state: ScannerState): Api {
  return {
    vacio(pasillo) {
      return EMPTY_AISLES.includes(checkAisle(pasillo))
    },
    revisar(pasillo) {
      const id = checkAisle(pasillo)
      if (EMPTY_AISLES.includes(id)) {
        throw new ApiError(`El pasillo ${id} está vacío: no gastes una lectura, sáltalo con continue`)
      }

      state.readings.push(id)
      const boxes = AISLE_BOXES[id] ?? 0
      state.boxes += boxes
      return boxes
    },
  }
}

export function judgeScanner(
  state: ScannerState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  if (state.readings.length === 0) {
    return {
      complete: false,
      missing: 'El escáner no ha revisado ningún pasillo: recórrelos con range(1, 13, 2).',
    }
  }

  if (state.readings.includes(9)) {
    return {
      complete: false,
      missing: `Al llegar a ${CARGO_LIMIT} cajas la caja transportadora ya estaba llena y el pasillo 9 sigue revisándose: hay que parar con break.`,
    }
  }

  if (state.boxes !== SCANNER_TOTAL) {
    return {
      complete: false,
      missing: `Las cuentas no cuadran: has cargado ${state.boxes} cajas. Suma con revisar() las cajas de cada pasillo con mercancía.`,
    }
  }

  const message = output.at(-1) ?? ''
  if (message !== SCANNER_MESSAGE) {
    return {
      complete: false,
      missing: `El escáner dice «${message === '' ? 'nada' : message}»; tiene que decir «${SCANNER_MESSAGE}».`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: un fotograma por lectura, con las cajas acumuladas. */
export function scannerSteps(state: ScannerState): SceneStep[] {
  const frames: SceneStep[] = [{ kind: 'scanner', readings: [], boxes: 0, reached: 0 }]

  state.readings.forEach((aisle, index) => {
    const readings = state.readings.slice(0, index + 1)
    const boxes = readings.reduce((sum, id) => sum + (AISLE_BOXES[id] ?? 0), 0)
    frames.push({ kind: 'scanner', readings, boxes, reached: aisle })
  })

  return frames
}
