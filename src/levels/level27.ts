import { censusSteps, createCensus, createCensusApi, judgeCensus } from '../engine/census'
import { CensusScene } from './scenes/CensusScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_27: PlayableLevel = {
  id: 27,
  title: 'El censo',
  concept: 'items(), keys() y values()',
  story:
    'El censo de la flota es un diccionario: censo = {"marte": 12, "venus": 8, "luna": 5}. La oficina quiere tres cosas. Cuántos planetas hay, contando las claves con keys(): «Planetas: 3». Cuántos habitantes hay en total, sumando lo que devuelve values(): «Habitantes: 25». Y la ficha de cada planeta, recorriendo items() con un for, una línea por planeta y en el orden del censo: «marte: 12», «venus: 8» y «luna: 5». Después devuelve el censo con cerrar(censo).',
  hint:
    'len(censo.keys()) cuenta los planetas y sum(censo.values()) suma los habitantes. Con items() cada vuelta del for trae una pareja: el nombre con pareja[0] y el número con pareja[1]. Consigue 3 estrellas con 8 líneas o menos.',
  starter: [
    'censo = {"marte": 12, "venus": 8, "luna": 5}',
    '# Anuncia los planetas, el total de habitantes y la ficha de cada uno.',
    '# Después devuelve el censo entero.',
  ].join('\n'),
  solution: [
    'censo = {"marte": 12, "venus": 8, "luna": 5}',
    'print("Planetas: " + str(len(censo.keys())))',
    'print("Habitantes: " + str(sum(censo.values())))',
    'for pareja in censo.items():',
    '    print(pareja[0] + ": " + str(pareja[1]))',
    'cerrar(censo)',
  ].join('\n'),
  par: 8,
  sceneTitle: 'El censo de la flota',
  success: 'Censo contado planeta a planeta.',
  Scene: CensusScene,
  start() {
    const census = createCensus()

    return {
      api: createCensusApi(census),
      finish(result) {
        return { ...judgeCensus(census, result.output), steps: censusSteps(census) }
      },
    }
  },
}
