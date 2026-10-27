import { createGate, createGateApi, judgeGate } from '../engine/gate'
import { GateScene } from './scenes/GateScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_10: PlayableLevel = {
  id: 10,
  title: 'El guardián',
  concept: 'elif y condiciones anidadas',
  story:
    'El guardián del castillo recibe a tres visitantes con pase A, B y C. Pregunta el pase con pase() y decide: con A, puerta_grande(); con B, puerta_pequena(); con cualquier otro, denegar(). Tu programa se probará con los tres pases.',
  hint:
    'Empieza con if para el pase A, sigue con elif para el B y cierra con else para el que no entra. Consigue 3 estrellas con 7 líneas o menos.',
  starter: [
    '# Tres visitantes: pases A, B y C.',
    '# El pase de cada uno se consulta con pase().',
  ].join('\n'),
  solution: [
    'entrada = pase()',
    'if entrada == "A":',
    '    puerta_grande()',
    'elif entrada == "B":',
    '    puerta_pequena()',
    'else:',
    '    denegar()',
  ].join('\n'),
  par: 7,
  sceneTitle: 'La puerta del castillo',
  success: 'El guardián ha atendido a los tres pases.',
  Scene: GateScene,
  start() {
    const gate = createGate('A')

    return {
      api: createGateApi(gate),
      finish(_result, code) {
        return judgeGate(gate, code)
      },
    }
  },
}
