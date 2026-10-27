import { createSign, createSignApi, judgeSign } from '../engine/signs'
import { SignsScene } from './scenes/SignsScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_04: PlayableLevel = {
  id: 4,
  title: 'Letreros de neón',
  concept: 'Concatenación y str()',
  story:
    'La ciudad estrena un letrero de neón. Tiene que decir exactamente ABIERTO NEÓN 24H. El nombre de la ciudad y la hora están en variables: únelos con + y convierte el número con str().',
  hint:
    'letrero() recibe un texto. Une las partes con +, sin olvidar los espacios, y usa str(hora) para pegar el número. Debe quedar exactamente: ABIERTO NEÓN 24H. Consigue 3 estrellas con 5 líneas o menos.',
  starter: [
    '# El letrero está apagado.',
    'ciudad = "NEÓN"',
    'hora = 24',
    '# Construye el texto exacto con letrero().',
  ].join('\n'),
  solution: [
    'ciudad = "NEÓN"',
    'hora = 24',
    'letrero("ABIERTO " + ciudad + " " + str(hora) + "H")',
  ].join('\n'),
  par: 5,
  sceneTitle: 'La ciudad',
  success: 'Letrero encendido.',
  Scene: SignsScene,
  start() {
    const state = createSign()

    return {
      api: createSignApi(state),
      finish() {
        return {
          ...judgeSign(state),
          steps: [{ kind: 'sign', text: state.text, lit: state.lit }],
        }
      },
    }
  },
}
