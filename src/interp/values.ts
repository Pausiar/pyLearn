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
  body: Statement[]
  scope: Scope
}

export type RuntimeValue = Scalar | RangeValue | FunctionValue

export function isRange(value: RuntimeValue): value is RangeValue {
  return typeof value === 'object' && value !== null && value.kind === 'range'
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
  return 'una función'
}

export function truthy(value: RuntimeValue): boolean {
  if (value === null) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0 && !Number.isNaN(value)
  if (typeof value === 'string') return value.length > 0
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
  return `<función ${value.name}>`
}

/** Módulo con el signo de Python: -1 % 3 es 2, no -1. */
function pythonMod(left: number, right: number): number {
  return ((left % right) + right) % right
}

function divideByZero(line: number): never {
  throw new ProgramError(line, 'No se puede dividir entre cero')
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
  if (op === '==') return left === right
  if (op === '!=') return left !== right

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
