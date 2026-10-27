import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** Los puentes de la ruta, en orden. */
export const BRIDGES: readonly string[] = ['norte', 'sur', 'este']

/** El puente que está cortado y obliga a desviarse. */
export const BROKEN_BRIDGE = 'sur'

/** Los que sí aguantan. */
export const SOUND_BRIDGES: readonly string[] = BRIDGES.filter((bridge) => bridge !== BROKEN_BRIDGE)

/** Lo que tiene que salir por la consola, en orden. */
export const BRIDGE_LINES: readonly string[] = ['Cruzado: norte', 'Desvío: sur', 'Cruzado: este']

export interface BridgeEvent {
  puente: string
  action: 'cruzado' | 'desvio' | 'cortado'
}

export interface BridgeState {
  log: BridgeEvent[]
}

export function createBridge(): BridgeState {
  return { log: [] }
}

function known(bridge: string): void {
  if (!BRIDGES.includes(bridge)) {
    throw new ApiError(`${bridge} no está en la ruta: los puentes son ${BRIDGES.join(', ')}`)
  }
}

/**
 * API del nivel: cruzar() lanza un ValueError cuando el puente está cortado, así
 * que la caravana tiene que aprender a reaccionar con try y except.
 */
export function createBridgeApi(state: BridgeState): Api {
  return {
    cruzar(puente) {
      const name = String(puente)
      known(name)

      if (name === BROKEN_BRIDGE) {
        state.log.push({ puente: name, action: 'cortado' })
        throw new ApiError(`El puente ${name} está cortado`, 'ValueError')
      }

      if (state.log.some((event) => event.puente === name && event.action === 'cruzado')) {
        throw new ApiError(`La caravana ya ha cruzado el puente ${name}`)
      }

      state.log.push({ puente: name, action: 'cruzado' })
    },
    desvio(puente) {
      const name = String(puente)
      known(name)

      if (state.log.some((event) => event.puente === name && event.action === 'desvio')) {
        throw new ApiError(`El puente ${name} ya tiene su desvío`)
      }

      state.log.push({ puente: name, action: 'desvio' })
    },
  }
}

export function judgeBridge(
  state: BridgeState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  const announced = BRIDGE_LINES.findIndex((expected, index) => output[index] !== expected)
  if (announced !== -1) {
    return {
      complete: false,
      missing: `La línea ${announced + 1} no es la esperada: con print() tiene que salir «${BRIDGE_LINES[announced]}».`,
    }
  }

  if (output.length < BRIDGE_LINES.length) {
    return {
      complete: false,
      missing: `Faltan líneas del viaje: la siguiente tiene que ser «${BRIDGE_LINES[output.length]}».`,
    }
  }

  const crossed = state.log
    .filter((event) => event.action === 'cruzado')
    .map((event) => event.puente)
  if (crossed.join('|') !== SOUND_BRIDGES.join('|')) {
    return {
      complete: false,
      missing: `La caravana tiene que cruzar los puentes que aguantan (${SOUND_BRIDGES.join(', ')}) y ha cruzado ${crossed.length === 0 ? 'ninguno' : crossed.join(', ')}.`,
    }
  }

  const detours = state.log.filter((event) => event.action === 'desvio')
  if (detours.length !== 1 || detours[0]?.puente !== BROKEN_BRIDGE) {
    return {
      complete: false,
      missing: `El único desvío es el del puente ${BROKEN_BRIDGE}, y ha habido ${detours.length}.`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: la caravana cruzando, desviándose o topándose con el puente roto. */
export function bridgeSteps(state: BridgeState): SceneStep[] {
  const steps: SceneStep[] = [{ kind: 'bridge', actions: [] }]

  state.log.forEach((_, index) => {
    steps.push({
      kind: 'bridge',
      actions: state.log.slice(0, index + 1).map((event) => ({ ...event })),
    })
  })

  return steps
}
