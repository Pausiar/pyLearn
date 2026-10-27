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

const MESSAGE = 'Hoy riego 4 cultivos'

export const PLAYABLE_05: PlayableLevel = {
  id: 5,
  title: 'El gran día de la granja',
  concept: 'Repaso del mundo 1',
  story:
    'Último día en la granja. Primero anuncia la jornada con un solo print() que diga exactamente «Hoy riego 4 cultivos», usando una variable. Después riega los cuatro cultivos con el dron, como en el primer vuelo.',
  hint:
    'Guarda 4 en una variable y anúncialo con print("Hoy riego " + str(cultivos) + " cultivos"). Después repite avanzar() y regar() como en el primer vuelo. Consigue 3 estrellas con 10 líneas o menos.',
  starter: [
    '# El gran día empieza con un mensaje.',
    'cultivos = 4',
    '# 1. Anuncia la jornada con print().',
    '# 2. Riega los cuatro cultivos.',
  ].join('\n'),
  solution: [
    'cultivos = 4',
    'print("Hoy riego " + str(cultivos) + " cultivos")',
    'avanzar()',
    'regar()',
    'avanzar()',
    'regar()',
    'avanzar()',
    'regar()',
    'avanzar()',
    'regar()',
  ].join('\n'),
  par: 10,
  sceneTitle: 'El campo',
  success: 'Jornada completada.',
  Scene: DroneScene,
  start() {
    const field = createField()
    const actions: DroneAction[] = []

    return {
      api: createApi(field, actions),
      finish(result) {
        const watered = isComplete(field)
        const announced = result.output.length === 1 && result.output[0] === MESSAGE
        const missing = CROPS.length - wateredCount(field)

        let text = ''
        if (!watered) {
          text =
            missing === 1
              ? 'Falta 1 cultivo por regar.'
              : `Faltan ${missing} cultivos por regar.`
        } else if (!announced) {
          text = `El mensaje no es el esperado. Tiene que decir «${MESSAGE}», y solo eso.`
        }

        return { complete: watered && announced, missing: text, steps: droneSteps(actions) }
      },
    }
  },
}
