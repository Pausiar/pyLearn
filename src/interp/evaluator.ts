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
import { ApiError, type Api, type Scalar } from './types'
import {
  binaryOp,
  compare,
  describeType,
  isFunction,
  isRange,
  truthy,
  unaryOp,
  type FunctionValue,
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

  if (typeof value === 'string') {
    for (const character of value) yield character
    return
  }

  throw new ProgramError(
    line,
    `Solo puedo recorrer un range o un texto, y he recibido ${describeType(value)}`,
  )
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
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

      case 'augassign': {
        const current = scope.lookup(statement.target)
        if (current === undefined) {
          throw new ProgramError(
            statement.line,
            `La variable «${statement.target}» todavía no existe`,
          )
        }
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
          params: statement.params,
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
        if (value === undefined) {
          throw new ProgramError(expression.line, `La variable «${expression.name}» todavía no existe`)
        }
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
      const scalars = values.map((value) => this.scalarArg(value, callee, line))
      try {
        const returned = apiFunction(...scalars) as Scalar | undefined
        return returned === undefined ? null : returned
      } catch (error) {
        if (error instanceof ApiError) throw new ProgramError(line, error.message)
        throw error
      }
    }

    throw new ProgramError(line, `La función ${callee}() no existe. Revisa cómo la has escrito`)
  }

  private scalarArg(value: RuntimeValue, callee: string, line: number): Scalar {
    if (value !== null && typeof value === 'object') {
      throw new ProgramError(line, `${callee}() no acepta ${describeType(value)}`)
    }
    return value
  }

  private callUser(fn: FunctionValue, args: RuntimeValue[], line: number): RuntimeValue {
    if (args.length !== fn.params.length) {
      throw new ProgramError(
        line,
        `La función ${fn.name}() espera ${plural(fn.params.length, 'valor', 'valores')} y ha recibido ${args.length}`,
      )
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
      fn.params.forEach((param, index) => scope.define(param, args[index]!))
      const flow = this.runBlock(fn.body, scope)
      return flow.kind === 'return' ? flow.value : null
    } finally {
      this.depth -= 1
    }
  }
}
