import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** Los puestos de la nave con su canal, tal y como empieza la agenda. */
export const AGENDA_START: readonly (readonly [string, string])[] = [
  ['mando', 'puente'],
  ['ingenieria', 'taller'],
  ['bodega', 'deposito'],
]

/** La agenda completa que tiene que llegar al puente. */
export const AGENDA_EXPECTED: readonly (readonly [string, string])[] = [
  ['mando', 'puente'],
  ['ingenieria', 'taller'],
  ['bodega', 'deposito'],
  ['cocina', 'comedor'],
]

/** Lo que tiene que salir por la consola, en orden. */
export const AGENDA_LINES: readonly string[] = [
  'Puesto: puente',
  'Cocina: comedor',
  'En la agenda: True',
]

export interface AgendaState {
  /** La agenda entregada, si ya ha llegado al puente. */
  contacts: { name: string; channel: string }[] | null
}

export function createAgenda(): AgendaState {
  return { contacts: null }
}

/** API del nivel: la nave recibe la agenda entera como un diccionario. */
export function createAgendaApi(state: AgendaState): Api {
  return {
    enviar(agenda) {
      if (typeof agenda !== 'object' || agenda === null || Array.isArray(agenda)) {
        throw new ApiError('enviar() espera la agenda entera: un diccionario de puestos y canales')
      }

      state.contacts = Object.entries(agenda).map(([name, channel]) => ({
        name,
        channel: String(channel),
      }))
    },
  }
}

export function judgeAgenda(
  state: AgendaState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  const announced = AGENDA_LINES.findIndex((expected, index) => output[index] !== expected)
  if (announced !== -1) {
    return {
      complete: false,
      missing: `El anuncio ${announced + 1} no es el esperado: con print() tiene que salir «${AGENDA_LINES[announced]}».`,
    }
  }

  if (output.length < AGENDA_LINES.length) {
    return {
      complete: false,
      missing: `Faltan anuncios: el siguiente tiene que ser «${AGENDA_LINES[output.length]}».`,
    }
  }

  if (state.contacts === null) {
    return {
      complete: false,
      missing: 'La agenda no ha llegado al puente: entrégala con enviar(agenda).',
    }
  }

  if (state.contacts.length !== AGENDA_EXPECTED.length) {
    return {
      complete: false,
      missing: `La agenda tiene que llegar con ${AGENDA_EXPECTED.length} puestos y ha llegado con ${state.contacts.length}: falta el de la cocina.`,
    }
  }

  for (let index = 0; index < AGENDA_EXPECTED.length; index += 1) {
    const [name, channel] = AGENDA_EXPECTED[index]!
    const entry = state.contacts[index]
    if (entry?.name !== name || entry.channel !== channel) {
      return {
        complete: false,
        missing: `La agenda tiene que llevar «${name}» con el canal «${channel}» en la posición ${index + 1}.`,
      }
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: la agenda con sus contactos y si ya ha llegado al puente. */
export function agendaSteps(state: AgendaState): SceneStep[] {
  const contacts = state.contacts ?? AGENDA_START.map(([name, channel]) => ({ name, channel }))

  return [{ kind: 'agenda', contacts, sent: state.contacts !== null }]
}
