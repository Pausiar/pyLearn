import { agendaSteps, createAgenda, createAgendaApi, judgeAgenda } from '../engine/agenda'
import { AgendaScene } from './scenes/AgendaScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_26: PlayableLevel = {
  id: 26,
  title: 'La agenda',
  concept: 'Diccionarios, claves y get',
  story:
    'La nave guarda sus puestos en un diccionario: agenda = {"mando": "puente", "ingenieria": "taller", "bodega": "deposito"}. El puente quiere tres datos. Primero, el canal del mando leído con su clave, que tiene que anunciarse como «Puesto: puente». Segundo, la cocina todavía no está apuntada, así que pregúntala con get() usando «comedor» como valor por defecto: tiene que salir «Cocina: comedor». Y tercero, apunta la cocina de verdad con agenda["cocina"] = "comedor" y comprueba que está dentro con in, que sale «En la agenda: True». Entrega la agenda completa con enviar(agenda).',
  hint:
    'Las claves se leen con corchetes: agenda["mando"]. Si la clave puede faltar, usa agenda.get("cocina", "comedor"): devuelve el valor por defecto en vez de fallar. Para añadir una clave se asigna como una variable: agenda["cocina"] = "comedor". Y "cocina" in agenda contesta True o False. Consigue 3 estrellas con 8 líneas o menos.',
  starter: [
    'agenda = {"mando": "puente", "ingenieria": "taller", "bodega": "deposito"}',
    '# Consigue el canal del mando, la cocina (que aún no está apuntada)',
    '# y si la cocina ya está en la agenda. Después entrega la agenda entera.',
  ].join('\n'),
  solution: [
    'agenda = {"mando": "puente", "ingenieria": "taller", "bodega": "deposito"}',
    'print("Puesto: " + agenda["mando"])',
    'print("Cocina: " + agenda.get("cocina", "comedor"))',
    'agenda["cocina"] = "comedor"',
    'print("En la agenda: " + str("cocina" in agenda))',
    'enviar(agenda)',
  ].join('\n'),
  par: 8,
  sceneTitle: 'La consola de la nave',
  success: 'Agenda completa y entregada en el puente.',
  Scene: AgendaScene,
  start() {
    const agenda = createAgenda()

    return {
      api: createAgendaApi(agenda),
      finish(result) {
        return { ...judgeAgenda(agenda, result.output), steps: agendaSteps(agenda) }
      },
    }
  },
}
