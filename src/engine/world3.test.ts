import { describe, expect, it } from 'vitest'
import { run } from '../interp/run'
import {
  createGrid,
  createGridApi,
  gridSteps,
  GRID_CELLS,
  GRID_MESSAGES,
  judgeGrid,
} from './grid'
import {
  CROP_COUNT,
  createIrrigation,
  createIrrigationApi,
  irrigationSteps,
  judgeIrrigation,
} from './irrigation'
import { createMine, createMineApi, judgeMine, MINE_MESSAGE, mineSteps } from './mine'
import {
  createScanner,
  createScannerApi,
  judgeScanner,
  SCANNER_MESSAGE,
  SCANNER_TOTAL,
  scannerSteps,
} from './scanner'
import { createVault, createVaultApi, judgeVault, VAULT_MESSAGE, vaultSteps } from './vault'

describe('nivel 11: el riego en bucle', () => {
  const solution = ['for i in range(100):', '    avanzar()', '    regar()'].join('\n')

  it('riega los cien cultivos con un bucle', () => {
    const field = createIrrigation()
    const result = run(solution, createIrrigationApi(field))

    expect(result.error).toBeUndefined()
    expect(field.watered.size).toBe(CROP_COUNT)
    expect(judgeIrrigation(field).complete).toBe(true)
  })

  it('dice cuántos cultivos faltan cuando el bucle se queda corto', () => {
    const field = createIrrigation()
    run(['for i in range(99):', '    avanzar()', '    regar()'].join('\n'), createIrrigationApi(field))

    const verdict = judgeIrrigation(field)
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('1 cultivo')
    expect(verdict.missing).toContain('99 de 100')
  })

  it('no deja regar en el hangar, repetir un cultivo ni salirse del campo', () => {
    const field = createIrrigation()
    const api = createIrrigationApi(field)

    expect(run('regar()', api).error?.message).toContain('hangar')

    expect(run('avanzar()\nregar()\nregar()', api).error?.line).toBe(3)

    expect(run('for i in range(200):\n    avanzar()', api).error?.message).toContain('se sale')
  })

  it('guarda hitos de diez en diez, no cien fotogramas', () => {
    const field = createIrrigation()
    run(solution, createIrrigationApi(field))

    const steps = irrigationSteps(field)
    expect(steps).toHaveLength(11)
    expect(steps.at(-1)).toMatchObject({ kind: 'irrigation', position: CROP_COUNT })
  })
})

describe('nivel 12: el minero', () => {
  const solution = [
    'picadas = 0',
    'while hay_piedra():',
    '    picar()',
    '    picadas = picadas + 1',
    'print("He picado " + str(picadas) + " piedras")',
  ].join('\n')

  it('pica la veta entera y anuncia la cuenta', () => {
    const mine = createMine()
    const result = run(solution, createMineApi(mine))

    expect(result.error).toBeUndefined()
    expect(mine.rocks).toBe(0)
    expect(mine.picadas).toBe(6)
    expect(judgeMine(mine, result.output).complete).toBe(true)
  })

  it('avisa cuando la veta sigue con piedras', () => {
    const mine = createMine()
    run('picar()\npicar()', createMineApi(mine))

    const verdict = judgeMine(mine, [])
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('4 piedras')
  })

  it('no deja picar una veta agotada', () => {
    const mine = createMine()
    const api = createMineApi(mine)
    run(solution, api)

    expect(run('picar()', api).error?.message).toContain('agotada')
  })

  it('exige el mensaje exacto del minero', () => {
    const mine = createMine()
    run('for i in range(6):\n    picar()\nprint("Ya está")', createMineApi(mine))

    const verdict = judgeMine(mine, ['Ya está'])
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain(MINE_MESSAGE)
  })

  it('deja un fotograma por piedra picada', () => {
    const mine = createMine()
    run(solution, createMineApi(mine))

    const steps = mineSteps(mine)
    expect(steps).toHaveLength(7)
    expect(steps[0]).toMatchObject({ kind: 'mine', rocks: 6, picadas: 0 })
    expect(steps.at(-1)).toMatchObject({ kind: 'mine', rocks: 0, picadas: 6 })
  })
})

describe('nivel 13: la caja fuerte', () => {
  const solution = [
    'for numero in range(1, 7):',
    '    if probar(numero):',
    '        print("Abierta con la contraseña " + str(numero))',
    '        break',
  ].join('\n')

  it('abre la caja y para en el cuarto intento', () => {
    const vault = createVault()
    const result = run(solution, createVaultApi(vault))

    expect(result.error).toBeUndefined()
    expect(vault.tried).toEqual([1, 2, 3, 4])
    expect(result.output).toEqual([VAULT_MESSAGE])
    expect(judgeVault(vault, result.output).complete).toBe(true)
  })

  it('suspende al que prueba las seis contraseñas', () => {
    const vault = createVault()
    const code = [
      'for numero in range(1, 7):',
      '    if probar(numero):',
      '        print("Abierta con la contraseña " + str(numero))',
    ].join('\n')
    const result = run(code, createVaultApi(vault))

    expect(vault.tried).toEqual([1, 2, 3, 4, 5, 6])

    const verdict = judgeVault(vault, result.output)
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('break')
  })

  it('rechaza contraseñas fuera de rango y repetidas', () => {
    const vault = createVault()
    const api = createVaultApi(vault)

    expect(run('probar(7)', api).error?.message).toContain('1 al 6')
    expect(run('probar("4")', api).error?.message).toContain('1 al 6')
    expect(run('probar(2)\nprobar(2)', api).error?.line).toBe(2)
    expect(judgeVault(createVault(), []).complete).toBe(false)
  })

  it('deja un fotograma por intento', () => {
    const vault = createVault()
    run(solution, createVaultApi(vault))

    const steps = vaultSteps(vault)
    expect(steps).toHaveLength(4)
    expect(steps.at(-1)).toMatchObject({ kind: 'vault', opened: true })
  })
})

