import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

export const BEAST_NAME = 'Smaug'
export const BEAST_LIFE = 5
/** La vida que le queda después de un golpe. */
export const BEAST_HIT = 4
export const BEAST_ROAR = '¡GRRR!'

/** Lo que tiene que salir por la consola, en orden. */
export const BEAST_LINES: readonly string[] = [
  `${BEAST_NAME} con ${BEAST_LIFE}`,
  `Rugido: ${BEAST_ROAR}`,
  `Golpe: ${BEAST_HIT}`,
]

export interface BeastState {
  name: string | null
  life: number | null
}

export function createBeast(): BeastState {
  return { name: null, life: null }
}

/** API del nivel: el bestiario apunta el nombre del monstruo y su vida. */
export function createBeastApi(state: BeastState): Api {
  return {
    combate(nombre, vida) {
      if (typeof nombre !== 'string') {
        throw new ApiError('combate() necesita el nombre del monstruo entre comillas')
      }
      if (typeof vida !== 'number') {
        throw new ApiError('combate() necesita la vida como número: pásale smaug.vida')
      }

      state.name = nombre
      state.life = vida
    },
  }
}

export function judgeBeast(
  state: BeastState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  const announced = BEAST_LINES.findIndex((expected, index) => output[index] !== expected)
  if (announced !== -1) {
    return {
      complete: false,
      missing: `La línea ${announced + 1} no es la esperada: con print() tiene que salir «${BEAST_LINES[announced]}».`,
    }
  }

  if (output.length < BEAST_LINES.length) {
    return {
      complete: false,
      missing: `Faltan líneas del bestiario: la siguiente tiene que ser «${BEAST_LINES[output.length]}».`,
    }
  }

  if (state.name === null || state.life === null) {
    return {
      complete: false,
      missing: 'El bestiario está sin apuntar: entrégalo con combate(smaug.nombre, smaug.vida).',
    }
  }

  if (state.name !== BEAST_NAME || state.life !== BEAST_HIT) {
    return {
      complete: false,
      missing: `El dragón tiene que ser «${BEAST_NAME}» con ${BEAST_HIT} de vida después del golpe y ha llegado «${state.name}» con ${state.life}.`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: el dragón con su vida y su rugido. */
export function beastSteps(state: BeastState): SceneStep[] {
  return [
    {
      kind: 'beast',
      name: state.name ?? BEAST_NAME,
      life: state.life ?? BEAST_LIFE,
      born: state.name !== null,
    },
  ]
}
