import { judgeLighthouse, lighthouseSteps } from '../engine/lighthouse'
import { LighthouseScene } from './scenes/LighthouseScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_02: PlayableLevel = {
  id: 2,
  title: 'Mensaje en botella',
  concept: 'print() y cadenas',
  story:
    'Una tormenta ha roto la radio del faro, pero la lámpara sigue funcionando. Envía tres mensajes con print(), uno por línea y en este orden: SOS, PYLEARN y AYUDA. Cada mensaje hace un pulso de radar. Los rescatadores solo leen texto exacto.',
  hint:
    'Las comillas convierten el texto en una cadena: print("SOS") imprime SOS, pero print(SOS) busca una variable que no existe. Escribe las tres líneas con las mayúsculas exactas. Consigue 3 estrellas con 3 líneas.',
  starter: [
    '# La radio está rota, pero la lámpara funciona.',
    '# Envía los tres mensajes con print().',
    '# Recuerda: el texto va entre comillas.',
  ].join('\n'),
  solution: ['print("SOS")', 'print("PYLEARN")', 'print("AYUDA")'].join('\n'),
  par: 3,
  sceneTitle: 'El faro',
  success: 'Mensajes enviados. ¡Vienen a rescatarte!',
  Scene: LighthouseScene,
  start() {
    return {
      api: {},
      finish(result) {
        const verdict = judgeLighthouse(result.output)
        return {
          ...verdict,
          steps: lighthouseSteps(result.output, verdict.complete),
        }
      },
    }
  },
}
