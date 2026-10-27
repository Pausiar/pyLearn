/**
 * Evaluador: recorre el AST y ejecuta. Sin `eval` ni `new Function`: el código
 * del alumno nunca se convierte en JavaScript ejecutable.
 *
 * Dos topes protegen la pestaña de un bucle infinito o de una recursión sin
 * fondo: `STEP_LIMIT` sentencias y `CALL_LIMIT` llamadas anidadas.
 */
import type { Expression, Statement } from './ast'
import { BUILTINS, type BuiltinContext } from './builtins'
import { ProgramError } from './errors'
import { Scope } from './scope'
import { ApiError, type Api, type Value } from './types'
import {
  binaryOp,
  compare,
  deepEqual,
  describeType,
  isFunction,
  isList,
  isRange,
  repr,
  truthy,
  unaryOp,
  type FunctionValue,
  type ListValue,
  type RuntimeValue,
} from './values'

export const STEP_LIMIT = 20_000
export const CALL_LIMIT = 200

type Flow =
  | { kind: 'normal' }
  | { kind: 'break' }
  | { kind: 'continue' }
  | { kind: 'return'; value: RuntimeValue }

const NORMAL: Flow = { kind: 'normal' }

function *iterate(value: RuntimeValue, line: number): Generator<RuntimeValue> {
  if (isRange(value)) {
    if (value.step > 0) {
      for (let index = value.start; index < value.stop; index += value.step) yield index
    } else {
      for (let index = value.start; index > value.stop; index += value.step) yield index
    }
    return
  }

  if (isList(value)) {
    for (const item of [...value.items]) yield item
    return
  }

  if (typeof value === 'string') {
    for (const character of value) yield character
    return
  }

  throw new ProgramError(
    line,
    `Solo puedo recorrer una lista, un range o un texto, y he recibido ${describeType(value)}`,
  )
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

/**
 * Nombres que el cuerpo de una función asigna. En Python son locales desde el
 * principio: leerlos antes de darles valor es un error, aunque existan fuera.
 */
function localNames(statements: Statement[], names: Set<string> = new Set()): Set<string> {
  for (const statement of statements) {
    switch (statement.type) {
      case 'assign':
        statement.targets.forEach((target) => names.add(target))
        break
      case 'augassign':
        names.add(statement.target)
        break
      case 'for':
        names.add(statement.target)
        localNames(statement.body, names)
        break
      case 'def':
        names.add(statement.name)
        break
      case 'if':
        statement.branches.forEach((branch) => localNames(branch.body, names))
        localNames(statement.orelse, names)
        break
      case 'while':
        localNames(statement.body, names)
        break
      default:
        break
    }
  }
  return names
}

export class Interpreter {
  private steps = 0
  private depth = 0
  private readonly output: string[] = []
  private readonly global = new Scope()
  private readonly context: BuiltinContext

  constructor(private readonly api: Api) {
    this.context = {
      print: (text) => {
        this.output.push(text)
      },
    }
  }

  /** Lo que se ha impreso hasta ahora, también cuando el programa falla a medias. */
  get printed(): string[] {
    return this.output
  }

  execute(program: Statement[]): void {
    this.runBlock(program, this.global)
  }

  private runBlock(statements: Statement[], scope: Scope): Flow {
    for (const statement of statements) {
      const flow = this.runStatement(statement, scope)
      if (flow.kind !== 'normal') return flow
    }
    return NORMAL
  }

  private tick(line: number): void {
    this.steps += 1
    if (this.steps > STEP_LIMIT) {
      throw new ProgramError(line, 'Demasiados pasos: puede que haya un bucle infinito')
    }
  }

  private runStatement(statement: Statement, scope: Scope): Flow {
    this.tick(statement.line)

    switch (statement.type) {
      case 'pass':
        return NORMAL

      case 'break':
        return { kind: 'break' }

      case 'continue':
        return { kind: 'continue' }

      case 'expr':
        this.evaluate(statement.expression, scope)
        return NORMAL

      case 'assign': {
        const value = this.evaluate(statement.value, scope)
        for (const target of statement.targets) scope.define(target, value)
        return NORMAL
      }

      case 'setitem': {
        const target = this.evaluate(statement.target, scope)
        if (!isList(target)) {
          throw new ProgramError(
            statement.line,
            `Solo puedo cambiar una posición de una lista, y esto es ${describeType(target)}`,
          )
        }

        const index = this.position(statement.index, target.items.length, scope, statement.line)
        target.items[index] = this.evaluate(statement.value, scope)
        return NORMAL
      }

      case 'augassign': {
        const current = scope.lookup(statement.target)
        if (current === undefined) throw this.undeclared(statement.target, scope, statement.line)
        const value = this.evaluate(statement.value, scope)
        scope.define(statement.target, binaryOp(statement.op, current, value, statement.line))
        return NORMAL
      }

      case 'if': {
        for (const branch of statement.branches) {
          if (truthy(this.evaluate(branch.test, scope))) return this.runBlock(branch.body, scope)
        }
        return this.runBlock(statement.orelse, scope)
      }

      case 'while': {
        while (truthy(this.evaluate(statement.test, scope))) {
          const flow = this.runBlock(statement.body, scope)
          if (flow.kind === 'break') break
          if (flow.kind === 'return') return flow
        }
        return NORMAL
      }

      case 'for': {
        const iterable = this.evaluate(statement.iterable, scope)
        for (const item of iterate(iterable, statement.line)) {
          scope.define(statement.target, item)
          const flow = this.runBlock(statement.body, scope)
          if (flow.kind === 'break') break
          if (flow.kind === 'return') return flow
        }
        return NORMAL
      }

      case 'def': {
        const fn: FunctionValue = {
          kind: 'function',
          name: statement.name,
          params: statement.params.map((param) => param.name),
          // Los valores por defecto se calculan al definir la función, como en Python.
          defaults: statement.params.map((param) =>
            param.default === null ? undefined : this.evaluate(param.default, scope),
          ),
          body: statement.body,
          scope,
        }
        scope.define(statement.name, fn)
        return NORMAL
      }

      case 'return':
        return {
          kind: 'return',
          value: statement.value === null ? null : this.evaluate(statement.value, scope),
        }

      default:
        return NORMAL
    }
  }

  private evaluate(expression: Expression, scope: Scope): RuntimeValue {
    switch (expression.type) {
      case 'constant':
        return expression.value

      case 'name': {
        const value = scope.lookup(expression.name)
        if (value === undefined) throw this.undeclared(expression.name, scope, expression.line)
        return value
      }

      case 'binop':
        return binaryOp(
          expression.op,
          this.evaluate(expression.left, scope),
          this.evaluate(expression.right, scope),
          expression.line,
        )

      case 'unary':
        return unaryOp(expression.op, this.evaluate(expression.operand, scope), expression.line)

      case 'boolop': {
        const left = this.evaluate(expression.left, scope)
        if (expression.op === 'and') return truthy(left) ? this.evaluate(expression.right, scope) : left
        return truthy(left) ? left : this.evaluate(expression.right, scope)
      }

      case 'compare': {
        let left = this.evaluate(expression.left, scope)

        for (let index = 0; index < expression.ops.length; index += 1) {
          const right = this.evaluate(expression.comparators[index]!, scope)
          if (!compare(expression.ops[index]!, left, right, expression.line)) return false
          left = right
        }

        return true
      }

      case 'call':
        return this.call(expression, scope)

      case 'list':
        return { kind: 'list', items: expression.items.map((item) => this.evaluate(item, scope)) }

      case 'subscript':
        return this.subscript(expression, scope)

      case 'method': {
        const target = this.evaluate(expression.target, scope)
        if (!isList(target)) {
          throw new ProgramError(
            expression.line,
            `Solo las listas tienen métodos, y esto es ${describeType(target)}`,
          )
        }

        const args = expression.args.map((arg) => this.evaluate(arg, scope))
        return this.listMethod(target, expression.name, args, expression.line)
      }
    }
  }

  /** Posición de una lista o un texto, con los números negativos desde el final. */
  private checkedIndex(value: RuntimeValue, length: number, line: number): number {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      throw new ProgramError(line, 'La posición tiene que ser un número entero')
    }

    const index = value < 0 ? length + value : value
    if (index < 0 || index >= length) {
      throw new ProgramError(
        line,
        `Ahí hay ${plural(length, 'elemento', 'elementos')}: la posición ${value} no existe`,
      )
    }
    return index
  }

  private position(expression: Expression, length: number, scope: Scope, line: number): number {
    return this.checkedIndex(this.evaluate(expression, scope), length, line)
  }

  /** Un extremo de rebanada: se recorta a los límites, como en Python. */
  private cut(expression: Expression, length: number, scope: Scope): number {
    const value = this.evaluate(expression, scope)
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      throw new ProgramError(expression.line, 'Las rebanadas se cortan con números enteros')
    }

    const index = value < 0 ? length + value : value
    return Math.min(Math.max(index, 0), length)
  }

  private subscript(
    expression: Extract<Expression, { type: 'subscript' }>,
    scope: Scope,
  ): RuntimeValue {
    const target = this.evaluate(expression.target, scope)
    const items: RuntimeValue[] | null = isList(target)
      ? target.items
      : typeof target === 'string'
        ? [...target]
        : null

    if (items === null) {
      throw new ProgramError(
        expression.line,
        `No puedo sacar una posición de ${describeType(target)}`,
      )
    }

    if (!expression.slice) {
      if (expression.index === null) {
        throw new ProgramError(expression.line, 'Dentro de los corchetes falta la posición')
      }
      return items[this.position(expression.index, items.length, scope, expression.line)] ?? null
    }

    const start = expression.index === null ? 0 : this.cut(expression.index, items.length, scope)
    const end =
      expression.end === null ? items.length : this.cut(expression.end, items.length, scope)
    const pieces = items.slice(start, Math.max(start, end))

    if (isList(target)) return { kind: 'list', items: pieces }
    return pieces.join('')
  }

  private listMethod(
    list: ListValue,
    name: string,
    args: RuntimeValue[],
    line: number,
  ): RuntimeValue {
    const items = list.items

    switch (name) {
      case 'append': {
        if (args.length !== 1) {
          throw new ProgramError(line, 'append() añade un solo valor: append(lo_que_sea)')
        }
        items.push(args[0]!)
        return null
      }

      case 'insert': {
        if (args.length !== 2) {
          throw new ProgramError(
            line,
            'insert() necesita la posición y el valor: insert(0, "primero")',
          )
        }

        const position = args[0]
        if (typeof position !== 'number' || !Number.isInteger(position)) {
          throw new ProgramError(line, 'insert() coloca el valor en una posición entera')
        }

        const index = Math.min(
          Math.max(position < 0 ? items.length + position : position, 0),
          items.length,
        )
        items.splice(index, 0, args[1]!)
        return null
      }

      case 'remove': {
        if (args.length !== 1) {
          throw new ProgramError(line, 'remove() quita un valor: remove(lo_que_sea)')
        }

        const index = items.findIndex((item) => deepEqual(item, args[0]!))
        if (index === -1) {
          throw new ProgramError(
            line,
            `La lista no tiene ${repr(args[0]!)}: remove() solo quita lo que ya está dentro`,
          )
        }

        items.splice(index, 1)
        return null
      }

      case 'pop': {
        if (args.length > 1) {
          throw new ProgramError(line, 'pop() saca el último valor, o el de la posición que le digas')
        }
        if (items.length === 0) {
          throw new ProgramError(line, 'pop() no puede sacar nada de una lista vacía')
        }
        if (args.length === 0) return items.pop() ?? null

        return items.splice(this.checkedIndex(args[0], items.length, line), 1)[0] ?? null
      }

      case 'sort': {
        if (args.length !== 0) {
          throw new ProgramError(line, 'sort() no necesita nada más: ordena la lista tal cual')
        }

        const numbers = items.every((item) => typeof item === 'number')
        const texts = items.every((item) => typeof item === 'string')
        if (!numbers && !texts) {
          throw new ProgramError(
            line,
            'sort() solo ordena listas de números o de textos, sin mezclar',
          )
        }

        items.sort((left, right) => {
          if (typeof left === 'number' && typeof right === 'number') return left - right
          if (typeof left === 'string' && typeof right === 'string') {
            return left < right ? -1 : left > right ? 1 : 0
          }
          return 0
        })
        return null
      }

      default:
        throw new ProgramError(
          line,
          `Las listas no tienen «${name}()». Están append(), insert(), remove(), pop() y sort()`,
        )
    }
  }

  private call(expression: Extract<Expression, { type: 'call' }>, scope: Scope): RuntimeValue {
    const { callee, args, line } = expression
    const values = args.map((arg) => this.evaluate(arg, scope))

    const local = scope.lookup(callee)
    if (local !== undefined) {
      if (!isFunction(local)) throw new ProgramError(line, `«${callee}» no es una función`)
      return this.callUser(local, values, line)
    }

    const builtin = BUILTINS.get(callee)
    if (builtin !== undefined) return builtin(values, line, this.context)

    const apiFunction = this.api[callee]
    if (apiFunction !== undefined) {
      const args = values.map((value) => this.toApi(value, callee, line))
      try {
        const returned = apiFunction(...args)
        return returned === undefined ? null : this.fromApi(returned, line)
      } catch (error) {
        if (error instanceof ApiError) throw new ProgramError(line, error.message)
        throw error
      }
    }

    throw new ProgramError(line, `La función ${callee}() no existe. Revisa cómo la has escrito`)
  }

  /**
   * Las listas viajan a los motores como arrays y las funciones como funciones
   * de JavaScript que vuelven a entrar en el intérprete por `callUser`.
   */
  private toApi(value: RuntimeValue, callee: string, line: number): Value {
    if (isList(value)) return value.items.map((item) => this.toApi(item, callee, line))
    if (isFunction(value)) {
      const fn = value
      return (...args: Value[]) =>
        this.toApi(
          this.callUser(
            fn,
            args.map((arg) => this.fromApi(arg, line)),
            line,
          ),
          callee,
          line,
        )
    }
    if (isRange(value)) throw new ProgramError(line, `${callee}() no acepta ${describeType(value)}`)
    return value
  }

  private fromApi(value: Value, line: number): RuntimeValue {
    if (typeof value === 'function') {
      throw new ProgramError(line, 'Un minijuego no puede devolver una función')
    }
    if (Array.isArray(value)) {
      return { kind: 'list', items: value.map((item) => this.fromApi(item, line)) }
    }
    return value
  }

  private callUser(fn: FunctionValue, args: RuntimeValue[], line: number): RuntimeValue {
    if (args.length > fn.params.length) throw new ProgramError(line, this.arity(fn, args.length))

    const values: RuntimeValue[] = []
    for (let index = 0; index < fn.params.length; index += 1) {
      if (index < args.length) {
        values.push(args[index]!)
        continue
      }

      const fallback = fn.defaults[index]
      if (fallback === undefined) throw new ProgramError(line, this.arity(fn, args.length))
      values.push(fallback)
    }

    this.depth += 1
    if (this.depth > CALL_LIMIT) {
      this.depth -= 1
      throw new ProgramError(
        line,
        'Demasiadas llamadas seguidas: revisa si una función se llama a sí misma sin parar',
      )
    }

    try {
      const scope = new Scope(fn.scope)
      localNames(fn.body).forEach((name) => scope.declare(name))
      fn.params.forEach((param, index) => scope.define(param, values[index]!))
      const flow = this.runBlock(fn.body, scope)
      return flow.kind === 'return' ? flow.value : null
    } finally {
      this.depth -= 1
    }
  }

  /** Mensaje para una llamada con demasiados valores o sin uno obligatorio. */
  private arity(fn: FunctionValue, received: number): string {
    const required = fn.defaults.filter((value) => value === undefined).length
    const expected =
      required === fn.params.length
        ? plural(fn.params.length, 'valor', 'valores')
        : `entre ${required} y ${fn.params.length} valores`
    return `La función ${fn.name}() espera ${expected} y ha recibido ${received}`
  }

  /** Un nombre que se lee antes de tener valor. */
  private undeclared(name: string, scope: Scope, line: number): ProgramError {
    if (scope.isPending(name)) {
      return new ProgramError(
        line,
        `«${name}» es local en esta función y todavía no tiene valor: dale uno antes de leerla`,
      )
    }
    return new ProgramError(line, `La variable «${name}» todavía no existe`)
  }
}
