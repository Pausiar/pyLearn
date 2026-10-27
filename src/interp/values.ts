/**
 * Valores en tiempo de ejecución: cómo se muestran, qué es verdadero y cómo se
 * combinan. Todo lo que Python hace con los tipos vive aquí, no en el evaluador,
 * para que el comportamiento sea el mismo en cualquier sentencia.
 */
import type { Statement } from './ast'
import { ProgramError } from './errors'
import type { Scope } from './scope'
import type { Scalar } from './types'

export interface RangeValue {
  readonly kind: 'range'
  start: number
  stop: number
  step: number
}

export interface FunctionValue {
  readonly kind: 'function'
  name: string
  params: string[]
  /** Valor por defecto de cada parámetro; `undefined` cuando es obligatorio. */
  defaults: (RuntimeValue | undefined)[]
  body: Statement[]
  scope: Scope
}

/** Una lista de Python: se cambia en el sitio, como la de verdad. */
export interface ListValue {
  readonly kind: 'list'
  items: RuntimeValue[]
}

/** Una pareja clave-valor, con la clave tal y como se escribió. */
export interface DictEntry {
  key: RuntimeValue
  value: RuntimeValue
}

/** Un diccionario: recuerda el orden en que se añaden las claves, como Python. */
export interface DictValue {
  readonly kind: 'dict'
  entries: Map<string, DictEntry>
}

/** Una tupla: como una lista, pero no se puede cambiar. */
export interface TupleValue {
  readonly kind: 'tuple'
  items: RuntimeValue[]
}

/** Un conjunto: valores únicos y sin orden. */
export interface SetValue {
  readonly kind: 'set'
  items: RuntimeValue[]
}

/** Una función escrita en JavaScript para un módulo: random, math. */
export type NativeFunction = (args: RuntimeValue[], line: number) => RuntimeValue

/** Un módulo con sus funciones y sus constantes. */
export interface ModuleValue {
  readonly kind: 'module'
  name: string
  members: Map<string, RuntimeValue>
  functions: Map<string, NativeFunction>
}

/** Un archivo abierto: vive en la memoria del intérprete, sin tocar el disco. */
export interface FileValue {
  readonly kind: 'file'
  name: string
  mode: 'r' | 'w'
  /** Lo que se ha escrito; en modo lectura no se cambia. */
  content: string
  closed: boolean
  /** Los archivos del programa: los comparten todos los open(). */
  store: Map<string, string>
}

/** Una clase con sus métodos, sus atributos de clase y su clase madre. */
export interface ClassValue {
  readonly kind: 'class'
  name: string
  base: ClassValue | null
  methods: Map<string, FunctionValue>
  attributes: Map<string, RuntimeValue>
}

/** Un objeto de una clase: sus atributos propios, los que da __init__. */
export interface InstanceValue {
  readonly kind: 'instance'
  klass: ClassValue
  attributes: Map<string, RuntimeValue>
}

/** Lo que devuelve super(): la clase madre y el objeto que la llama. */
export interface SuperValue {
  readonly kind: 'super'
  klass: ClassValue
  instance: InstanceValue
}

export type RuntimeValue =
  | Scalar
  | RangeValue
  | FunctionValue
  | ListValue
  | DictValue
  | TupleValue
  | SetValue
  | ModuleValue
  | FileValue
  | ClassValue
  | InstanceValue
  | SuperValue

export function isRange(value: RuntimeValue): value is RangeValue {
  return typeof value === 'object' && value !== null && value.kind === 'range'
}

export function isList(value: RuntimeValue): value is ListValue {
  return typeof value === 'object' && value !== null && value.kind === 'list'
}

export function isDict(value: RuntimeValue): value is DictValue {
  return typeof value === 'object' && value !== null && value.kind === 'dict'
}

export function isTuple(value: RuntimeValue): value is TupleValue {
  return typeof value === 'object' && value !== null && value.kind === 'tuple'
}

export function isSet(value: RuntimeValue): value is SetValue {
  return typeof value === 'object' && value !== null && value.kind === 'set'
}

