import { BRIDGE_LINES, bridgeSteps, createBridge, createBridgeApi, judgeBridge } from '../engine/bridge'
import { BridgeScene } from './scenes/BridgeScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_31: PlayableLevel = {
  id: 31,
  title: 'El puente',
  concept: 'try, except y sus errores',
  story:
    'La caravana tiene que cruzar los tres puentes de la ruta: puentes = ["norte", "sur", "este"]. El puente sur está cortado y cruzar() lanza un ValueError cuando lo intentas; los otros dos aguantan. Recorre la lista con un for y envuelve cada cruce en un try. Si el cruce sale bien, anuncia «Cruzado: norte» y sigue; y si salta el ValueError, manda la caravana por el desvío con desvio(puente) y anuncia «Desvío: sur». Al final tienen que salir las tres líneas: «Cruzado: norte», «Desvío: sur» y «Cruzado: este».',
  hint:
    'El try envuelve lo que puede fallar y el except recoge el error cuando pasa: try: / cruzar(puente) / print("Cruzado: " + puente) y debajo except ValueError: / desvio(puente) / print("Desvío: " + puente). Todo con la misma sangría, dentro del for. Consigue 3 estrellas con 9 líneas o menos.',
  starter: [
    'puentes = ["norte", "sur", "este"]',
    '# Cruza cada puente dentro de un try y, cuando salte el ValueError,',
    '# manda la caravana por el desvío. Anuncia cada paso con print().',
  ].join('\n'),
  solution: [
    'puentes = ["norte", "sur", "este"]',
    'for puente in puentes:',
    '    try:',
    '        cruzar(puente)',
    '        print("Cruzado: " + puente)',
    '    except ValueError:',
    '        desvio(puente)',
    '        print("Desvío: " + puente)',
  ].join('\n'),
  par: 9,
  sceneTitle: 'El puente de la caravana',
  success: `La caravana ha cruzado sin romper nada: ${BRIDGE_LINES.length} pasos.`,
  Scene: BridgeScene,
  start() {
    const bridge = createBridge()

    return {
      api: createBridgeApi(bridge),
      finish(result) {
        return { ...judgeBridge(bridge, result.output), steps: bridgeSteps(bridge) }
      },
    }
  },
}
