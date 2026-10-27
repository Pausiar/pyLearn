/**
 * Funciones propias de Python disponibles en todos los niveles: print, range,
 * len, int, str, float, bool, abs, round, min y max.
 *
 * Son deliberadamente pocas y con mensajes en español: lo que un nivel necesita
 * lo añade su propia API, no esta lista.
 */
import { ProgramError } from './errors'
import type { Scalar } from './types'
import {
  describeType,
  display,
  isDict,
  isList,
  isRange,
  isSet,
  isTuple,
  iterableItems,
  rangeLength,
  truthy,
  uniqueItems,
  type RuntimeValue,
} from './values'

export interface BuiltinContext {
  print(text: string): void
  /** Los archivos que el programa tiene abiertos, en memoria. */
  files: Map<string, string>
}

export type Builtin = (args: RuntimeValue[], line: number, context: BuiltinContext) => RuntimeValue

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

function asScalar(value: RuntimeValue, line: number, name: string): Scalar {
  if (value !== null && typeof value === 'object') {
    throw new ProgramError(line, `${name}() no acepta ${describeType(value)}`)
  }
  return value
}

function makeRange(args: RuntimeValue[], line: number): RuntimeValue {
  expectCount(args, line, 'range', 1, 3)
  const numbers = args.map((arg) => asNumber(arg, line, 'range'))
  for (const number of numbers) {
    if (!Number.isInteger(number)) {
      throw new ProgramError(line, 'range() necesita números enteros, sin decimales')
    }
  }

  const [first, second, third] = numbers
  const start = numbers.length === 1 ? 0 : (first ?? 0)
  const stop = numbers.length === 1 ? (first ?? 0) : (second ?? 0)
  const step = third ?? 1

  if (step === 0) throw new ProgramError(line, 'range() no puede ir de 0 en 0')
  return { kind: 'range', start, stop, step }
}

function toNumber(value: RuntimeValue, line: number, name: string): number {
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'string') {
    const parsed = Number(value.trim())
    if (value.trim() === '' || Number.isNaN(parsed)) {
      throw new ProgramError(line, `${name}() no entiende «${value}» como número`, 'ValueError')
    }
    return parsed
  }
  throw new ProgramError(line, `${name}() no acepta ${describeType(value)}`)
}

