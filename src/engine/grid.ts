import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** La huerta del jefe: tres filas de cuatro casillas. */
export const GRID_ROWS = 3
export const GRID_COLUMNS = 4
export const GRID_CELLS = GRID_ROWS * GRID_COLUMNS

/** Aviso que hay que dar al terminar cada fila. */
export function rowMessage(row: number): string {
  return `Fila ${row} regada`
}

export const GRID_MESSAGES: readonly string[] = Array.from({ length: GRID_ROWS }, (_, index) =>
  rowMessage(index + 1),
)

export interface GridState {
  row: number
  column: number
  /** Casillas regadas, por índice de lectura: 0 es la primera de la fila 1. */
  watered: Set<number>
  /** Casillas regadas en orden, para animar la traza. */
  history: number[]
  /** El dron ya ha salido del campo: no cabe ninguna acción más. */
  done: boolean
}

export function createGrid(): GridState {
  return { row: 0, column: 0, watered: new Set<number>(), history: [], done: false }
}

function cellOf(state: GridState): number {
  return state.row * GRID_COLUMNS + state.column
}

/**
 * API del nivel: regar() riega la casilla donde está el dron y avanzar() pasa a
 * la siguiente, bajando sola de fila al terminar una. Al final del campo el dron
 * sale solo si ya está todo regado.
 */
export function createGridApi(state: GridState): Api {
  return {
    regar() {
      if (state.done) {
        throw new ApiError('El campo ya está regado entero: no queda nada por regar')
      }

      const cell = cellOf(state)
      if (state.watered.has(cell)) {
        throw new ApiError(
          `La casilla ${cell + 1} ya está regada: cada cultivo necesita agua una sola vez`,
        )
      }

      state.watered.add(cell)
      state.history.push(cell)
    },
    avanzar() {
      if (state.done) {
        throw new ApiError('El dron ya ha salido del campo')
      }

      if (state.column + 1 < GRID_COLUMNS) {
        state.column += 1
        return
      }

      if (state.row + 1 < GRID_ROWS) {
        state.row += 1
        state.column = 0
        return
      }

      if (state.watered.size < GRID_CELLS) {
        throw new ApiError('El dron se sale del campo: todavía quedan casillas por regar')
      }

      state.done = true
    },
  }
}

export function judgeGrid(
  state: GridState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  if (state.watered.size < GRID_CELLS) {
    return {
      complete: false,
      missing: `Faltan ${GRID_CELLS - state.watered.size} casillas por regar: van ${state.watered.size} de ${GRID_CELLS}.`,
    }
  }

  const announced = output.length === GRID_MESSAGES.length &&
    GRID_MESSAGES.every((message, index) => output[index] === message)

  if (!announced) {
    return {
      complete: false,
      missing: `El campo está regado, pero falta avisar de cada fila con print(): «${GRID_MESSAGES.join('», «')}».`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: un fotograma por casilla regada. */
export function gridSteps(state: GridState): SceneStep[] {
  if (state.history.length === 0) return [{ kind: 'grid', watered: [], cell: 0 }]

  return state.history.map((cell, index) => ({
    kind: 'grid' as const,
    watered: [...state.history.slice(0, index + 1)].sort((left, right) => left - right),
    cell,
  }))
}
