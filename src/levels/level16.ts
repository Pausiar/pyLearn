import { createTrain, createTrainApi, judgeTrain, trainSteps } from '../engine/train'
import { TrainScene } from './scenes/TrainScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_16: PlayableLevel = {
  id: 16,
  title: 'El tren',
  concept: 'Listas, índices y len',
  story:
    'La estación ha cargado siete vagones y te ha dejado la lista en el editor: el último va vacío. Anuncia tres cosas con print(): cuántos vagones hay («Vagones: 7»), la carga del primero («Primero: carbón») y la del último («Último: vacío»), usando el índice 0 y el índice -1. Después carga carbón en el vagón vacío escribiendo en su posición, vagones[-1] = "carbón", y entrega el tren con enviar(vagones).',
  hint:
    'len(vagones) cuenta los vagones y vagones[0] te da el primero. El último se pide con vagones[-1], sin calcular nada. Para cambiar su carga se escribe vagones[-1] = "carbón". Consigue 3 estrellas con 7 líneas o menos.',
  starter: [
    'vagones = ["carbón", "madera", "agua", "ganado", "correo", "fruta", "vacío"]',
    '# Anuncia cuántos vagones hay, la carga del primero y la del último.',
    '# Después carga "carbón" en el vagón vacío y entrega el tren.',
  ].join('\n'),
  solution: [
    'vagones = ["carbón", "madera", "agua", "ganado", "correo", "fruta", "vacío"]',
    'print("Vagones: " + str(len(vagones)))',
    'print("Primero: " + vagones[0])',
    'print("Último: " + vagones[-1])',
    'vagones[-1] = "carbón"',
    'enviar(vagones)',
  ].join('\n'),
  par: 7,
  sceneTitle: 'La estación',
  success: 'El tren ha llegado con los siete vagones cargados.',
  Scene: TrainScene,
  start() {
    const train = createTrain()

    return {
      api: createTrainApi(train),
      finish(result) {
        return { ...judgeTrain(train, result.output), steps: trainSteps(train) }
      },
    }
  },
}