export function isModule(value: RuntimeValue): value is ModuleValue {
  return typeof value === 'object' && value !== null && value.kind === 'module'
}

export function isFile(value: RuntimeValue): value is FileValue {
  return typeof value === 'object' && value !== null && value.kind === 'file'
}

export function isClass(value: RuntimeValue): value is ClassValue {
  return typeof value === 'object' && value !== null && value.kind === 'class'
}

export function isInstance(value: RuntimeValue): value is InstanceValue {
  return typeof value === 'object' && value !== null && value.kind === 'instance'
}

export function isSuper(value: RuntimeValue): value is SuperValue {
  return typeof value === 'object' && value !== null && value.kind === 'super'
}

export function isFunction(value: RuntimeValue): value is FunctionValue {
  return typeof value === 'object' && value !== null && value.kind === 'function'
}

/** Cómo se llama un tipo en los mensajes de error. */
export function describeType(value: RuntimeValue): string {
  if (value === null) return 'nada (None)'
  if (typeof value === 'number') return 'un número'
  if (typeof value === 'string') return 'un texto'
  if (typeof value === 'boolean') return 'un booleano'
  if (isRange(value)) return 'un range'
  if (isList(value)) return 'una lista'
  if (isDict(value)) return 'un diccionario'
  if (isTuple(value)) return 'una tupla'
  if (isSet(value)) return 'un conjunto'
  if (isModule(value)) return `el módulo ${value.name}`
  if (isFile(value)) return 'un archivo'
  if (isClass(value)) return `la clase ${value.name}`
  if (isInstance(value)) return `un objeto de ${value.klass.name}`
  if (isSuper(value)) return 'super()'
  return 'una función'
}

/**
 * Clave canónica de un valor que puede ser clave de diccionario: números,
 * textos, booleanos, None y tuplas de esos valores. Devuelve null si no vale.
 */
export function dictKey(value: RuntimeValue): string | null {
  if (value === null) return 'x'
  if (typeof value === 'number') return `n:${value}`
  if (typeof value === 'string') return `s:${value}`
  if (typeof value === 'boolean') return `b:${value}`
  if (isTuple(value)) {
    const parts = value.items.map((item) => dictKey(item))
    if (parts.some((part) => part === null)) return null
    return `t:(${parts.join('|')})`
  }
  return null
}

const UNHASHABLE = 'Las claves de un diccionario tienen que ser números, textos, booleanos o tuplas'

/** Comprueba que un valor puede ser clave y devuelve su clave canónica. */
export function requireKey(value: RuntimeValue, line: number): string {
  const key = dictKey(value)
  if (key === null) throw new ProgramError(line, UNHASHABLE)
  return key
}

/** Las líneas de un archivo, cada una con su salto de línea, como en Python. */
export function linesOf(content: string): string[] {
  const lines = content.split('\n')
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  return lines.map((line) => `${line}\n`)
}

/** Elementos de cualquier cosa que se pueda recorrer, en orden. */
export function iterableItems(value: RuntimeValue, line: number, name: string): RuntimeValue[] {
  if (isList(value) || isTuple(value) || isSet(value)) return [...value.items]
  if (isDict(value)) return [...value.entries.values()].map((entry) => entry.key)

  if (isRange(value)) {
    const items: number[] = []
    if (value.step > 0) {
      for (let index = value.start; index < value.stop; index += value.step) items.push(index)
    } else {
      for (let index = value.start; index > value.stop; index += value.step) items.push(index)
    }
    return items
  }

  if (typeof value === 'string') return [...value]

  throw new ProgramError(
    line,
    `${name}() necesita algo que se pueda recorrer y ha recibido ${describeType(value)}`,
  )
}

/** Quita los valores repetidos, comparando por dentro como Python. */
export function uniqueItems(items: readonly RuntimeValue[]): RuntimeValue[] {
  const unique: RuntimeValue[] = []
  for (const item of items) {
    if (!unique.some((other) => deepEqual(other, item))) unique.push(item)
  }
  return unique
}

