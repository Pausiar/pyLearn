import {
  CROPS,
  createApi,
  createField,
  droneSteps,
  isComplete,
  wateredCount,
  type DroneAction,
} from '../engine/drone'
import { DroneScene } from './scenes/DroneScene'
import type { PlayableLevel } from './types'

export const LEVEL_01 = {
  id: 1,
  title: 'Primer vuelo',
  concept: 'Instrucciones en secuencia',
  story:
    'El dron está en el hangar, en la casilla 0, y los cuatro cultivos están en las casillas 1, 2, 3 y 4. Escribe avanzar() y regar() para regar los cuatro. Python lee tus líneas en orden, de arriba abajo.',
  hint:
    'Cada avanzar() mueve el dron una casilla a la derecha. regar() riega el cultivo que tiene debajo. Avanza, riega, y repite con cada planta. Consigue 3 estrellas con 8 líneas o menos.',
  starter: [
    '# El dron empieza en el hangar (casilla 0).',
    '# Los cultivos están en las casillas 1, 2, 3 y 4.',
    'avanzar()',
    'regar()',
    '',
  ].join('\n'),
  solution: [
    'avanzar()',
    'regar()',
    'avanzar()',
    'regar()',
    'avanzar()',
    'regar()',
    'avanzar()',
    'regar()',
  ].join('\n'),
} as const

export const PLAYABLE_01: PlayableLevel = {
  ...LEVEL_01,
  par: 8,
  sceneTitle: 'El campo',
  success: 'Cultivos regados.',
  Scene: DroneScene,
  start() {
    const field = createField()
    const actions: DroneAction[] = []

    return {
      api: createApi(field, actions),
      finish() {
        const complete = isComplete(field)
        const missing = CROPS.length - wateredCount(field)
        const what =
          missing === 1
            ? 'Falta 1 cultivo por regar.'
            : `Faltan ${missing} cultivos por regar.`

        return {
          complete,
          missing: complete ? '' : `${what} Avanza hasta cada planta y riega.`,
          steps: droneSteps(actions),
        }
      },
    }
  },
}
