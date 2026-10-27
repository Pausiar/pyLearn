/**
 * Los módulos de la biblioteca estándar que PyLearn trae hechos: `random` con
 * azar reproducible y `math` con lo justo. Se crean uno por ejecución, así que
 * `random.seed()` de un programa no afecta a otro.
 */
import { ProgramError } from './errors'
import {
  describeType,
  isList,
  isSet,
  isTuple,
  type ModuleValue,
  type NativeFunction,
  type RuntimeValue,
} from './values'

/** Generador con semilla, pequeño y reproducible: sirve para el azar del juego. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function expectCount(args: RuntimeValue[], line: number, name: string, min: number, max: number): void {
  if (args.length >= min && args.length <= max) return
  const expected = min === max ? `${min}` : `${min} a ${max}`
  throw new ProgramError(line, `${name}() espera ${expected} valores y ha recibido ${args.length}`)
}

function asNumber(value: RuntimeValue, line: number, name: string): number {
  if (typeof value !== 'number') {
    throw new ProgramError(line, `${name}() necesita un número y ha recibido ${describeType(value)}`)
  }
  return value
}

function asInteger(value: RuntimeValue, line: number, name: string): number {
  const number = asNumber(value, line, name)
  if (!Number.isInteger(number)) {
    throw new ProgramError(line, `${name}() necesita un número entero, sin decimales`)
  }
  return number
}

/** `random`: semilla, entero al azar y elegir un elemento. */
export function createRandomModule(): ModuleValue {
  let source = mulberry32(1)

  const functions = new Map<string, NativeFunction>([
    [
      'seed',
      (args, line) => {
        expectCount(args, line, 'seed', 1, 1)
        source = mulberry32(asInteger(args[0]!, line, 'seed'))
        return null
      },
    ],
    [
      'randint',
      (args, line) => {
        expectCount(args, line, 'randint', 2, 2)
        const start = asInteger(args[0]!, line, 'randint')
        const end = asInteger(args[1]!, line, 'randint')
        if (end < start) {
          throw new ProgramError(line, 'randint() necesita el número menor primero')
        }
        return start + Math.floor(source() * (end - start + 1))
      },
    ],
    [
      'choice',
      (args, line) => {
        expectCount(args, line, 'choice', 1, 1)
        const value = args[0]!
        const items =
          isList(value) || isTuple(value) || isSet(value)
            ? [...value.items]
            : typeof value === 'string'
              ? [...value]
              : null

        if (items === null || items.length === 0) {
          throw new ProgramError(
            line,
            `choice() necesita una lista con algo dentro y ha recibido ${describeType(value)}`,
          )
        }
        return items[Math.floor(source() * items.length)]!
      },
    ],
  ])

  return { kind: 'module', name: 'random', members: new Map(), functions }
}

/** `math`: la raíz, el redondeo hacia abajo y hacia arriba, y el número pi. */
export function createMathModule(): ModuleValue {
  const functions = new Map<string, NativeFunction>([
    [
      'sqrt',
      (args, line) => {
        expectCount(args, line, 'sqrt', 1, 1)
        const value = asNumber(args[0]!, line, 'sqrt')
        if (value < 0) throw new ProgramError(line, 'sqrt() no puede con un número negativo')
        return Math.sqrt(value)
      },
    ],
    [
      'floor',
      (args, line) => {
        expectCount(args, line, 'floor', 1, 1)
        return Math.floor(asNumber(args[0]!, line, 'floor'))
      },
    ],
    [
      'ceil',
      (args, line) => {
        expectCount(args, line, 'ceil', 1, 1)
        return Math.ceil(asNumber(args[0]!, line, 'ceil'))
      },
    ],
  ])

  return {
    kind: 'module',
    name: 'math',
    members: new Map<string, RuntimeValue>([['pi', Math.PI]]),
    functions,
  }
}