const BUILTIN_LIST: [string, Builtin][] = [
  [
    'print',
    (args, _line, context) => {
      context.print(args.map((arg) => display(arg)).join(' '))
      return null
    },
  ],
  ['range', (args, line) => makeRange(args, line)],
  [
    'len',
    (args, line) => {
      expectCount(args, line, 'len', 1, 1)
      const value = args[0]!
      if (typeof value === 'string') return value.length
      if (isRange(value)) return rangeLength(value)
      if (isList(value) || isTuple(value) || isSet(value)) return value.items.length
      if (isDict(value)) return value.entries.size
      throw new ProgramError(
        line,
        `len() necesita un texto, un range, una lista, una tupla, un conjunto o un diccionario y ha recibido ${describeType(value)}`,
      )
    },
  ],
  [
    'int',
    (args, line) => {
      expectCount(args, line, 'int', 1, 1)
      return Math.trunc(toNumber(args[0]!, line, 'int'))
    },
  ],
  [
    'float',
    (args, line) => {
      expectCount(args, line, 'float', 1, 1)
      return toNumber(args[0]!, line, 'float')
    },
  ],
  [
    'str',
    (args, line) => {
      expectCount(args, line, 'str', 1, 1)
      return display(args[0]!)
    },
  ],
  [
    'bool',
    (args, line) => {
      expectCount(args, line, 'bool', 1, 1)
      return truthy(args[0]!)
    },
  ],
  [
    'abs',
    (args, line) => {
      expectCount(args, line, 'abs', 1, 1)
      return Math.abs(asNumber(args[0]!, line, 'abs'))
    },
  ],
  [
    'round',
    (args, line) => {
      expectCount(args, line, 'round', 1, 2)
      const value = asNumber(args[0]!, line, 'round')
      const digits = args.length === 2 ? Math.trunc(asNumber(args[1]!, line, 'round')) : 0
      const factor = 10 ** digits
      return Math.round(value * factor) / factor
    },
  ],
  [
    'min',
    (args, line) => {
      expectCount(args, line, 'min', 1, 10)
      return pick(args, line, 'min', false)
    },
  ],
  [
    'max',
    (args, line) => {
      expectCount(args, line, 'max', 1, 10)
      return pick(args, line, 'max', true)
    },
  ],
  [
    'list',
    (args, line) => {
      expectCount(args, line, 'list', 0, 1)
      if (args.length === 0) return { kind: 'list', items: [] }
      return { kind: 'list', items: iterableItems(args[0]!, line, 'list') }
    },
  ],
  [
    'tuple',
    (args, line) => {
      expectCount(args, line, 'tuple', 0, 1)
      if (args.length === 0) return { kind: 'tuple', items: [] }
      return { kind: 'tuple', items: iterableItems(args[0]!, line, 'tuple') }
    },
  ],
  [
    'set',
    (args, line) => {
      expectCount(args, line, 'set', 0, 1)
      if (args.length === 0) return { kind: 'set', items: [] }
      return { kind: 'set', items: uniqueItems(iterableItems(args[0]!, line, 'set')) }
    },
  ],
  [
    'sorted',
    (args, line) => {
      expectCount(args, line, 'sorted', 1, 1)
      const items = iterableItems(args[0]!, line, 'sorted')
      if (items.length === 0) return { kind: 'list', items: [] }

      const numbers = items.every((item) => typeof item === 'number')
      const texts = items.every((item) => typeof item === 'string')
      if (!numbers && !texts) {
        throw new ProgramError(line, 'sorted() solo ordena números o textos, sin mezclarlos')
      }

      const ordered = [...items]
      ordered.sort((left, right) => {
        if (typeof left === 'number' && typeof right === 'number') return left - right
        if (typeof left === 'string' && typeof right === 'string') return left < right ? -1 : 1
        return 0
      })
      return { kind: 'list', items: ordered }
    },
  ],
  [
    'sum',
    (args, line) => {
      expectCount(args, line, 'sum', 1, 1)
      let total = 0
      for (const item of iterableItems(args[0]!, line, 'sum')) {
        if (typeof item !== 'number') {
          throw new ProgramError(line, 'sum() solo suma números')
        }
        total += item
      }
      return total
    },
  ],
  [
    'open',
    (args, line, context) => {
      expectCount(args, line, 'open', 1, 2)
      const name = args[0]
      if (typeof name !== 'string') {
        throw new ProgramError(
          line,
          `open() necesita el nombre del archivo entre comillas y ha recibido ${describeType(name)}`,
        )
      }

      const mode = args.length === 2 ? args[1] : 'r'
      if (typeof mode !== 'string' || (mode !== 'r' && mode !== 'w')) {
        throw new ProgramError(line, 'open() solo entiende "r" para leer y "w" para escribir')
      }

      if (mode === 'r' && !context.files.has(name)) {
        throw new ProgramError(
          line,
          `No existe el archivo «${name}»: créalo con open("${name}", "w")`,
          'FileNotFoundError',
        )
      }

      if (mode === 'w') context.files.set(name, '')

      return { kind: 'file', name, mode, content: '', closed: false, store: context.files }
    },
  ],
]

function pick(args: RuntimeValue[], line: number, name: string, wantMax: boolean): RuntimeValue {
  const values = args.map((arg) => asScalar(arg, line, name))
  const mixed = values.some((value) => typeof value === 'number') && values.some((value) => typeof value === 'string')

  if (mixed) throw new ProgramError(line, `${name}() no puede comparar un número con un texto`)

  if (values.every((value) => typeof value === 'number')) {
    const numbers = values as number[]
    let best = numbers[0]!
    for (const value of numbers.slice(1)) {
      if (wantMax ? value > best : value < best) best = value
    }
    return best
  }

  if (values.every((value) => typeof value === 'string')) {
    const texts = values as string[]
    let best = texts[0]!
    for (const value of texts.slice(1)) {
      if (wantMax ? value > best : value < best) best = value
    }
    return best
  }

  throw new ProgramError(line, `${name}() solo compara números o textos`)
}

export const BUILTINS = new Map<string, Builtin>(BUILTIN_LIST)
