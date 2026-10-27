import { judgeLighthouse, lighthouseSteps } from '../engine/lighthouse'
import { LighthouseScene } from './scenes/LighthouseScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_02: PlayableLevel = {
  id: 2,
  title: 'Mensaje en botella',
  concept: 'print() y cadenas',
  story:
    'La tormenta ha dejado al farero sin voz. El faro tiene que enviar tres mensajes, uno por línea y en este orden: SOS, PYLEARN y AYUDA. Cada mensaje se envía con print().',
  hint:
    'Cada print() escribe una línea. Prueba print("SOS") y, debajo, las otras dos llamadas con PYLEARN y AYUDA. Consigue 3 estrellas con 4 líneas o menos.',
  starter: ['# El faro está apagado.', '# Envía los tres mensajes, uno por línea.'].join('\n'),
  solution: ['print("SOS")', 'print("PYLEARN")', 'print("AYUDA")'].join('\n'),
  par: 4,
  sceneTitle: 'El faro',
  success: 'Mensajes enviados.',
  Scene: LighthouseScene,
  start() {
    return {
      api: {},
      finish(result) {
        return {
          ...judgeLighthouse(result.output),
          steps: lighthouseSteps(result.output),
        }
      },
    }
  },
}
