import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

export const PET_NAME = 'Rex'
export const PET_START_ENERGY = 3
export const PET_END_ENERGY = 2

/** Lo que tiene que salir por la consola, en orden. */
export const PET_LINES: readonly string[] = [
  `Nombre: ${PET_NAME}`,
  `Energia: ${PET_START_ENERGY}`,
  `Jugar: ${PET_END_ENERGY}`,
  `Ahora: ${PET_END_ENERGY}`,
]

export interface PetState {
  name: string | null
  energy: number | null
}

export function createPet(): PetState {
  return { name: null, energy: null }
}

/** API del nivel: la ficha del refugio recibe el nombre y la energía de la mascota. */
export function createPetApi(state: PetState): Api {
  return {
    apuntar(nombre, energia) {
      if (typeof nombre !== 'string') {
        throw new ApiError('apuntar() necesita el nombre de la mascota entre comillas')
      }
      if (typeof energia !== 'number') {
        throw new ApiError('apuntar() necesita la energía como número: pásale rex.energia')
      }

      state.name = nombre
      state.energy = energia
    },
  }
}

export function judgePet(
  state: PetState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  const announced = PET_LINES.findIndex((expected, index) => output[index] !== expected)
  if (announced !== -1) {
    return {
      complete: false,
      missing: `La línea ${announced + 1} no es la esperada: con print() tiene que salir «${PET_LINES[announced]}».`,
    }
  }

  if (output.length < PET_LINES.length) {
    return {
      complete: false,
      missing: `Faltan líneas de la ficha: la siguiente tiene que ser «${PET_LINES[output.length]}».`,
    }
  }

  if (state.name === null || state.energy === null) {
    return {
      complete: false,
      missing: 'La ficha del refugio está vacía: apunta la mascota con apuntar(rex.nombre, rex.energia).',
    }
  }

  if (state.name !== PET_NAME || state.energy !== PET_END_ENERGY) {
    return {
      complete: false,
      missing: `La ficha tiene que llevar «${PET_NAME}» con ${PET_END_ENERGY} de energía y ha llegado «${state.name}» con ${state.energy}.`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: la mascota con sus corazones de energía. */
export function petSteps(state: PetState): SceneStep[] {
  return [
    {
      kind: 'pet',
      name: state.name ?? PET_NAME,
      energy: state.energy ?? PET_START_ENERGY,
      recorded: state.name !== null,
    },
  ]
}
