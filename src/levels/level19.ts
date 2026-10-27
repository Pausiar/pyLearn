import { createConvoy, createConvoyApi, convoySteps, judgeConvoy } from '../engine/convoy'
import { ConvoyScene } from './scenes/ConvoyScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_19: PlayableLevel = {
  id: 19,
  title: 'Rebanadas',
  concept: 'Slicing y el operador in',
  story:
    'El tren largo tiene nueve vagones, con la locomotora delante y el furgón detrás, y está en el editor. Forma un convoy con los cuatro vagones de carga del medio cortándolos con una rebanada, convoy = tren[1:5], y entrégalo con formar(convoy). Después anuncia tres comprobaciones con print(): «Convoy: 4» con len(convoy), «Furgón: False» porque el furgón se queda fuera, y «Cemento: True» porque el cemento sí viaja en el tren entero. Las dos últimas se preguntan con el operador in: "furgón" in convoy.',
  hint:
    'Una rebanada es tren[1:5]: desde la posición 1 hasta la 5, sin incluirla. Con "furgón" in convoy preguntas si algo está dentro y te contesta True o False, que pasa a texto con str(). Consigue 3 estrellas con 7 líneas o menos.',
  starter: [
    'tren = ["locomotora", "carbón", "madera", "agua", "ganado", "correo", "fruta", "cemento", "furgón"]',
    '# Corta los cuatro vagones de carga del medio y forma el convoy.',
    '# Después comprueba si el furgón y el cemento están dentro.',
  ].join('\n'),
  solution: [
    'tren = ["locomotora", "carbón", "madera", "agua", "ganado", "correo", "fruta", "cemento", "furgón"]',
    'convoy = tren[1:5]',
    'formar(convoy)',
    'print("Convoy: " + str(len(convoy)))',
    'print("Furgón: " + str("furgón" in convoy))',
    'print("Cemento: " + str("cemento" in tren))',
  ].join('\n'),
  par: 7,
  sceneTitle: 'El tren largo',
  success: 'Convoy formado con la rebanada justa.',
  Scene: ConvoyScene,
  start() {
    const convoy = createConvoy()

    return {
      api: createConvoyApi(convoy),
      finish(result) {
        return { ...judgeConvoy(convoy, result.output), steps: convoySteps(convoy) }
      },
    }
  },
}
