import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** El campo grande: un cultivo por casilla, del 1 al 100, y el hangar en la 0. */
export const CROP_COUNT = 100

/** Cada cuántos cultivos se guarda un fotograma: 100 dibujos serían eternos. */
export const CROP_SAMPLE = 10

const CROP_MILESTONES: readonly number[] = Array.from(
  { length: CROP_COUNT / CROP_SAMPLE + 1 },
  (_, index) => index * CROP_SAMPLE,
)

export interface IrrigationState {
  /** Casilla donde está el dron: 0 es el hangar. */
  position: number
  /** Cultivos regados, por número de casilla. */
  watered: Set<number>
}

export function createIrrigation(): IrrigationState {
  return { position: 0, watered: new Set<number>() }
}

/** API del nivel: el dron avanza casilla a casilla y riega la que pisa. */
export function createIrrigationApi(state: IrrigationState): Api {
  return {
    avanzar() {
      if (state.position >= CROP_COUNT) {
        throw new ApiError('El dron se sale del campo: solo hay 100 cultivos')
      }
      state.position += 1
    },
    regar() {
      if (state.position < 1) {
        throw new ApiError('En la casilla 0 está el hangar: avanza antes de regar')
      }
      if (state.watered.has(state.position)) {
        throw new ApiError(`El cultivo ${state.position} ya está regado`)
      }
      state.watered.add(state.position)
    },
  }
}

export function wateredCrops(state: IrrigationState): number {
  return state.watered.size
}

export function judgeIrrigation(state: IrrigationState): { complete: boolean; missing: string } {
  const watered = wateredCrops(state)
  if (watered >= CROP_COUNT) return { complete: true, missing: '' }

  return {
    complete: false,
    missing: `Faltan ${CROP_COUNT - watered} cultivos por regar: van ${watered} de ${CROP_COUNT}. Un bucle los riega todos.`,
  }
}

/**
 * Traza visual: un fotograma cada diez cultivos, no uno por cultivo. Con los
 * 200 pasos del programa la animación duraría minutos.
 */
export function irrigationSteps(state: IrrigationState): SceneStep[] {
  const crops = [...state.watered].sort((left, right) => left - right)

  return CROP_MILESTONES.filter((count) => count <= crops.length).map((count) => ({
    kind: 'irrigation' as const,
    watered: crops.slice(0, count),
    position: count === 0 ? 0 : (crops[count - 1] ?? 0),
  }))
}
