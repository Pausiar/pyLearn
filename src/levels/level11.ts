import {
  createIrrigation,
  createIrrigationApi,
  irrigationSteps,
  judgeIrrigation,
} from '../engine/irrigation'
import { IrrigationScene } from './scenes/IrrigationScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_11: PlayableLevel = {
  id: 11,
  title: 'Riego en bucle',
  concept: 'for y range',
  story:
    'El campo grande tiene 100 cultivos, uno por casilla a partir de la 1, y el dron espera en la casilla 0. Escribir las 200 llamadas a mano no es plan: recorre los cultivos con un for y range(100), y dentro del bucle riega cada uno con avanzar() y regar().',
  hint:
    'Escribe for i in range(100): y debajo, con sangría, avanzar() y regar(). Cada vuelta del bucle riega un cultivo. Consigue 3 estrellas con 4 líneas o menos.',
  starter: [
    '# Cien cultivos, del 1 al 100, y el dron en la casilla 0.',
    '# Recórrelos con un bucle en vez de escribirlos uno a uno.',
  ].join('\n'),
  solution: ['for i in range(100):', '    avanzar()', '    regar()'].join('\n'),
  par: 4,
  sceneTitle: 'El campo grande',
  success: 'Cien cultivos regados con un solo bucle.',
  Scene: IrrigationScene,
  start() {
    const field = createIrrigation()

    return {
      api: createIrrigationApi(field),
      finish() {
        return { ...judgeIrrigation(field), steps: irrigationSteps(field) }
      },
    }
  },
}