export function truthy(value: RuntimeValue): boolean {
  if (value === null) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0 && !Number.isNaN(value)
  if (typeof value === 'string') return value.length > 0
  if (isList(value) || isTuple(value) || isSet(value)) return value.items.length > 0
  if (isDict(value)) return value.entries.size > 0
  return true
}

function formatNumber(value: number): string {
  if (Number.isNaN(value)) return 'nan'
  if (!Number.isFinite(value)) return value > 0 ? 'inf' : '-inf'
  if (Number.isInteger(value)) return String(value)
  return String(Number(value.toFixed(12)))
}

/** Texto que se ve con print(): el mismo `repr` de los valores simples de Python. */
export function display(value: RuntimeValue): string {
  if (value === null) return 'None'
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (typeof value === 'number') return formatNumber(value)
  if (typeof value === 'string') return value
  if (isRange(value)) {
    const extra = value.step === 1 ? '' : `, ${value.step}`
    return `range(${value.start}, ${value.stop}${extra})`
  }
  if (isList(value)) return `[${value.items.map((item) => repr(item)).join(', ')}]`
  if (isDict(value)) {
    const pairs = [...value.entries.values()].map(
      (entry) => `${repr(entry.key)}: ${repr(entry.value)}`,
    )
    return `{${pairs.join(', ')}}`
  }
  if (isTuple(value)) {
    const inner = value.items.map((item) => repr(item)).join(', ')
    return value.items.length === 1 ? `(${inner},)` : `(${inner})`
  }
  if (isSet(value)) {
    if (value.items.length === 0) return 'set()'
    return `{${value.items.map((item) => repr(item)).join(', ')}}`
  }
  if (isModule(value)) return `<módulo ${value.name}>`
  if (isFile(value)) return `<archivo ${value.name}>`
  if (isClass(value)) return `<class '${value.name}'>`
  if (isInstance(value)) return `<${value.klass.name}>`
  if (isSuper(value)) return '<super>'
  return `<función ${value.name}>`
}

/** Cómo se escribe un valor dentro de otro: los textos van entre comillas. */
export function repr(value: RuntimeValue): string {
  if (typeof value === 'string') {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  }
  return display(value)
}

/** Igualdad de Python: los contenedores se comparan por dentro, no por referencia. */
export function deepEqual(left: RuntimeValue, right: RuntimeValue): boolean {
  if (isList(left) && isList(right)) {
    return (
      left.items.length === right.items.length &&
      left.items.every((item, index) => deepEqual(item, right.items[index]!))
    )
  }

  if (isTuple(left) && isTuple(right)) {
    return (
      left.items.length === right.items.length &&
      left.items.every((item, index) => deepEqual(item, right.items[index]!))
    )
  }

  if (isDict(left) && isDict(right)) {
    if (left.entries.size !== right.entries.size) return false
    for (const [key, entry] of left.entries) {
      const other = right.entries.get(key)
      if (!other || !deepEqual(entry.value, other.value)) return false
    }
    return true
  }

  if (isSet(left) && isSet(right)) {
    return (
      left.items.length === right.items.length &&
      left.items.every((item) => right.items.some((other) => deepEqual(item, other)))
    )
  }

  return left === right
}

/** Módulo con el signo de Python: -1 % 3 es 2, no -1. */
function pythonMod(left: number, right: number): number {
  return ((left % right) + right) % right
}

function divideByZero(line: number): never {
  throw new ProgramError(line, 'No se puede dividir entre cero', 'ZeroDivisionError')
}

/** Repetir una lista, como [0] * 3. */
function repeatList(list: ListValue, times: number): ListValue {
  const items: RuntimeValue[] = []
  for (let index = 0; index < Math.max(0, Math.floor(times)); index += 1) items.push(...list.items)
  return { kind: 'list', items }
}

