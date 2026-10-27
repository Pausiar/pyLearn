import { createBackpack, createBackpackApi, judgeBackpack } from '../engine/backpack'
import { BackpackScene } from './scenes/BackpackScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_03: PlayableLevel = {
  id: 3,
  title: 'La mochila',
  concept: 'Variables y asignación',
  story:
    'La expedición sale al amanecer. La mochila tiene que llevar 3 cuerdas y 2 cantimploras, ni más ni menos. Guarda las cantidades en variables y pásalas a mochila().',
  hint:
    'mochila() recibe dos números: cuerdas y cantimploras. Guárdalos en variables y llama a mochila(cuerdas, cantimploras). En la mochila caben 6 cosas. Consigue 3 estrellas con 4 líneas o menos.',
  starter: ['# La mochila está vacía.', '# Tiene que llevar 3 cuerdas y 2 cantimploras.'].join('\n'),
  solution: ['cuerdas = 3', 'cantimploras = 2', 'mochila(cuerdas, cantimploras)'].join('\n'),
  par: 4,
  sceneTitle: 'La mochila',
  success: 'Mochila preparada.',
  Scene: BackpackScene,
  start() {
    const state = createBackpack()

    return {
      api: createBackpackApi(state),
      finish() {
        return {
          ...judgeBackpack(state),
          steps: [
            { kind: 'backpack', ropes: state.ropes, canteens: state.canteens, placed: state.placed },
          ],
        }
      },
    }
  },
}
