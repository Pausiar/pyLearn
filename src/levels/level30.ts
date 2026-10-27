import { archiveSteps, createArchive, createArchiveApi, judgeArchive } from '../engine/archive'
import { ArchiveScene } from './scenes/ArchiveScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_30: PlayableLevel = {
  id: 30,
  title: 'El archivo',
  concept: 'Estructuras anidadas',
  story:
    'Última consulta del mundo de los datos: el archivo del museo es un diccionario de diccionarios, con una ficha por sala, y cada ficha tiene sus piezas y su sala. Recorre las claves del archivo con for nombre in archivo: y anuncia una línea por sala con el nombre y dónde está, como «dinos -> norte» (las tres líneas, en el orden del archivo: dinos, arte y tecno). Ve sumando las piezas de cada ficha en una variable total y anúncialas al final: «Piezas: 25». Entrega el archivo entero con entregar(archivo).',
  hint:
    'Dentro del for, nombre es la clave y archivo[nombre] es su ficha, que a su vez es otro diccionario: la sala se lee con archivo[nombre]["sala"] y las piezas con archivo[nombre]["piezas"]. Suma esas piezas en total y anuncia el total al salir del bucle. Cada diccionario va en su línea, y todo el archivo cabe en una sola línea de código. Consigue 3 estrellas con 9 líneas o menos.',
  starter: [
    'archivo = {"dinos": {"piezas": 12, "sala": "norte"}, "arte": {"piezas": 8, "sala": "sur"}, "tecno": {"piezas": 5, "sala": "este"}}',
    '# Recorre el archivo, anuncia la sala de cada ficha y suma las piezas.',
    '# Después entrega el archivo entero.',
  ].join('\n'),
  solution: [
    'archivo = {"dinos": {"piezas": 12, "sala": "norte"}, "arte": {"piezas": 8, "sala": "sur"}, "tecno": {"piezas": 5, "sala": "este"}}',
    'total = 0',
    'for nombre in archivo:',
    '    print(nombre + " -> " + archivo[nombre]["sala"])',
    '    total = total + archivo[nombre]["piezas"]',
    'print("Piezas: " + str(total))',
    'entregar(archivo)',
  ].join('\n'),
  par: 9,
  sceneTitle: 'El archivo del museo',
  success: 'Archivo consultado sala por sala.',
  Scene: ArchiveScene,
  start() {
    const archive = createArchive()

    return {
      api: createArchiveApi(archive),
      finish(result) {
        return { ...judgeArchive(archive, result.output), steps: archiveSteps(archive) }
      },
    }
  },
}
