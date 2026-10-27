import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** La ruta del día, en orden. */
export const ROUTE_HOUSES: readonly string[] = ['Sara', 'Leo', 'Nuria', 'Teo']

/** Lo que anuncia el repartidor al terminar. */
export const ROUTE_MESSAGE = `Entregas: ${ROUTE_HOUSES.length}`

export interface RouteState {
  delivered: string[]
}

export function createRoute(): RouteState {
  return { delivered: [] }
}

/** API del nivel: cada casa recibe su paquete una sola vez y en orden. */
export function createRouteApi(state: RouteState): Api {
  return {
    entregar(casa) {
      if (typeof casa !== 'string') {
        throw new ApiError('entregar() necesita el nombre de la casa, entre comillas')
      }

      const expected = ROUTE_HOUSES[state.delivered.length]
      if (casa === expected) {
        state.delivered.push(casa)
        return
      }

      if (ROUTE_HOUSES.includes(casa)) {
        if (state.delivered.includes(casa)) {
          throw new ApiError(`${casa} ya tiene su paquete: cada casa recibe uno solo`)
        }
        throw new ApiError(`La ruta va en orden: ahora toca ${expected}`)
      }

      throw new ApiError(`${casa} no está en la ruta: las casas son ${ROUTE_HOUSES.join(', ')}`)
    },
  }
}

export function judgeRoute(
  state: RouteState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  const left = ROUTE_HOUSES.length - state.delivered.length
  if (left > 0) {
    return {
      complete: false,
      missing: `Van ${state.delivered.length} de ${ROUTE_HOUSES.length} entregas: recorre la ruta con un for y llama a entregar(casa) en cada casa.`,
    }
  }

  const message = output.at(-1) ?? ''
  if (message !== ROUTE_MESSAGE) {
    return {
      complete: false,
      missing: `El repartidor dice «${message === '' ? 'nada' : message}»; tiene que decir «${ROUTE_MESSAGE}».`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: una casa más con su paquete en cada fotograma. */
export function routeSteps(state: RouteState): SceneStep[] {
  if (state.delivered.length === 0) return [{ kind: 'route', delivered: [] }]

  return state.delivered.map((_, index) => ({
    kind: 'route' as const,
    delivered: state.delivered.slice(0, index + 1),
  }))
}
