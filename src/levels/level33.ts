import { diarySteps, judgeDiary } from '../engine/diary'
import { DiaryScene } from './scenes/DiaryScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_33: PlayableLevel = {
  id: 33,
  title: 'El diario',
  concept: 'open, read, write y with',
  story:
    'El diario de a bordo vive en un archivo. Escribe sus tres líneas con with open("diario.txt", "w") as diario: y un write() por línea, cada una terminada en salto de línea ("\\n"): «Día 1: despegue», «Día 2: órbita» y «Día 3: vuelta». Después ábrelo otra vez para leerlo con with open("diario.txt") as diario: y recorre el archivo con for linea in diario:, anunciando cada línea limpia con print(linea.strip()) y contando cuántas van. Al final anuncia el recuento: «Líneas: 3».',
  hint:
    'El with abre el archivo y lo cierra solo al acabar su bloque. Con "w" se escribe (y se empieza de cero) y sin nada se lee. write() no añade el salto de línea: ponlo tú al final del texto. Al leer, el for recorre el archivo línea a línea y strip() le quita el salto al imprimirla. Consigue 3 estrellas con 11 líneas o menos.',
  starter: [
    '# Escribe el diario en «diario.txt» con tres write() y vuelve a leerlo',
    '# para anunciar cada línea y contar cuántas hay.',
  ].join('\n'),
  solution: [
    'with open("diario.txt", "w") as diario:',
    '    diario.write("Día 1: despegue\\n")',
    '    diario.write("Día 2: órbita\\n")',
    '    diario.write("Día 3: vuelta\\n")',
    'with open("diario.txt") as diario:',
    '    lineas = 0',
    '    for linea in diario:',
    '        print(linea.strip())',
    '        lineas = lineas + 1',
    'print("Líneas: " + str(lineas))',
  ].join('\n'),
  par: 11,
  sceneTitle: 'El diario de a bordo',
  success: 'Diario escrito y leído de nuevo, línea a línea.',
  Scene: DiaryScene,
  start() {
    return {
      api: {},
      finish(result) {
        return { ...judgeDiary(result), steps: diarySteps(result) }
      },
    }
  },
}