export function binaryOp(
  op: string,
  left: RuntimeValue,
  right: RuntimeValue,
  line: number,
): RuntimeValue {
  if (op === '+' || op === '*') {
    const numberPair = typeof left === 'number' && typeof right === 'number'
    if (numberPair) return op === '+' ? left + right : left * right

    const textPair = typeof left === 'string' && typeof right === 'string'
    if (op === '+' && textPair) return left + right

    if (op === '+' && isList(left) && isList(right)) {
      return { kind: 'list', items: [...left.items, ...right.items] } satisfies ListValue
    }

    if (op === '+' && isTuple(left) && isTuple(right)) {
      return { kind: 'tuple', items: [...left.items, ...right.items] } satisfies TupleValue
    }

    if (op === '*' && isList(left) && typeof right === 'number') return repeatList(left, right)
    if (op === '*' && typeof left === 'number' && isList(right)) return repeatList(right, left)

    if (op === '*') {
      if (typeof left === 'string' && typeof right === 'number') {
        return left.repeat(Math.max(0, Math.floor(right)))
      }
      if (typeof left === 'number' && typeof right === 'string') {
        return right.repeat(Math.max(0, Math.floor(left)))
      }
    }

    if (typeof left === 'string' || typeof right === 'string') {
      if (op === '+') {
        throw new ProgramError(
          line,
          'No puedo unir un texto con un número. Usa str() para convertir el número en texto',
        )
      }
      throw new ProgramError(line, `No puedo usar «${op}» con texto. Para unir textos usa +`)
    }

    throw new ProgramError(
      line,
      `No puedo usar «${op}» con ${describeType(left)} y ${describeType(right)}`,
    )
  }

  if (typeof left !== 'number' || typeof right !== 'number') {
    throw new ProgramError(
      line,
      `No puedo usar «${op}» con ${describeType(left)} y ${describeType(right)}`,
    )
  }

  switch (op) {
    case '-':
      return left - right
    case '/':
      if (right === 0) divideByZero(line)
      return left / right
    case '//':
      if (right === 0) divideByZero(line)
      return Math.floor(left / right)
    case '%':
      if (right === 0) divideByZero(line)
      return pythonMod(left, right)
    case '**':
      if (left === 0 && right < 0) divideByZero(line)
      return left ** right
    default:
      throw new ProgramError(line, `No entiendo el operador «${op}»`)
  }
}

export function unaryOp(op: string, operand: RuntimeValue, line: number): RuntimeValue {
  if (op === 'not') return !truthy(operand)

  if (typeof operand !== 'number') {
    throw new ProgramError(line, `No puedo usar «${op}» con ${describeType(operand)}`)
  }

  return op === '-' ? -operand : operand
}

export function compare(
  op: string,
  left: RuntimeValue,
  right: RuntimeValue,
  line: number,
): boolean {
  if (op === '==') return deepEqual(left, right)
  if (op === '!=') return !deepEqual(left, right)

  if (op === 'in') {
    if (isList(right) || isTuple(right)) {
      return right.items.some((item) => deepEqual(item, left))
    }
    if (isSet(right)) {
      return right.items.some((item) => deepEqual(item, left))
    }
    if (isDict(right)) {
      const key = dictKey(left)
      return key !== null && right.entries.has(key)
    }
    if (typeof right === 'string' && typeof left === 'string') return right.includes(left)
    throw new ProgramError(
      line,
      `No puedo buscar dentro de ${describeType(right)}: «in» funciona con listas, tuplas, conjuntos, diccionarios y textos`,
    )
  }

  if (typeof left === 'number' && typeof right === 'number') {
    switch (op) {
      case '<':
        return left < right
      case '>':
        return left > right
      case '<=':
        return left <= right
      case '>=':
        return left >= right
    }
  }

  if (typeof left === 'string' && typeof right === 'string') {
    switch (op) {
      case '<':
        return left < right
      case '>':
        return left > right
      case '<=':
        return left <= right
      case '>=':
        return left >= right
    }
  }

  if (!['<', '>', '<=', '>='].includes(op)) {
    throw new ProgramError(line, `No entiendo la comparación «${op}»`)
  }

  throw new ProgramError(line, `No puedo comparar ${describeType(left)} con ${describeType(right)}`)
}

/** Cuántos elementos tiene un rango, sin materializarlo. */
export function rangeLength(range: RangeValue): number {
  if (range.step > 0) return Math.max(0, Math.ceil((range.stop - range.start) / range.step))
  return Math.max(0, Math.ceil((range.start - range.stop) / -range.step))
}
