import { describe, expect, it } from 'vitest'
import { run } from '../interp/run'
import {
  createLab,
  createLabApi,
  expectedReadings,
  judgeLab,
  LAB_BASES,
  labSteps,
} from './lab'
import { createOven, createOvenApi, judgeOven, ORDERS, ovenSteps } from './oven'
import {
  createRestaurant,
  createRestaurantApi,
  EXPECTED_TRACE,
  judgeRestaurant,
  restaurantSteps,
} from './restaurant'
import { createRobot, createRobotApi, HURDLES, judgeRobot, robotSteps, TRACK_END } from './robot'
import { createVending, createVendingApi, judgeVending, SALES, vendingSteps } from './vending'

describe('nivel 21: el truco nuevo', () => {
  const solution = [
    'def saltar_valla():',
    '    avanzar()',
    '    saltar()',
    '',
    'aprender(saltar_valla)',
    'correr()',
  ].join('\n')

  it('completa el nivel enseñando el truco y usándolo en cada valla', () => {
    const robot = createRobot()
    const result = run(solution, createRobotApi(robot))

    expect(result.error).toBeUndefined()
    expect(robot.jumps).toBe(HURDLES.length)
    expect(robot.position).toBe(TRACK_END)
    expect(judgeRobot(robot).complete).toBe(true)
  })

  it('avisa si el truco se choca con una valla', () => {
    const robot = createRobot()
    const code = [
      'def saltar_valla():',
      '    avanzar()',
      '    avanzar()',
      '',
      'aprender(saltar_valla)',
      'correr()',
    ].join('\n')
    const result = run(code, createRobotApi(robot))

    expect(result.error?.line).toBe(3)
    expect(result.error?.message).toContain('valla')
    expect(judgeRobot(robot).complete).toBe(false)
  })

  it('pide aprender el truco antes de correr', () => {
    const result = run('correr()', createRobotApi(createRobot()))

    expect(result.error?.message).toContain('aprender(saltar_valla)')

    const verdict = judgeRobot(createRobot())
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('aprender(saltar_valla)')
  })

  it('solo acepta una función como truco', () => {
    const result = run('aprender(3)', createRobotApi(createRobot()))

    expect(result.error?.message).toBe('aprender() necesita tu función saltar_valla, sin paréntesis')
  })

  it('deja el fotograma inicial y uno por orden ejecutada', () => {
    const robot = createRobot()
    run(solution, createRobotApi(robot))

    expect(robotSteps(robot)).toHaveLength(1 + HURDLES.length * 2)
    expect(robotSteps(createRobot())).toHaveLength(1)
  })
})

describe('nivel 22: pizzas a medida', () => {
  const solution = [
    'def preparar(sabor, cantidad=1):',
    '    hornear(sabor, cantidad)',
    '',
    'tanda(preparar)',
  ].join('\n')

  it('completa el nivel con la tanda del día', () => {
    const oven = createOven()
    const result = run(solution, createOvenApi(oven))

    expect(result.error).toBeUndefined()
    expect(oven.baked).toEqual(ORDERS.map((order) => ({ ...order })))
    expect(judgeOven(oven).complete).toBe(true)
  })

  it('exige el valor por defecto para el pedido de una sola pizza', () => {
    const oven = createOven()
    const code = [
      'def preparar(sabor, cantidad):',
      '    hornear(sabor, cantidad)',
      '',
      'tanda(preparar)',
    ].join('\n')
    const result = run(code, createOvenApi(oven))

    expect(result.error?.line).toBe(4)
    expect(result.error?.message).toBe('La función preparar() espera 2 valores y ha recibido 1')
  })

  it('avisa si la receta hornea una cantidad distinta', () => {
    const oven = createOven()
    const code = [
      'def preparar(sabor, cantidad=1):',
      '    hornear(sabor, 1)',
      '',
      'tanda(preparar)',
    ].join('\n')
    const result = run(code, createOvenApi(oven))

    expect(result.error?.message).toContain('El horno esperaba 3 de margarita')
    expect(judgeOven(createOven()).missing).toContain('tanda(preparar)')
  })

  it('pide una función de verdad', () => {
    const result = run('tanda(3)', createOvenApi(createOven()))

    expect(result.error?.message).toBe('tanda() necesita tu función preparar(sabor, cantidad=1)')
  })

  it('deja el ticket y una pizzada más en cada fotograma', () => {
    const oven = createOven()
    run(solution, createOvenApi(oven))

    expect(ovenSteps(oven)).toHaveLength(1 + ORDERS.length)
    expect(ovenSteps(createOven())).toHaveLength(1)
  })
})

describe('nivel 23: la expendedora', () => {
  const solution = [
    'def cambio(precio, pago):',
    '    return pago - precio',
    '',
    'maquina(cambio)',
  ].join('\n')

  it('completa el nivel devolviendo el cambio exacto', () => {
    const vending = createVending()
    const result = run(solution, createVendingApi(vending))

    expect(result.error).toBeUndefined()
    expect(vending.sold.map((sale) => sale.cambio)).toEqual([50, 20, 80])
    expect(judgeVending(vending).complete).toBe(true)
  })

  it('avisa si a la función le falta el return', () => {
    const code = ['def cambio(precio, pago):', '    pago - precio', '', 'maquina(cambio)'].join('\n')
    const result = run(code, createVendingApi(createVending()))

    expect(result.error?.line).toBe(4)
    expect(result.error?.message).toContain('el cambio se devuelve con return')
  })

  it('avisa si el cambio no cuadra', () => {
    const code = [
      'def cambio(precio, pago):',
      '    return precio - pago',
      '',
      'maquina(cambio)',
    ].join('\n')
    const result = run(code, createVendingApi(createVending()))

    expect(result.error?.message).toContain('El cambio no cuadra con zumo')
  })

  it('pide una función de verdad', () => {
    expect(run('maquina(7)', createVendingApi(createVending())).error?.message).toBe(
      'maquina() necesita tu función cambio(precio, pago)',
    )

    const verdict = judgeVending(createVending())
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('maquina(cambio)')
  })

  it('deja un fotograma por venta', () => {
    const vending = createVending()
    run(solution, createVendingApi(vending))

    expect(vendingSteps(vending)).toHaveLength(SALES.length)
    expect(vendingSteps(createVending())).toHaveLength(1)
  })
})

