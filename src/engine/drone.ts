import { ApiError, type Api } from '../interp/types'

/** Casillas del campo, contando el hangar como 0. */
export const FIELD_CELLS = 6

/** Casillas con cultivo. */
export const CROPS: readonly number[] = [1, 2, 3, 4]

export type DroneAction = { type: 'move' } | { type: 'water' }

export interface DroneField {
  x: number
  watered: Set<number>
}

export function createField(): DroneField {
  return { x: 0, watered: new Set<number>() }
}

/** API que ve el alumno. Valida el estado y anota la acción para poder animarla después. */
export function createApi(field: DroneField, actions: DroneAction[]): Api {
  return {
    avanzar() {
      if (field.x >= FIELD_CELLS - 1) {
        throw new ApiError('El dron se sale del campo')
      }
      field.x += 1
      actions.push({ type: 'move' })
    },
    regar() {
      if (!CROPS.includes(field.x)) {
        throw new ApiError('Aquí no hay ningún cultivo que regar')
      }
      field.watered.add(field.x)
      actions.push({ type: 'water' })
    },
  }
}

export function isComplete(field: DroneField): boolean {
  return CROPS.every((crop) => field.watered.has(crop))
}

export function wateredCount(field: DroneField): number {
  return CROPS.filter((crop) => field.watered.has(crop)).length
}

/** Texto accesible del estado del campo, para el aria-label del lienzo. */
export function describeField(field: DroneField): string {
  return `El dron está en la casilla ${field.x}. Cultivos regados: ${wateredCount(field)} de ${CROPS.length}.`
}
