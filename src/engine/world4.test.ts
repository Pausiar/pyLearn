import { describe, expect, it } from 'vitest'
import { run } from '../interp/run'
import {
  adventurerSteps,
  BACKPACK_LIGHT,
  BACKPACK_MESSAGE,
  createAdventurer,
  createAdventurerApi,
  judgeAdventurer,
} from './adventurer'
import {
  CONVOY_LOADS,
  CONVOY_MESSAGES,
  convoySteps,
  createConvoy,
  createConvoyApi,
  judgeConvoy,
  TRAIN_FULL,
} from './convoy'
import {
  createPizzeria,
  createPizzeriaApi,
  judgePizzeria,
  PIZZA_MESSAGES,
  PIZZA_QUEUE,
  pizzeriaSteps,
} from './pizzeria'
import { createRoute, createRouteApi, judgeRoute, ROUTE_MESSAGE, routeSteps } from './route'
import { createTrain, createTrainApi, judgeTrain, TRAIN_MESSAGES, trainSteps } from './train'

describe('nivel 16: el tren', () => {
  const solution = [
    'vagones = ["carbón", "madera", "agua", "ganado", "correo", "fruta", "vacío"]',
    'print("Vagones: " + str(len(vagones)))',
    'print("Primero: " + vagones[0])',
    'print("Último: " + vagones[-1])',
    'vagones[-1] = "carbón"',
    'enviar(vagones)',
  ].join('\n')

  it('completa el nivel con los tres anuncios y el vagón cargado', () => {
    const train = createTrain()
    const result = run(solution, createTrainApi(train))

    expect(result.error).toBeUndefined()
    expect(result.output).toEqual([...TRAIN_MESSAGES])
    expect(train.loads).toEqual([
      'carbón',
      'madera',
      'agua',
      'ganado',
      'correo',
      'fruta',
      'carbón',
    ])
    expect(judgeTrain(train, result.output).complete).toBe(true)
  })

  it('suspende si el vagón vacío sigue vacío', () => {
    const train = createTrain()
    const code = [
      'vagones = ["carbón", "madera", "agua", "ganado", "correo", "fruta", "vacío"]',
      'print("Vagones: " + str(len(vagones)))',
      'print("Primero: " + vagones[0])',
      'print("Último: " + vagones[-1])',
      'enviar(vagones)',
    ].join('\n')
    const result = run(code, createTrainApi(train))
    const verdict = judgeTrain(train, result.output)

    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('posición -1')
    expect(verdict.missing).toContain('vacío')
  })

  it('pide los tres anuncios en orden', () => {
    const train = createTrain()
    const code = 'enviar(["carbón", "madera", "agua", "ganado", "correo", "fruta", "carbón"])'
    const result = run(code, createTrainApi(train))
    const verdict = judgeTrain(train, result.output)

    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain(TRAIN_MESSAGES[0])
  })

  it('no acepta otra cosa que no sea la lista de vagones', () => {
    expect(run('enviar(7)', createTrainApi(createTrain())).error?.line).toBe(1)
    expect(judgeTrain(createTrain(), []).missing).toContain('enviar(vagones)')
  })

  it('deja un fotograma al salir y otro a la llegada', () => {
    const train = createTrain()
    run(solution, createTrainApi(train))

    expect(trainSteps(train)).toHaveLength(2)
    expect(trainSteps(createTrain())).toHaveLength(1)
  })
})

