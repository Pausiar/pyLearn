import { judgePlague, plagueSteps } from '../engine/plague'
import { PlagueScene } from './scenes/PlagueScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_34: PlayableLevel = {
  id: 34,
  title: 'Cazabichos',
  concept: 'Depuración y lectura de errores',
  story:
    'El informe de la plaga no cuadra. El programa del editor debería anunciar tres líneas —«Zonas: 4», «Bichos: 8» y «Plaga: activa»— pero tiene tres fallos escondidos: uno en el recuento de zonas, otro en el bucle que cuenta los bichos y otro en la comparación final. Ejecútalo para ver qué sale por la consola, compara con lo que tiene que salir y caza los tres. No hay que reescribirlo todo: tres detalles bastan.',
  hint:
    'Compara lo que sale con lo que tiene que salir. Si una línea enseña la lista entera en lugar de un número, falta len(). Si el recuento de bichos se queda corto, mira por dónde va el bucle. Y si el estado de la plaga sale al revés, revisa el número con el que se compara. Consigue 3 estrellas con 11 líneas o menos.',
  starter: [
    'zonas = ["almacén", "cocina", "pasillo", "azotea"]',
    'bichos = 0',
    'for i in range(3):',
    '    bichos = bichos + 2',
    'print("Zonas: " + str(zonas))',
    'print("Bichos: " + str(bichos))',
    'if bichos > 10:',
    '    print("Plaga: activa")',
    'else:',
    '    print("Plaga: controlada")',
  ].join('\n'),
  solution: [
    'zonas = ["almacén", "cocina", "pasillo", "azotea"]',
    'bichos = 0',
    'for i in range(len(zonas)):',
    '    bichos = bichos + 2',
    'print("Zonas: " + str(len(zonas)))',
    'print("Bichos: " + str(bichos))',
    'if bichos > 6:',
    '    print("Plaga: activa")',
    'else:',
    '    print("Plaga: controlada")',
  ].join('\n'),
  par: 11,
  sceneTitle: 'El informe de la plaga',
  success: 'Los tres bichos del código, cazados.',
  Scene: PlagueScene,
  start() {
    return {
      api: {},
      finish(result) {
        return { ...judgePlague(result.output), steps: plagueSteps(result.output) }
      },
    }
  },
}
