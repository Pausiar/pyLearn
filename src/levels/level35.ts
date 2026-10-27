import { createQuest, createQuestApi, judgeQuest, questSteps } from '../engine/quest'
import { QuestScene } from './scenes/QuestScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_35: PlayableLevel = {
  id: 35,
  title: 'Aventura de texto',
  concept: 'Funciones, listas, diccionarios y azar',
  story:
    'Última prueba del mundo: el mayordomo quiere jugar a tu aventura. En el editor está el mapa: salas = {"inicio": {"norte": "cueva"}, "cueva": {"sur": "inicio", "norte": "tesoro"}, "tesoro": {}}. Escribe la función ir(sala, direccion) que devuelva a dónde lleva esa dirección desde esa sala y «nada» cuando no haya salida; la ficha de cada sala es un diccionario, así que get() con valor por defecto te sirve de mucho. Después elige el objeto de la mochila con azar reproducible —random.seed(3) y random.choice(["antorcha", "llave", "mapa"])— y anúncialo como «Mochila: » seguido del objeto. Termina pasándole tu función al mayordomo con probar(ir).',
  hint:
    'ir() recibe la sala y la dirección y devuelve salas[sala].get(direccion, "nada"). El mayordomo llama a tu función cinco veces, con direcciones que llevan a alguna parte y con direcciones que no. Consigue 3 estrellas con 7 líneas o menos.',
  starter: [
    'salas = {"inicio": {"norte": "cueva"}, "cueva": {"sur": "inicio", "norte": "tesoro"}, "tesoro": {}}',
    '# Escribe ir(sala, direccion), anuncia el objeto de la mochila con la',
    '# semilla 3 y pásale la función al mayordomo con probar(ir).',
  ].join('\n'),
  solution: [
    'salas = {"inicio": {"norte": "cueva"}, "cueva": {"sur": "inicio", "norte": "tesoro"}, "tesoro": {}}',
    'def ir(sala, direccion):',
    '    return salas[sala].get(direccion, "nada")',
    'random.seed(3)',
    'print("Mochila: " + random.choice(["antorcha", "llave", "mapa"]))',
    'probar(ir)',
  ].join('\n'),
  par: 7,
  sceneTitle: 'El mapa de la aventura',
  success: 'El mayordomo ha recorrido tu aventura de texto.',
  Scene: QuestScene,
  start() {
    const quest = createQuest()

    return {
      api: createQuestApi(quest),
      finish(result) {
        return { ...judgeQuest(quest, result.output), steps: questSteps(quest) }
      },
    }
  },
}
