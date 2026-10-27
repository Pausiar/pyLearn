import { describe, expect, it } from 'vitest'
import { run } from '../interp/run'
import { BRIDGE_LINES, createBridge, createBridgeApi, judgeBridge } from './bridge'
import { createDice, createDiceApi, expectedLines, expectedRolls, judgeDice } from './dice'
import { diaryContent, judgeDiary } from './diary'
import { judgePlague } from './plague'
import { createQuest, createQuestApi, expectedItem, judgeQuest, QUEST_ITEMS } from './quest'

const BRIDGE_CODE = [
  'puentes = ["norte", "sur", "este"]',
  'for puente in puentes:',
  '    try:',
  '        cruzar(puente)',
  '        print("Cruzado: " + puente)',
  '    except ValueError:',
  '        desvio(puente)',
  '        print("Desvío: " + puente)',
].join('\n')

const DICE_CODE = [
  'random.seed(7)',
  'tiradas = []',
  'for i in range(3):',
  '    tiradas.append(random.randint(1, 6))',
  'print(tiradas)',
  'print("Media: " + str(math.floor(sum(tiradas) / 3)))',
  'mesa(tiradas)',
].join('\n')

describe('nivel 31: el puente', () => {
  it('se completa con el try y el except', () => {
    const bridge = createBridge()
    const result = run(BRIDGE_CODE, createBridgeApi(bridge))

    expect(result.error).toBeUndefined()
    expect(judgeBridge(bridge, result.output).complete).toBe(true)
  })

  it('sin try, el puente cortado es un error de verdad', () => {
    const bridge = createBridge()
    const result = run('cruzar("sur")', createBridgeApi(bridge))

    expect(result.error?.message).toBe('El puente sur está cortado')
  })

  it('un except de otro tipo no lo recoge', () => {
    const bridge = createBridge()
    const code = ['try:', '    cruzar("sur")', 'except KeyError:', '    desvio("sur")'].join('\n')

    expect(run(code, createBridgeApi(bridge)).error?.message).toBe('El puente sur está cortado')
  })

  it('avisa si no se anuncia cada paso', () => {
    const bridge = createBridge()
    const code = [
      'for puente in ["norte", "sur", "este"]:',
      '    try:',
      '        cruzar(puente)',
      '    except ValueError:',
      '        desvio(puente)',
    ].join('\n')
    const result = run(code, createBridgeApi(bridge))

    expect(judgeBridge(bridge, result.output).missing).toContain(BRIDGE_LINES[0])
  })

  it('rechaza un puente que no está en la ruta', () => {
    const bridge = createBridge()

    expect(run('cruzar("oeste")', createBridgeApi(bridge)).error?.message).toContain(
      'no está en la ruta',
    )
  })
})

describe('nivel 32: los dados', () => {
  it('se completa con la semilla del nivel', () => {
    const dice = createDice()
    const result = run(DICE_CODE, createDiceApi(dice))

    expect(result.error).toBeUndefined()
    expect(result.output).toEqual(expectedLines())
    expect(judgeDice(dice, result.output).complete).toBe(true)
  })

  it('las tiradas del motor salen de la misma semilla del intérprete', () => {
    const rolls = expectedRolls()

    expect(rolls).toHaveLength(3)
    expect(rolls.every((roll) => roll >= 1 && roll <= 6)).toBe(true)
  })

  it('avisa si el programa no tira con la semilla', () => {
    const dice = createDice()
    const result = run(DICE_CODE.replace('random.seed(7)\n', ''), createDiceApi(dice))

    expect(judgeDice(dice, result.output).complete).toBe(false)
  })

  it('rechaza una entrega que no sea una lista', () => {
    const dice = createDice()

    expect(run('mesa(3)', createDiceApi(dice)).error?.message).toContain('espera la lista de tiradas')
  })
})

