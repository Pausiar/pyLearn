import { mulberry32 } from '../interp/modules'
import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** La semilla del nivel: con ella las tiradas son siempre las mismas. */
export const DICE_SEED = 7
export const DICE_COUNT = 3
export const DICE_SIDES = 6

/** Las tiradas que salen con la semilla del nivel, en orden. */
export function expectedRolls(): number[] {
  const source = mulberry32(DICE_SEED)
  return Array.from({ length: DICE_COUNT }, () => 1 + Math.floor(source() * DICE_SIDES))
}

/** La media entera de las tiradas, como la calcula math.floor(). */
export function expectedAverage(rolls: readonly number[] = expectedRolls()): number {
  const total = rolls.reduce((sum, roll) => sum + roll, 0)
  return Math.floor(total / rolls.length)
}

/** Lo que tiene que salir por la consola, en orden. */
export function expectedLines(): string[] {
  const rolls = expectedRolls()
  return [`[${rolls.join(', ')}]`, `Media: ${expectedAverage(rolls)}`]
}

export interface DiceState {
  rolls: number[] | null
}

export function createDice(): DiceState {
  return { rolls: null }
}

/** API del nivel: la mesa recibe las tiradas que has anunciado. */
export function createDiceApi(state: DiceState): Api {
  return {
    mesa(tiradas) {
      if (!Array.isArray(tiradas) || tiradas.some((roll) => typeof roll !== 'number')) {
        throw new ApiError('mesa() espera la lista de tiradas, con sus números')
      }
      state.rolls = tiradas.map((roll) => Number(roll))
    },
  }
}

export function judgeDice(
  state: DiceState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  const expected = expectedLines()

  const announced = expected.findIndex((line, index) => output[index] !== line)
  if (announced !== -1) {
    return {
      complete: false,
      missing: `La línea ${announced + 1} no es la esperada: con print() tiene que salir «${expected[announced]}». Fíjate en la semilla ${DICE_SEED} y en que cada tirada va de 1 a ${DICE_SIDES}.`,
    }
  }

  if (output.length < expected.length) {
    return {
      complete: false,
      missing: `Faltan anuncios: el siguiente tiene que ser «${expected[output.length]}».`,
    }
  }

  if (state.rolls === null) {
    return { complete: false, missing: 'Las tiradas no han llegado a la mesa: entrega la lista con mesa(tiradas).' }
  }

  const wanted = expectedRolls()
  const wrong = wanted.findIndex((roll, index) => state.rolls?.[index] !== roll)
  if (wrong !== -1) {
    return {
      complete: false,
      missing: `Las tiradas tienen que salir de random.seed(${DICE_SEED}): van ${state.rolls.join(', ')} y tocan ${wanted.join(', ')}.`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: los dados que van saliendo y su media entera. */
export function diceSteps(state: DiceState): SceneStep[] {
  const rolls = state.rolls ?? []
  const steps: SceneStep[] = [{ kind: 'dice', rolls: [], average: 0, shown: false }]

  rolls.forEach((_, index) => {
    const slice = rolls.slice(0, index + 1)
    steps.push({
      kind: 'dice',
      rolls: slice,
      average: expectedAverage(slice),
      shown: index === rolls.length - 1,
    })
  })

  return steps
}
