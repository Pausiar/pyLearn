import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** Los planetas del censo con sus habitantes, tal y como empieza. */
export const CENSUS_START: readonly (readonly [string, number])[] = [
  ['marte', 12],
  ['venus', 8],
  ['luna', 5],
]

/** Lo que tiene que salir por la consola, en orden. */
export const CENSUS_LINES: readonly string[] = [
  'Planetas: 3',
  'Habitantes: 25',
  'marte: 12',
  'venus: 8',
  'luna: 5',
]

export interface CensusState {
  planets: { name: string; people: number }[] | null
}

export function createCensus(): CensusState {
  return { planets: null }
}

/** API del nivel: el censo vuelve a la oficina como un diccionario. */
export function createCensusApi(state: CensusState): Api {
  return {
    cerrar(censo) {
      if (typeof censo !== 'object' || censo === null || Array.isArray(censo)) {
        throw new ApiError('cerrar() espera el censo entero: un diccionario de planetas y habitantes')
      }

      state.planets = Object.entries(censo).map(([name, people]) => ({
        name,
        people: typeof people === 'number' ? people : Number(people),
      }))
    },
  }
}

export function judgeCensus(
  state: CensusState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  const announced = CENSUS_LINES.findIndex((expected, index) => output[index] !== expected)
  if (announced !== -1) {
    return {
      complete: false,
      missing: `La línea ${announced + 1} no es la esperada: con print() tiene que salir «${CENSUS_LINES[announced]}».`,
    }
  }

  if (output.length < CENSUS_LINES.length) {
    return {
      complete: false,
      missing: `Faltan datos del censo: el siguiente tiene que ser «${CENSUS_LINES[output.length]}».`,
    }
  }

  if (state.planets === null) {
    return { complete: false, missing: 'El censo no ha vuelto: entrégalo con cerrar(censo).' }
  }

  if (state.planets.length !== CENSUS_START.length) {
    return {
      complete: false,
      missing: `El censo tiene que llevar ${CENSUS_START.length} planetas y ha llegado con ${state.planets.length}.`,
    }
  }

  for (let index = 0; index < CENSUS_START.length; index += 1) {
    const [name, people] = CENSUS_START[index]!
    const planet = state.planets[index]
    if (planet?.name !== name || planet.people !== people) {
      return {
        complete: false,
        missing: `El censo tiene que llevar «${name}» con ${people} habitantes en la posición ${index + 1}.`,
      }
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: el censo sumando habitantes, un planeta por fotograma. */
export function censusSteps(state: CensusState): SceneStep[] {
  const start = CENSUS_START.map(([name, people]) => ({ name, people }))
  const steps: SceneStep[] = [{ kind: 'census', planets: start, total: 0, listed: false }]
  if (state.planets === null) return steps

  let partial = 0
  for (const planet of state.planets) {
    partial += planet.people
    steps.push({ kind: 'census', planets: state.planets, total: partial, listed: true })
  }

  return steps
}
