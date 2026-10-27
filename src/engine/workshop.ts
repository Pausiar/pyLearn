import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

export const WORKSHOP_NAME = 'Bruno'
export const WORKSHOP_PIECES: readonly string[] = ['rueda', 'antena']

/** Lo que tiene que salir por la consola, en orden. */
export const WORKSHOP_LINES: readonly string[] = [`${WORKSHOP_NAME} con 2 piezas`]

export interface WorkshopState {
  name: string | null
  pieces: string[] | null
  ready: boolean | null
}

export function createWorkshop(): WorkshopState {
  return { name: null, pieces: null, ready: null }
}

/** API del nivel: la ficha del taller y el parte de robot terminado. */
export function createWorkshopApi(state: WorkshopState): Api {
  return {
    revisar(nombre, piezas) {
      if (typeof nombre !== 'string') {
        throw new ApiError('revisar() necesita el nombre del robot')
      }
      if (!Array.isArray(piezas)) {
        throw new ApiError('revisar() necesita la lista de piezas: pásale bruno.piezas')
      }

      state.name = nombre
      state.pieces = piezas.map((piece) => String(piece))
    },
    entregar(listo) {
      if (typeof listo !== 'boolean') {
        throw new ApiError('entregar() espera True o False: pásale bruno.listo()')
      }
      state.ready = listo
    },
  }
}

export function judgeWorkshop(
  state: WorkshopState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  const announced = WORKSHOP_LINES.findIndex((expected, index) => output[index] !== expected)
  if (announced !== -1) {
    return {
      complete: false,
      missing: `El anuncio ${announced + 1} no es el esperado: con print() tiene que salir «${WORKSHOP_LINES[announced]}».`,
    }
  }

  if (output.length < WORKSHOP_LINES.length) {
    return {
      complete: false,
      missing: `Falta el anuncio del taller: tiene que salir «${WORKSHOP_LINES[0]}».`,
    }
  }

  if (state.pieces === null) {
    return {
      complete: false,
      missing: 'El taller no tiene la ficha del robot: entrégala con revisar(bruno.nombre, bruno.piezas).',
    }
  }

  if (state.pieces.join('|') !== WORKSHOP_PIECES.join('|')) {
    return {
      complete: false,
      missing: `El robot tiene que llevar las piezas ${WORKSHOP_PIECES.join(' y ')} y ha llegado con ${state.pieces.length === 0 ? 'ninguna' : state.pieces.join(' y ')}.`,
    }
  }

  if (state.ready !== true) {
    return {
      complete: false,
      missing: 'El robot está montado con sus dos piezas: listo() tiene que devolver True.',
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: el robot con las piezas que lleva montadas. */
export function workshopSteps(state: WorkshopState): SceneStep[] {
  const steps: SceneStep[] = [{ kind: 'workshop', name: WORKSHOP_NAME, pieces: [], ready: null }]
  const pieces = state.pieces ?? []

  pieces.forEach((_, index) => {
    steps.push({
      kind: 'workshop',
      name: state.name ?? WORKSHOP_NAME,
      pieces: pieces.slice(0, index + 1),
      ready: index === pieces.length - 1 ? state.ready : null,
    })
  })

  return steps
}
