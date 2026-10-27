import { createScanner, createScannerApi, judgeScanner, scannerSteps } from '../engine/scanner'
import { ScannerScene } from './scenes/ScannerScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_14: PlayableLevel = {
  id: 14,
  title: 'El escáner',
  concept: 'break, continue y range con paso',
  story:
    'El escáner solo llega a los pasillos impares del almacén: recórrelos con range(1, 13, 2). Cada pasillo se consulta primero con vacio(pasillo): si está vacío, sáltalo con continue sin gastar lectura. En los demás, suma sus cajas con revisar(pasillo). La caja transportadora se llena a las 10 cajas, así que en cuanto el total llegue a 10 o más toca parar con break. Anuncia al final «Cajas cargadas: 12».',
  hint:
    'Guarda el total en cargas = 0. Dentro del for: if vacio(pasillo): continue; después cargas = cargas + revisar(pasillo); y por último if cargas >= 10: break. Cierra con print("Cajas cargadas: " + str(cargas)). Consigue 3 estrellas con 10 líneas o menos.',
  starter: [
    '# Pasillos impares: 1, 3, 5, 7, 9 y 11.',
    'cargas = 0',
    '# Salta los vacíos con continue y para cuando la caja se llene.',
  ].join('\n'),
  solution: [
    'cargas = 0',
    'for pasillo in range(1, 13, 2):',
    '    if vacio(pasillo):',
    '        continue',
    '    cargas = cargas + revisar(pasillo)',
    '    if cargas >= 10:',
    '        break',
    'print("Cajas cargadas: " + str(cargas))',
  ].join('\n'),
  par: 10,
  sceneTitle: 'El almacén',
  success: 'Pasillos revisados y caja transportadora llena.',
  Scene: ScannerScene,
  start() {
    const scanner = createScanner()

    return {
      api: createScannerApi(scanner),
      finish(result) {
        return { ...judgeScanner(scanner, result.output), steps: scannerSteps(scanner) }
      },
    }
  },
}
