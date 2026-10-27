import { mulberry32 } from '../interp/modules'
import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** El recorrido que prueba el mayordomo: sala, dirección y respuesta esperada. */
export const QUEST_WALKS: readonly (readonly [string, string, string])[] = [
  ['inicio', 'norte', 'cueva'],
  ['cueva', 'norte', 'tesoro'],
  ['cueva', 'sur', 'inicio'],
  ['tesoro', 'norte', 'nada'],
  ['inicio', 'sur', 'nada'],
]

/** La semilla del nivel y los objetos de la mochila. */
export const QUEST_SEED = 3
export const QUEST_ITEMS: readonly string[] = ['antorcha', 'llave', 'mapa']

/** El objeto que sale con la semilla del nivel. */
export function expectedItem(): string {
  const source = mulberry32(QUEST_SEED)
  return QUEST_ITEMS[Math.floor(source() * QUEST_ITEMS.length)]!
}

/** La línea que tiene que anunciar el inventario. */
export function expectedLine(): string {
  return `Mochila: ${expectedItem()}`
}

export interface QuestState {
  walks: { room: string; direction: string; answer: string }[] | null
}

export function createQuest(): QuestState {
  return { walks: null }
}

/**
 * API del nivel: el mayordomo recorre el mapa llamando a la función `ir()` del
 * alumno, con un par de sala y dirección en cada paso.
 */
export function createQuestApi(state: QuestState): Api {
  return {
    probar(ir) {
      if (typeof ir !== 'function') {
        throw new ApiError('probar() necesita tu función ir(sala, direccion)')
      }

      state.walks = QUEST_WALKS.map(([room, direction]) => {
        const answer = ir(room, direction)
        return {
          room,
          direction,
          answer: answer === null || answer === undefined ? 'None' : String(answer),
        }
      })
    },
  }
}

export function judgeQuest(
  state: QuestState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  const line = expectedLine()
  if (output[0] !== line) {
    const shown = output[0] === undefined ? 'nada' : `«${output[0]}»`
    return {
      complete: false,
      missing: `La primera línea dice ${shown} y tiene que decir «${line}»: usa random.seed(${QUEST_SEED}) antes de elegir el objeto.`,
    }
  }

  if (state.walks === null) {
    return {
      complete: false,
      missing: 'El mayordomo no ha salido: pásale tu función con probar(ir).',
    }
  }

  const wrong = QUEST_WALKS.findIndex(([, , expected], index) => state.walks?.[index]?.answer !== expected)
  if (wrong !== -1) {
    const [room, direction, expected] = QUEST_WALKS[wrong]!
    return {
      complete: false,
      missing: `Desde ${room} hacia el ${direction} hay que llegar a «${expected}» y se ha llegado a «${state.walks[wrong]?.answer}».`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: el mayordomo recorriendo las salas del mapa. */
export function questSteps(state: QuestState): SceneStep[] {
  const steps: SceneStep[] = [{ kind: 'quest', room: 'inicio', visited: [], item: null, done: false }]
  const walks = state.walks
  if (walks === null) return steps

  walks.forEach((walk, index) => {
    const visited = walks.slice(0, index + 1).map((entry) => entry.answer)
    steps.push({
      kind: 'quest',
      room: walk.answer,
      visited,
      item: expectedItem(),
      done: index === walks.length - 1,
    })
  })

  return steps
}
