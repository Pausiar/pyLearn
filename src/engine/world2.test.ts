import { describe, expect, it } from 'vitest'
import { run } from '../interp/run'
import { createCrossing, createCrossingApi, judgeCrossing } from './crossing'
import { createGate, createGateApi, judgeGate } from './gate'
import { createLocks, createLocksApi, judgeLocks } from './locks'
import { createRocket, createRocketApi, judgeRocket, ROCKET_FUEL } from './rocket'
import { createShop, createShopApi, judgeShop } from './shop'

describe('nivel 6: el cohete', () => {
  it('completa el nivel con las toneladas correctas', () => {
    const rocket = createRocket()
    const result = run('torre(7 * 12 - 15)', createRocketApi(rocket))

    expect(result.error).toBeUndefined()
    expect(rocket.fuel).toBe(ROCKET_FUEL)
    expect(judgeRocket(rocket).complete).toBe(true)
  })

  it('avisa cuando la cifra no cuadra', () => {
    const rocket = createRocket()
    run('torre(70)', createRocketApi(rocket))

    const verdict = judgeRocket(rocket)
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain(String(ROCKET_FUEL))
  })

  it('rechaza textos y decimales', () => {
    const rocket = createRocket()
    const api = createRocketApi(rocket)

    expect(run('torre("69")', api).error?.line).toBe(1)
    expect(run('torre(69.5)', api).error?.line).toBe(1)
    expect(judgeRocket(createRocket()).complete).toBe(false)
  })
})

describe('nivel 7: la tienda', () => {
  it('el cliente responde en orden y se agota', () => {
    const shop = createShop()
    const result = run('a = input("precio")\nb = input("barras")\nc = input("otra")', createShopApi(shop))

    expect(result.output).toEqual([])
    expect(shop.questions).toEqual(['precio', 'barras'])
    expect(result.error?.message).toContain('ya ha respondido')
  })

  it('completa el nivel con las dos preguntas y el total', () => {
    const shop = createShop()
    const code = [
      'precio = int(input("precio"))',
      'barras = int(input("barras"))',
      'print("Son " + str(precio * barras) + " monedas")',
    ].join('\n')
    const result = run(code, createShopApi(shop))

    expect(result.error).toBeUndefined()
    expect(judgeShop(shop, result.output).complete).toBe(true)
  })

  it('pide las dos preguntas y el mensaje exacto', () => {
    const shop = createShop()
    const result = run('print("Son 6 monedas")', createShopApi(shop))

    const verdict = judgeShop(shop, result.output)
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('input()')
  })
})

describe('nivel 8: los candados', () => {
  it('abre los tres candados con comparaciones', () => {
    const locks = createLocks()
    const code = [
      'candado(1, 15 > 12)',
      'candado(2, 140 >= 130)',
      'candado(3, 15 > 12 and 140 >= 130)',
    ].join('\n')
    const result = run(code, createLocksApi(locks))

    expect(result.error).toBeUndefined()
    expect(judgeLocks(locks).complete).toBe(true)
  })

  it('exige un booleano y un número de candado válido', () => {
    const locks = createLocks()
    const api = createLocksApi(locks)

    expect(run('candado(1, 1)', api).error?.line).toBe(1)
    expect(run('candado(4, True)', api).error?.line).toBe(1)
    expect(judgeLocks(createLocks()).complete).toBe(false)
  })

  it('dice qué candados siguen cerrados', () => {
    const locks = createLocks()
    run('candado(1, True)', createLocksApi(locks))

    const verdict = judgeLocks(locks)
    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('2')
    expect(verdict.missing).toContain('3')
  })
})

describe('nivel 9: el semáforo', () => {
  const solution = ['if luz() == "verde":', '    cruzar()', 'else:', '    esperar()'].join('\n')

  it('el peatón no puede cruzar con la luz en rojo', () => {
    const crossing = createCrossing('rojo')
    const result = run('cruzar()', createCrossingApi(crossing))

    expect(result.error?.message).toContain('rojo')
  })

  it('completa el nivel con el if y el else', () => {
    const crossing = createCrossing('rojo')
    const result = run(solution, createCrossingApi(crossing))
    const outcome = judgeCrossing(crossing, solution)

    expect(result.error).toBeUndefined()
    expect(crossing.waited).toBe(true)
    expect(outcome.complete).toBe(true)
    expect(outcome.steps[0]?.kind).toBe('crossing')
  })

  it('suspende al programa que cruza siempre', () => {
    const crossing = createCrossing('rojo')
    const code = 'cruzar()'
    run(code, createCrossingApi(crossing))

    const outcome = judgeCrossing(crossing, code)
    expect(outcome.complete).toBe(false)
    expect(outcome.missing).toContain('esperar()')
  })
})

describe('nivel 10: el guardián', () => {
  const solution = [
    'entrada = pase()',
    'if entrada == "A":',
    '    puerta_grande()',
    'elif entrada == "B":',
    '    puerta_pequena()',
    'else:',
    '    denegar()',
  ].join('\n')

  it('rechaza al pase que entra por la puerta equivocada', () => {
    const gate = createGate('A')
    const code = 'puerta_grande()'
    run(code, createGateApi(gate))

    const outcome = judgeGate(gate, code)
    expect(outcome.complete).toBe(false)
    expect(outcome.missing).toContain('pase B')
  })

  it('completa el nivel con if, elif y else', () => {
    const gate = createGate('A')
    const result = run(solution, createGateApi(gate))
    const outcome = judgeGate(gate, solution)

    expect(result.error).toBeUndefined()
    expect(gate.door).toBe('grande')
    expect(outcome.complete).toBe(true)
    expect(outcome.steps[0]).toMatchObject({
      kind: 'gate',
      visitors: [
        { pass: 'A', door: 'grande' },
        { pass: 'B', door: 'pequeña' },
        { pass: 'C', door: 'sin entrada' },
      ],
    })
  })
})