describe('nivel 24: laboratorios', () => {
  const solution = [
    'base = termostato()',
    '',
    'def calentar(grados):',
    '    temperatura = base + grados',
    '    return temperatura',
    '',
    'medir("sala", calentar(5))',
    'medir("fuera", base)',
    'medir("sala", calentar(8))',
    'medir("fuera", base)',
  ].join('\n')

  it('completa el nivel con las cuatro lecturas', () => {
    const lab = createLab()
    const result = run(solution, createLabApi(lab))

    expect(result.error).toBeUndefined()
    expect(lab.readings).toEqual(expectedReadings(lab.base))

    const verdict = judgeLab(lab, solution)
    expect(verdict.complete).toBe(true)
    expect(verdict.missing).toBe('')
    expect(verdict.steps.length).toBe(expectedReadings(lab.base).length)
  })

  it('suspende si las lecturas están escritas a mano', () => {
    const lab = createLab()
    const code = [
      'medir("sala", 25)',
      'medir("fuera", 20)',
      'medir("sala", 28)',
      'medir("fuera", 20)',
    ].join('\n')
    const result = run(code, createLabApi(lab))
    const verdict = judgeLab(lab, code)

    expect(result.error).toBeUndefined()
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain(`termostato en ${LAB_BASES[1]}`)
  })

  it('suspende si la función pisa la base global', () => {
    const lab = createLab()
    const code = [
      'base = termostato()',
      '',
      'def calentar(grados):',
      '    base = base + grados',
      '    return base',
      '',
      'medir("sala", calentar(5))',
      'medir("fuera", base)',
      'medir("sala", calentar(8))',
      'medir("fuera", base)',
    ].join('\n')
    const result = run(code, createLabApi(lab))

    expect(result.error?.line).toBe(4)
    expect(result.error?.message).toContain('es local en esta función')
  })

  it('pide el sitio y el número en medir()', () => {
    expect(run('medir("patio", 3)', createLabApi(createLab())).error?.message).toBe(
      'medir() anota dos sitios: "sala" o "fuera"',
    )
    expect(run('medir("sala", "caliente")', createLabApi(createLab())).error?.message).toBe(
      'medir() necesita el número que marca el termómetro',
    )
  })

  it('deja el cuaderno llenándose lectura a lectura', () => {
    const lab = createLab()
    run(solution, createLabApi(lab))

    expect(labSteps(lab)).toHaveLength(expectedReadings(lab.base).length)
    expect(labSteps(createLab())).toHaveLength(1)
  })
})

describe('nivel 25: la cocina modular', () => {
  const solution = [
    'def sopa(ingrediente):',
    '    picar(ingrediente)',
    '    hervir(ingrediente)',
    '    servir("sopa")',
    '',
    'def tarta(ingrediente):',
    '    picar(ingrediente)',
    '    hornear(ingrediente)',
    '    servir("tarta")',
    '',
    'def cocinar(plato):',
    '    if plato == "sopa":',
    '        sopa("cebolla")',
    '    else:',
    '        tarta("manzana")',
    '',
    'carta(sopa, tarta, cocinar)',
  ].join('\n')

  it('completa el servicio con las tres recetas', () => {
    const restaurant = createRestaurant()
    const result = run(solution, createRestaurantApi(restaurant))

    expect(result.error).toBeUndefined()
    expect(restaurant.trace).toEqual(EXPECTED_TRACE.map((entry) => ({ ...entry })))
    expect(restaurant.served).toEqual(['sopa', 'tarta', 'sopa'])
    expect(judgeRestaurant(restaurant).complete).toBe(true)
  })

  it('suspende si una receta sirve el plato a medias', () => {
    const code = solution.replace('    hervir(ingrediente)\n', '')
    const result = run(code, createRestaurantApi(createRestaurant()))

    expect(result.error?.message).toBe('Para la sopa hay que hervir la cebolla antes')
  })

  it('avisa si un plato se sirve sin pasar por el fuego', () => {
    const code = solution.replace('        sopa("cebolla")\n', '        servir("sopa")\n')
    const restaurant = createRestaurant()
    const result = run(code, createRestaurantApi(restaurant))

    expect(result.error?.message).toBe('Para la sopa hay que hervir la cebolla antes')
    expect(judgeRestaurant(restaurant).complete).toBe(false)
  })

  it('pide las tres funciones al maître', () => {
    const result = run('carta(1, 2, 3)', createRestaurantApi(createRestaurant()))

    expect(result.error?.message).toBe('carta() necesita tus tres funciones: sopa, tarta y cocinar')

    const verdict = judgeRestaurant(createRestaurant())
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('carta(sopa, tarta, cocinar)')
  })

  it('deja un fotograma por paso de la cocina', () => {
    const restaurant = createRestaurant()
    run(solution, createRestaurantApi(restaurant))

    expect(restaurantSteps(restaurant)).toHaveLength(1 + EXPECTED_TRACE.length)
    expect(restaurantSteps(createRestaurant())).toHaveLength(1)
  })
})