describe('nivel 17: el repartidor', () => {
  const solution = [
    'casas = ["Sara", "Leo", "Nuria", "Teo"]',
    'entregas = 0',
    'for casa in casas:',
    '    entregar(casa)',
    '    entregas = entregas + 1',
    'print("Entregas: " + str(entregas))',
  ].join('\n')

  it('completa el nivel recorriendo la ruta entera', () => {
    const route = createRoute()
    const result = run(solution, createRouteApi(route))

    expect(result.error).toBeUndefined()
    expect(route.delivered).toEqual(['Sara', 'Leo', 'Nuria', 'Teo'])
    expect(result.output).toEqual([ROUTE_MESSAGE])
    expect(judgeRoute(route, result.output).complete).toBe(true)
  })

  it('no deja saltarse una casa ni repetirla', () => {
    const route = createRoute()
    const api = createRouteApi(route)

    expect(run('entregar("Sara")\nentregar("Nuria")', api).error?.message).toContain(
      'ahora toca Leo',
    )
    expect(run('entregar("Sara")\nentregar("Sara")', api).error?.message).toContain('uno solo')
    expect(run('entregar("Pau")', api).error?.message).toContain('no está en la ruta')
  })

  it('pide la cuenta de las entregas al final', () => {
    const route = createRoute()
    const code = 'casas = ["Sara", "Leo", "Nuria", "Teo"]\nfor casa in casas:\n    entregar(casa)'
    const result = run(code, createRouteApi(route))

    expect(route.delivered).toHaveLength(4)

    const verdict = judgeRoute(route, result.output)
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain(ROUTE_MESSAGE)
  })

  it('dice cuántas entregas faltan', () => {
    const result = run('entregar("Sara")', createRouteApi(createRoute()))
    const verdict = judgeRoute(createRoute(), result.output)

    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('Van 0 de 4')
  })

  it('deja un fotograma por paquete entregado', () => {
    const route = createRoute()
    run(solution, createRouteApi(route))

    expect(routeSteps(route)).toHaveLength(4)
    expect(routeSteps(createRoute())).toHaveLength(1)
  })
})

describe('nivel 18: la pizzería', () => {
  const solution = [
    'pedidos = ["barbacoa", "margarita", "cuatro quesos"]',
    'pedidos.append("anchoas")',
    'pedidos.remove("margarita")',
    'pedidos.insert(0, "tarta")',
    'servida = pedidos.pop(0)',
    'pedidos.sort()',
    'print("Servida: " + servida)',
    'print(pedidos)',
    'cocina(pedidos)',
  ].join('\n')

  it('completa el nivel con los cinco cambios', () => {
    const pizzeria = createPizzeria()
    const result = run(solution, createPizzeriaApi(pizzeria))

    expect(result.error).toBeUndefined()
    expect(pizzeria.queue).toEqual([...PIZZA_QUEUE])
    expect(result.output).toEqual([...PIZZA_MESSAGES])
    expect(judgePizzeria(pizzeria, result.output).complete).toBe(true)
  })

  it('suspende si la cola no queda ordenada', () => {
    const pizzeria = createPizzeria()
    const code = [
      'pedidos = ["barbacoa", "margarita", "cuatro quesos"]',
      'pedidos.append("anchoas")',
      'pedidos.remove("margarita")',
      'pedidos.insert(0, "tarta")',
      'servida = pedidos.pop(0)',
      'print("Servida: " + servida)',
      'print(pedidos)',
      'cocina(pedidos)',
    ].join('\n')
    const result = run(code, createPizzeriaApi(pizzeria))
    const verdict = judgePizzeria(pizzeria, result.output)

    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain(PIZZA_MESSAGES[1])
  })

  it('no acepta una cola que no es la del día', () => {
    const pizzeria = createPizzeria()
    const code = [
      'pedidos = ["anchoas", "barbacoa", "cuatro quesos"]',
      'print("Servida: tarta")',
      'print(pedidos)',
      'cocina(["otra"])',
    ].join('\n')
    const result = run(code, createPizzeriaApi(pizzeria))
    const verdict = judgePizzeria(pizzeria, result.output)

    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('ha llegado [otra]')
  })

  it('pide que la cola llegue a la cocina', () => {
    const verdict = judgePizzeria(createPizzeria(), [])
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('cocina(pedidos)')
  })

  it('deja el fotograma de la cola que llega', () => {
    const pizzeria = createPizzeria()
    run(solution, createPizzeriaApi(pizzeria))

    expect(pizzeriaSteps(pizzeria)).toHaveLength(2)
  })
})