describe('nivel 14: el escáner', () => {
  const solution = [
    'cargas = 0',
    'for pasillo in range(1, 13, 2):',
    '    if vacio(pasillo):',
    '        continue',
    '    cargas = cargas + revisar(pasillo)',
    '    if cargas >= 10:',
    '        break',
    'print("Cajas cargadas: " + str(cargas))',
  ].join('\n')

  it('recorre los impares, salta el vacío y para con la caja llena', () => {
    const scanner = createScanner()
    const result = run(solution, createScannerApi(scanner))

    expect(result.error).toBeUndefined()
    expect(scanner.readings).toEqual([1, 5, 7])
    expect(scanner.boxes).toBe(SCANNER_TOTAL)
    expect(result.output).toEqual([SCANNER_MESSAGE])
    expect(judgeScanner(scanner, result.output).complete).toBe(true)
  })

  it('suspende al que no para y sigue revisando el pasillo 9', () => {
    const scanner = createScanner()
    const code = [
      'cargas = 0',
      'for pasillo in range(1, 13, 2):',
      '    if vacio(pasillo):',
      '        continue',
      '    cargas = cargas + revisar(pasillo)',
      'print("Cajas cargadas: " + str(cargas))',
    ].join('\n')
    const result = run(code, createScannerApi(scanner))

    expect(scanner.readings).toEqual([1, 5, 7, 9])

    const verdict = judgeScanner(scanner, result.output)
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('break')
  })

  it('no gasta lecturas en pasillos vacíos ni revisa los pares', () => {
    const scanner = createScanner()
    const api = createScannerApi(scanner)

    expect(run('revisar(3)', api).error?.message).toContain('continue')
    expect(run('revisar(2)', api).error?.message).toContain('impares')
    expect(run('vacio(4)', api).error?.message).toContain('impares')
    expect(scanner.readings).toEqual([])
  })

  it('deja un fotograma por lectura', () => {
    const scanner = createScanner()
    run(solution, createScannerApi(scanner))

    const steps = scannerSteps(scanner)
    expect(steps).toHaveLength(4)
    expect(steps.at(-1)).toMatchObject({
      kind: 'scanner',
      readings: [1, 5, 7],
      boxes: SCANNER_TOTAL,
    })
  })
})

describe('nivel 15: el campo del jefe', () => {
  const solution = [
    'for fila in range(1, 4):',
    '    for casilla in range(4):',
    '        regar()',
    '        avanzar()',
    '    print("Fila " + str(fila) + " regada")',
  ].join('\n')

  it('riega las doce casillas y avisa de cada fila', () => {
    const grid = createGrid()
    const result = run(solution, createGridApi(grid))

    expect(result.error).toBeUndefined()
    expect(grid.watered.size).toBe(GRID_CELLS)
    expect(result.output).toEqual([...GRID_MESSAGES])
    expect(judgeGrid(grid, result.output).complete).toBe(true)
  })

  it('suspende al que riega todo sin avisar de las filas', () => {
    const grid = createGrid()
    const result = run('for casilla in range(12):\n    regar()\n    avanzar()', createGridApi(grid))

    expect(grid.watered.size).toBe(GRID_CELLS)

    const verdict = judgeGrid(grid, result.output)
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain(GRID_MESSAGES[0])
  })

  it('dice cuántas casillas faltan', () => {
    const grid = createGrid()
    const result = run('regar()', createGridApi(grid))

    const verdict = judgeGrid(grid, result.output)
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('11 casillas')
  })

  it('no deja regar dos veces ni salirse con casillas pendientes', () => {
    const grid = createGrid()
    const api = createGridApi(grid)
    expect(run('regar()\nregar()', api).error?.line).toBe(2)

    const otro = createGridApi(createGrid())
    expect(run('for i in range(15):\n    avanzar()', otro).error?.message).toContain('se sale')
  })

  it('para el programa que da más vueltas de las que hacen falta', () => {
    const grid = createGrid()
    const code = [
      'for fila in range(4):',
      '    for casilla in range(4):',
      '        regar()',
      '        avanzar()',
    ].join('\n')

    expect(run(code, createGridApi(grid)).error?.line).toBe(3)
    expect(grid.watered.size).toBe(GRID_CELLS)
  })

  it('deja un fotograma por casilla regada', () => {
    const grid = createGrid()
    run(solution, createGridApi(grid))

    const steps = gridSteps(grid)
    expect(steps).toHaveLength(GRID_CELLS)
    expect(steps.at(-1)).toMatchObject({ kind: 'grid', cell: GRID_CELLS - 1 })
  })
})
