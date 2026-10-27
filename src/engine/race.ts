import { mulberry32 } from '../interp/modules'
import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** Los pilotos y sus tiempos, en el orden de la parrilla. */
export const RACE_DRIVERS: readonly string[] = ['Sara', 'Leo', 'Nuria', 'Teo']
export const RACE_TIMES: readonly number[] = [48, 39, 55, 42]

/** La semilla y los intentos del número secreto. */
export const RACE_SEED = 11
export const RACE_LIMIT = 10

/** El número secreto que sale con la semilla del nivel. */
export function expectedSecret(): number {
  const source = mulberry32(RACE_SEED)
  return 1 + Math.floor(source() * RACE_LIMIT)
}

/** El mejor tiempo y su piloto. */
export function best(): { time: number; pilot: string } {
  const time = Math.min(...RACE_TIMES)
  const position = RACE_TIMES.indexOf(time)
  return { time, pilot: RACE_DRIVERS[position] ?? '' }
}

/** Lo que tiene que salir por la consola, en orden. */
export function raceLines(): string[] {
  const ordered = [...RACE_TIMES].sort((left, right) => left - right)
  const winner = best()
  return [`[${ordered.join(', ')}]`, `Mejor: ${winner.time}`, `Piloto: ${winner.pilot}`, `Secreto: ${expectedSecret()}`]
}

export interface RaceState {
  pilot: string | null
  time: number | null
  secret: number | null
}

export function createRace(): RaceState {
  return { pilot: null, time: null, secret: null }
}

/** API del nivel: el podio y los intentos de adivinar el número. */
export function createRaceApi(state: RaceState): Api {
  return {
    carrera(piloto, mejor) {
      if (typeof piloto !== 'string') {
        throw new ApiError('carrera() necesita el nombre del piloto')
      }
      if (typeof mejor !== 'number') {
        throw new ApiError('carrera() necesita el mejor tiempo como número')
      }

      state.pilot = piloto
      state.time = mejor
    },
    adivinar(numero) {
      if (typeof numero !== 'number') {
        throw new ApiError('adivinar() necesita un número: pásale el secreto')
      }
      state.secret = numero
    },
  }
}

export function judgeRace(
  state: RaceState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  const expected = raceLines()
  const announced = expected.findIndex((line, index) => output[index] !== line)
  if (announced !== -1) {
    return {
      complete: false,
      missing: `La línea ${announced + 1} no es la esperada: con print() tiene que salir «${expected[announced]}».`,
    }
  }

  if (output.length < expected.length) {
    return {
      complete: false,
      missing: `Faltan líneas de la carrera: la siguiente tiene que ser «${expected[output.length]}».`,
    }
  }

  const winner = best()
  if (state.pilot !== winner.pilot || state.time !== winner.time) {
    return {
      complete: false,
      missing: `El podio tiene que ser «${winner.pilot}» con ${winner.time} y ha llegado «${state.pilot}» con ${state.time}.`,
    }
  }

  if (state.secret !== expectedSecret()) {
    return {
      complete: false,
      missing: `El número secreto sale de random.seed(${RACE_SEED}): tiene que ser ${expectedSecret()}.`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: las vueltas ordenadas, el podio y el número secreto. */
export function raceSteps(state: RaceState): SceneStep[] {
  const ordered = state.time === null ? null : [...RACE_TIMES].sort((left, right) => left - right)

  return [
    {
      kind: 'race',
      times: [...RACE_TIMES],
      order: ordered,
      pilot: state.pilot,
      secret: state.secret,
    },
  ]
}
