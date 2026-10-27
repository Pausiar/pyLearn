import { ApiError, type Api, type Value } from '../interp/types'
import type { SceneStep } from './scene'

export const FORGE_HERO = 'Ana'
export const FORGE_START_LIFE = 3
export const FORGE_STEPS: readonly string[] = ['norte', 'sur', 'norte']
/** Con dos pasos al norte, la vida baja a 1. */
export const FORGE_END_LIFE = 1

export interface ForgeHero {
  nombre: string
  vida: number
  pasos: number
}

export interface ForgeState {
  hero: ForgeHero | null
  log: string[]
}

export function createForge(): ForgeState {
  return { hero: null, log: [] }
}

/** Lee el diccionario del héroe y avisa si le falta algo. */
function asHero(value: Value | void | null, callee: string): ForgeHero {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ApiError(`${callee}() tiene que devolver el diccionario del héroe`)
  }

  const nombre = value.nombre
  const vida = value.vida
  const pasos = value.pasos

  if (typeof nombre !== 'string' || typeof vida !== 'number' || typeof pasos !== 'number') {
    throw new ApiError(
      `Al héroe le faltan datos: el diccionario necesita "nombre" (texto), "vida" y "pasos" (números)`,
    )
  }

  return { nombre, vida, pasos }
}

/**
 * API del nivel: el motor juega al minijuego del alumno. Llama a crear() una vez
 * y a mover() en cada paso del recorrido, sin saber cómo están escritos por dentro.
 */
export function createForgeApi(state: ForgeState): Api {
  return {
    jugar(crear, mover) {
      if (typeof crear !== 'function') {
        throw new ApiError('jugar() necesita tu función crear(nombre)')
      }
      if (typeof mover !== 'function') {
        throw new ApiError('jugar() necesita tu función mover(estado, direccion)')
      }

      state.log = []
      let current: Value = crear(FORGE_HERO) ?? null
      let hero = asHero(current, 'crear')
      state.log.push(`${hero.nombre} empieza con ${hero.vida} de vida`)

      for (const direction of FORGE_STEPS) {
        const next = mover(current, direction)
        current = next === null || next === undefined ? current : next
        hero = asHero(current, 'mover')
        state.log.push(`${direction}: vida ${hero.vida}, pasos ${hero.pasos}`)
      }

      state.hero = hero
    },
  }
}

export function judgeForge(state: ForgeState): { complete: boolean; missing: string } {
  if (state.hero === null) {
    return {
      complete: false,
      missing: 'El motor todavía no ha jugado: pásale tus funciones con jugar(crear, mover).',
    }
  }

  if (state.hero.nombre !== FORGE_HERO) {
    return {
      complete: false,
      missing: `El héroe tiene que llamarse «${FORGE_HERO}» y se llama «${state.hero.nombre}».`,
    }
  }

  if (state.hero.pasos !== FORGE_STEPS.length) {
    return {
      complete: false,
      missing: `Tras ${FORGE_STEPS.length} pasos el héroe tiene que llevar ${FORGE_STEPS.length} pasos y lleva ${state.hero.pasos}: suma uno por cada llamada a mover().`,
    }
  }

  if (state.hero.vida !== FORGE_END_LIFE) {
    return {
      complete: false,
      missing: `Cada paso al norte quita una vida: después de dos nortes tiene que quedarle ${FORGE_END_LIFE} y le quedan ${state.hero.vida}.`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: el héroe del minijuego y lo que va pasando. */
export function forgeSteps(state: ForgeState): SceneStep[] {
  const steps: SceneStep[] = [{ kind: 'forge', hero: null, log: [], done: false }]

  state.log.forEach((_, index) => {
    steps.push({
      kind: 'forge',
      hero: state.hero,
      log: state.log.slice(0, index + 1),
      done: index === state.log.length - 1,
    })
  })

  return steps
}