describe('nivel 19: el convoy', () => {
  const solution = [
    'tren = ["locomotora", "carbón", "madera", "agua", "ganado", "correo", "fruta", "cemento", "furgón"]',
    'convoy = tren[1:5]',
    'formar(convoy)',
    'print("Convoy: " + str(len(convoy)))',
    'print("Furgón: " + str("furgón" in convoy))',
    'print("Cemento: " + str("cemento" in tren))',
  ].join('\n')

  it('completa el nivel con la rebanada y las dos comprobaciones', () => {
    const convoy = createConvoy()
    const result = run(solution, createConvoyApi(convoy))

    expect(result.error).toBeUndefined()
    expect(convoy.convoy).toEqual([...CONVOY_LOADS])
    expect(result.output).toEqual([...CONVOY_MESSAGES])
    expect(judgeConvoy(convoy, result.output).complete).toBe(true)
  })

  it('suspende si el convoy se corta por otro sitio', () => {
    const convoy = createConvoy()
    const code = [
      'tren = ["locomotora", "carbón", "madera", "agua", "ganado", "correo", "fruta", "cemento", "furgón"]',
      'formar(tren[2:6])',
      'print("Convoy: 4")',
      'print("Furgón: False")',
      'print("Cemento: True")',
    ].join('\n')
    const result = run(code, createConvoyApi(convoy))
    const verdict = judgeConvoy(convoy, result.output)

    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('posición 1 a la 5')
  })

  it('pide los tres anuncios', () => {
    const convoy = createConvoy()
    const code = [
      'tren = ["locomotora", "a", "b", "c", "d", "e", "f", "cemento", "furgón"]',
      'formar(tren[1:5])',
    ].join('\n')
    const result = run(code, createConvoyApi(convoy))
    const verdict = judgeConvoy(convoy, result.output)

    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain(CONVOY_MESSAGES[0])
  })

  it('pide que el convoy llegue formado', () => {
    const verdict = judgeConvoy(createConvoy(), [])
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('formar(convoy)')
  })

  it('deja la traza del tren largo y la del convoy', () => {
    const convoy = createConvoy()
    run(solution, createConvoyApi(convoy))

    const steps = convoySteps(convoy)
    expect(steps).toHaveLength(2)
    expect(steps[0]).toMatchObject({ kind: 'convoy', full: [...TRAIN_FULL], formed: false })
    expect(steps[1]).toMatchObject({ kind: 'convoy', convoy: [...CONVOY_LOADS], formed: true })
  })
})

describe('nivel 20: la mochila del aventurero', () => {
  const solution = [
    'mochila = ["espada", "antorcha", "cuerda", "escudo", "manzana", "brújula"]',
    'pesos = [8, 2, 3, 6, 1, 1]',
    'ligera = []',
    'for i in range(len(mochila)):',
    '    if pesos[i] <= 3:',
    '        ligera.append(mochila[i])',
    'ligera.sort()',
    'print("Ligera: " + str(len(ligera)) + " objetos")',
    'salir(ligera)',
  ].join('\n')

  it('completa el nivel filtrando los pesos y ordenando', () => {
    const adventurer = createAdventurer()
    const result = run(solution, createAdventurerApi(adventurer))

    expect(result.error).toBeUndefined()
    expect(adventurer.light).toEqual([...BACKPACK_LIGHT])
    expect(result.output).toEqual([BACKPACK_MESSAGE])
    expect(judgeAdventurer(adventurer, result.output).complete).toBe(true)
  })

  it('suspende si no se ordena la mochila ligera', () => {
    const adventurer = createAdventurer()
    const code = [
      'mochila = ["espada", "antorcha", "cuerda", "escudo", "manzana", "brújula"]',
      'pesos = [8, 2, 3, 6, 1, 1]',
      'ligera = []',
      'for i in range(len(mochila)):',
      '    if pesos[i] <= 3:',
      '        ligera.append(mochila[i])',
      'print("Ligera: " + str(len(ligera)) + " objetos")',
      'salir(ligera)',
    ].join('\n')
    const result = run(code, createAdventurerApi(adventurer))
    const verdict = judgeAdventurer(adventurer, result.output)

    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain(BACKPACK_LIGHT.join(', '))
  })

  it('suspende si se cuela un objeto pesado', () => {
    const adventurer = createAdventurer()
    const code = [
      'ligera = ["espada", "antorcha", "cuerda", "manzana", "brújula"]',
      'ligera.sort()',
      'print("Ligera: 5 objetos")',
      'salir(ligera)',
    ].join('\n')
    const result = run(code, createAdventurerApi(adventurer))
    const verdict = judgeAdventurer(adventurer, result.output)

    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain(BACKPACK_MESSAGE)
  })

  it('pide que el aventurero salga con la mochila', () => {
    const verdict = judgeAdventurer(createAdventurer(), [])
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('salir(ligera)')
  })

  it('deja la traza de la mochila grande y de la ligera', () => {
    const adventurer = createAdventurer()
    run(solution, createAdventurerApi(adventurer))

    const steps = adventurerSteps(adventurer)
    expect(steps).toHaveLength(2)
    expect(steps[1]).toMatchObject({ kind: 'adventure', light: [...BACKPACK_LIGHT], done: true })
  })
})
