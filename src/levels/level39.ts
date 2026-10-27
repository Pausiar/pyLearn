import { createRace, createRaceApi, judgeRace, raceSteps } from '../engine/race'
import { RaceScene } from './scenes/RaceScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_39: PlayableLevel = {
  id: 39,
  title: 'La carrera',
  concept: 'Ordenar y buscar',
  story:
    'La carrera tiene cuatro pilotos con sus tiempos: pilotos = ["Sara", "Leo", "Nuria", "Teo"] y tiempos = [48, 39, 55, 42]. Ordena los tiempos con sorted() —sin tocar la lista original— y anuncia la lista ordenada. El mejor tiempo es ordenados[0]: anúncialo como «Mejor: 39» y, para saber quién ha ganado, busca ese tiempo en la lista original con tiempos.index(mejor) y saca el piloto de esa posición: «Piloto: Leo». Después elige el número secreto con random.seed(11) y random.randint(1, 10), anúncialo como «Secreto: » más el número, entrega el podio con carrera(pilotos[ganador], mejor) y el número con adivinar(secreto).',
  hint:
    'sorted(tiempos) devuelve una lista nueva en orden, del menor al mayor. tiempos.index(39) dice en qué posición está ese tiempo, y esa misma posición es la del piloto ganador. Consigue 3 estrellas con 13 líneas o menos.',
  starter: [
    'pilotos = ["Sara", "Leo", "Nuria", "Teo"]',
    'tiempos = [48, 39, 55, 42]',
    '# Anuncia los tiempos ordenados, el mejor tiempo y su piloto; elige el',
    '# número secreto con la semilla 11 y entrega el podio con carrera().',
  ].join('\n'),
  solution: [
    'pilotos = ["Sara", "Leo", "Nuria", "Teo"]',
    'tiempos = [48, 39, 55, 42]',
    'ordenados = sorted(tiempos)',
    'print(ordenados)',
    'mejor = ordenados[0]',
    'print("Mejor: " + str(mejor))',
    'ganador = tiempos.index(mejor)',
    'print("Piloto: " + pilotos[ganador])',
    'random.seed(11)',
    'secreto = random.randint(1, 10)',
    'print("Secreto: " + str(secreto))',
    'carrera(pilotos[ganador], mejor)',
    'adivinar(secreto)',
  ].join('\n'),
  par: 13,
  sceneTitle: 'La carrera',
  success: 'Tiempos ordenados, podio decidido y número secreto elegido.',
  Scene: RaceScene,
  start() {
    const race = createRace()

    return {
      api: createRaceApi(race),
      finish(result) {
        return { ...judgeRace(race, result.output), steps: raceSteps(race) }
      },
    }
  },
}
