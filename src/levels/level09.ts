import { createCrossing, createCrossingApi, judgeCrossing } from '../engine/crossing'
import { CrossingScene } from './scenes/CrossingScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_09: PlayableLevel = {
  id: 9,
  title: 'El semáforo',
  concept: 'if y else',
  story:
    'El peatón solo cruza con la luz en verde. Consulta la luz con luz() y decide: si está en verde, cruzar(); si no, esperar(). Tu programa se probará dos veces, con la luz roja y con la luz verde, y tiene que salir bien en las dos.',
  hint:
    'luz() devuelve «rojo» o «verde». Compara con == dentro de un if para el verde y pon un else con esperar(). Consigue 3 estrellas con 5 líneas o menos.',
  starter: [
    '# La luz se consulta con luz().',
    '# Se probará con la luz roja y con la verde.',
  ].join('\n'),
  solution: [
    'if luz() == "verde":',
    '    cruzar()',
    'else:',
    '    esperar()',
  ].join('\n'),
  par: 5,
  sceneTitle: 'El paso de peatones',
  success: 'El peatón ha decidido bien en las dos luces.',
  Scene: CrossingScene,
  start() {
    const crossing = createCrossing('rojo')

    return {
      api: createCrossingApi(crossing),
      finish(_result, code) {
        return judgeCrossing(crossing, code)
      },
    }
  },
}
