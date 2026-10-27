import { createRoute, createRouteApi, judgeRoute, routeSteps } from '../engine/route'
import { RouteScene } from './scenes/RouteScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_17: PlayableLevel = {
  id: 17,
  title: 'El repartidor',
  concept: 'for sobre listas',
  story:
    'La ruta del día es la lista casas = ["Sara", "Leo", "Nuria", "Teo"], ya escrita en el editor, y el repartidor no acepta saltarse ninguna ni repetirla. Recórrela con un for y entrega un paquete en cada casa con entregar(nombre): cada vuelta del bucle deja un nombre distinto en la variable. Lleva la cuenta de las entregas y anúnciala al final con print(): tiene que decir «Entregas: 4».',
  hint:
    'for casa in casas: recorre la lista entera. Dentro del bucle van entregar(casa) y entregas = entregas + 1. Al salir, print("Entregas: " + str(entregas)). Consigue 3 estrellas con 7 líneas o menos.',
  starter: [
    'casas = ["Sara", "Leo", "Nuria", "Teo"]',
    'entregas = 0',
    '# Recorre la ruta, entrega un paquete en cada casa y cuenta las entregas.',
  ].join('\n'),
  solution: [
    'casas = ["Sara", "Leo", "Nuria", "Teo"]',
    'entregas = 0',
    'for casa in casas:',
    '    entregar(casa)',
    '    entregas = entregas + 1',
    'print("Entregas: " + str(entregas))',
  ].join('\n'),
  par: 7,
  sceneTitle: 'La ruta',
  success: 'Los cuatro paquetes entregados, uno por casa.',
  Scene: RouteScene,
  start() {
    const route = createRoute()

    return {
      api: createRouteApi(route),
      finish(result) {
        return { ...judgeRoute(route, result.output), steps: routeSteps(route) }
      },
    }
  },
}