describe('nivel 33: el diario', () => {
  it('juzga el archivo que queda escrito', () => {
    const code = [
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
    ].join('\n')

    const result = run(code)

    expect(result.error).toBeUndefined()
    expect(diaryContent(result)).toContain('Día 1: despegue')
    expect(judgeDiary(result).complete).toBe(true)
  })

  it('avisa si no hay archivo', () => {
    const result = run('print("Día 1: despegue")\nprint("Día 2: órbita")\nprint("Día 3: vuelta")\nprint("Líneas: 3")')

    expect(judgeDiary(result).missing).toContain('diario.txt')
  })

  it('avisa si el diario lleva otras líneas', () => {
    const code = [
      'with open("diario.txt", "w") as diario:',
      '    diario.write("Día 1: despegue\\n")',
      'print("Día 1: despegue")',
      'print("Día 2: órbita")',
      'print("Día 3: vuelta")',
      'print("Líneas: 3")',
    ].join('\n')

    expect(judgeDiary(run(code)).missing).toContain('El diario tiene que llevar 3 líneas')
  })
})

describe('nivel 34: cazabichos', () => {
  const starter = [
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
  ].join('\n')

  const fixed = (code: string) =>
    code
      .replace('print("Zonas: " + str(zonas))', 'print("Zonas: " + str(len(zonas)))')
      .replace('for i in range(3):', 'for i in range(len(zonas)):')

  it('el primer fallo está en el recuento de zonas', () => {
    const result = run(starter)

    expect(result.error).toBeUndefined()
    expect(judgePlague(result.output).missing).toContain('len(zonas)')
  })

  it('avisa del bucle cuando ya se cuentan bien las zonas', () => {
    const code = starter.replace('print("Zonas: " + str(zonas))', 'print("Zonas: " + str(len(zonas)))')

    expect(judgePlague(run(code).output).missing).toContain('range(len(zonas))')
  })

  it('avisa de la comparación final', () => {
    expect(judgePlague(run(fixed(starter)).output).missing).toContain('la comparación del if')
  })

  it('el programa arreglado pasa', () => {
    expect(judgePlague(run(fixed(starter).replace('if bichos > 10:', 'if bichos > 6:')).output).complete).toBe(true)
  })
})

describe('nivel 35: la aventura de texto', () => {
  const MAP = 'salas = {"inicio": {"norte": "cueva"}, "cueva": {"sur": "inicio", "norte": "tesoro"}, "tesoro": {}}'
  const IR = ['def ir(sala, direccion):', '    return salas[sala].get(direccion, "nada")']

  it('se completa recorriendo el mapa', () => {
    const quest = createQuest()
    const code = [
      MAP,
      ...IR,
      'random.seed(3)',
      'print("Mochila: " + random.choice(["antorcha", "llave", "mapa"]))',
      'probar(ir)',
    ].join('\n')

    const result = run(code, createQuestApi(quest))

    expect(result.error).toBeUndefined()
    expect(result.output).toEqual([`Mochila: ${expectedItem()}`])
    expect(judgeQuest(quest, result.output).complete).toBe(true)
  })

  it('avisa si el objeto no es el de la semilla', () => {
    const quest = createQuest()
    const wrong = QUEST_ITEMS.find((item) => item !== expectedItem())!
    const code = [MAP, ...IR, `print("Mochila: ${wrong}")`, 'probar(ir)'].join('\n')

    const result = run(code, createQuestApi(quest))

    expect(judgeQuest(quest, result.output).missing).toContain(`Mochila: ${expectedItem()}`)
  })

  it('avisa si la función se equivoca de sala', () => {
    const quest = createQuest()
    const code = [
      'def ir(sala, direccion):',
      '    return "tesoro"',
      `print("Mochila: ${expectedItem()}")`,
      'probar(ir)',
    ].join('\n')

    const result = run(code, createQuestApi(quest))

    expect(judgeQuest(quest, result.output).missing).toContain('Desde inicio hacia el norte')
  })

  it('rechaza probar sin función', () => {
    const quest = createQuest()

    expect(run('probar(3)', createQuestApi(quest)).error?.message).toContain('necesita tu función')
  })

  it('avisa si el mayordomo no ha salido', () => {
    const quest = createQuest()
    const result = run(`print("Mochila: ${expectedItem()}")`, createQuestApi(quest))

    expect(judgeQuest(quest, result.output).missing).toContain('probar(ir)')
  })
})
