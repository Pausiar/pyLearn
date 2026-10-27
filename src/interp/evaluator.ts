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
import { createMathModule, createRandomModule } from './modules'
import {
  binaryOp,
  compare,
  deepEqual,
  describeType,
  display,
  isClass,
  isDict,
  isFile,
  isFunction,
  isInstance,
  isList,
  isModule,
  isRange,
  isSet,
  isSuper,
  isTuple,
  linesOf,
  repr,
  requireKey,
  truthy,
  unaryOp,
  uniqueItems,
  type ClassValue,
  type DictEntry,
  type DictValue,
  type FileValue,
  type FunctionValue,
  type InstanceValue,
  type ListValue,
  type ModuleValue,
  type RuntimeValue,
  type SetValue,
  type TupleValue,
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

  if (isList(value) || isTuple(value) || isSet(value)) {
    for (const item of [...value.items]) yield item
    return
  }

  if (isDict(value)) {
    for (const entry of [...value.entries.values()]) yield entry.key
    return
  }

  if (isFile(value)) {
    for (const line of linesOf(value.store.get(value.name) ?? '')) yield line
    return
  }

  if (typeof value === 'string') {
    for (const character of value) yield character
    return
  }

  throw new ProgramError(
    line,
    `Solo puedo recorrer listas, tuplas, conjuntos, diccionarios, ranges y textos, y he recibido ${describeType(value)}`,
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
      case 'with':
        names.add(statement.name)
        localNames(statement.body, names)
        break
      case 'try':
        localNames(statement.body, names)
        localNames(statement.handler.body, names)
        break
      case 'class':
        names.add(statement.name)
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
      files: new Map<string, string>(),
    }

    // La biblioteca estándar que PyLearn trae hecha, una por ejecución.
    this.global.define('random', createRandomModule())
    this.global.define('math', createMathModule())
  }

  /** Lo que se ha impreso hasta ahora, también cuando el programa falla a medias. */
  get printed(): string[] {
    return this.output
  }

  /** Los archivos del programa: los niveles del mundo 7 los juzgan con esto. */
  get files(): Record<string, string> {
    return Object.fromEntries(this.context.files)
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

        if (isDict(target)) {
          const key = this.evaluate(statement.index, scope)
          target.entries.set(requireKey(key, statement.line), {
            key,
            value: this.evaluate(statement.value, scope),
          })
          return NORMAL
        }

        if (!isList(target)) {
          throw new ProgramError(
            statement.line,
            `Solo puedo cambiar una posición de una lista o una clave de un diccionario, y esto es ${describeType(target)}`,
          )
        }

        const index = this.position(statement.index, target.items.length, scope, statement.line)
        target.items[index] = this.evaluate(statement.value, scope)
        return NORMAL
      }

      case 'setattr': {
        const target = this.evaluate(statement.target, scope)
        if (!isInstance(target)) {
          throw new ProgramError(
            statement.line,
            `Solo puedo dar valores a los atributos de un objeto y esto es ${describeType(target)}`,
          )
        }

        target.attributes.set(statement.name, this.evaluate(statement.value, scope))
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

      case 'class': {
        let base: ClassValue | null = null
        if (statement.base !== null) {
          const parent = scope.lookup(statement.base)
          if (parent === undefined || !isClass(parent)) {
            throw new ProgramError(statement.line, `La clase madre «${statement.base}» no existe`)
          }
          base = parent
        }

        const klass: ClassValue = {
          kind: 'class',
          name: statement.name,
          base,
          methods: new Map(),
          attributes: new Map(),
        }

        for (const inner of statement.body) {
          if (inner.type === 'def') {
            klass.methods.set(inner.name, {
              kind: 'function',
              name: inner.name,
              params: inner.params.map((param) => param.name),
              defaults: inner.params.map((param) =>
                param.default === null ? undefined : this.evaluate(param.default, scope),
              ),
              body: inner.body,
              scope,
            })
            continue
          }

          if (inner.type === 'assign') {
            const value = this.evaluate(inner.value, scope)
            for (const target of inner.targets) klass.attributes.set(target, value)
            continue
          }

          if (inner.type === 'pass' || inner.type === 'expr') continue

          throw new ProgramError(
            inner.line,
            'Dentro de una clase solo van métodos con def y atributos con nombre = valor',
          )
        }

        scope.define(statement.name, klass)
        return NORMAL
      }

      case 'return':
        return {
          kind: 'return',
          value: statement.value === null ? null : this.evaluate(statement.value, scope),
        }

      case 'try': {
        try {
          const flow = this.runBlock(statement.body, scope)
          if (flow.kind !== 'normal') return flow
        } catch (error) {
          if (!(error instanceof ProgramError)) throw error
          const catchable = statement.handler.kind === null || statement.handler.kind === error.kind
          if (!catchable) throw error
          return this.runBlock(statement.handler.body, scope)
        }
        return NORMAL
      }

      case 'raise': {
        const message =
          statement.value === null
            ? `Error lanzado a propósito con raise ${statement.kind}`
            : display(this.evaluate(statement.value, scope))
        throw new ProgramError(statement.line, message, statement.kind)
      }

      case 'with': {
        const handle = this.evaluate(statement.value, scope)
        if (!isFile(handle)) {
          throw new ProgramError(
            statement.line,
            `El with necesita un archivo abierto con open() y esto es ${describeType(handle)}`,
          )
        }

        scope.define(statement.name, handle)
        const flow = this.runBlock(statement.body, scope)
        handle.closed = true
        return flow
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

      case 'dict': {
        const entries = new Map<string, DictEntry>()
        for (const pair of expression.pairs) {
          const key = this.evaluate(pair.key, scope)
          entries.set(requireKey(key, pair.key.line), {
            key,
            value: this.evaluate(pair.value, scope),
          })
        }
        return { kind: 'dict', entries }
      }

      case 'set':
        return {
          kind: 'set',
          items: uniqueItems(expression.items.map((item) => this.evaluate(item, scope))),
        }

      case 'tuple':
        return { kind: 'tuple', items: expression.items.map((item) => this.evaluate(item, scope)) }

      case 'comprehension': {
        const iterable = this.evaluate(expression.iterable, scope)
        const items: RuntimeValue[] = []
        // La variable de la comprensión vive dentro, como en Python.
        const inner = new Scope(scope)

        for (const item of iterate(iterable, expression.line)) {
          inner.define(expression.target, item)
          if (expression.condition !== null && !truthy(this.evaluate(expression.condition, inner))) {
            continue
          }
          items.push(this.evaluate(expression.element, inner))
        }

        return { kind: 'list', items }
      }

      case 'subscript':
        return this.subscript(expression, scope)

      case 'attribute': {
        const target = this.evaluate(expression.target, scope)

        if (isModule(target)) {
          const member = target.members.get(expression.name)
          if (member === undefined) {
            throw new ProgramError(
              expression.line,
              `El módulo ${target.name} no tiene «${expression.name}»`,
            )
          }
          return member
        }

        if (isInstance(target)) {
          return this.instanceAttribute(target, expression.name, expression.line)
        }

        if (isClass(target)) {
          const attribute = this.classAttribute(target, expression.name)
          if (attribute !== undefined) return attribute
          throw new ProgramError(
            expression.line,
            `La clase ${target.name} no tiene «${expression.name}»`,
          )
        }

        throw new ProgramError(
          expression.line,
          `${describeType(target)} no tiene atributos, así que «.${expression.name}» no existe`,
        )
      }

      case 'method': {
        const target = this.evaluate(expression.target, scope)
        const args = expression.args.map((arg) => this.evaluate(arg, scope))

        if (isList(target)) return this.listMethod(target, expression.name, args, expression.line)
        if (isDict(target)) return this.dictMethod(target, expression.name, args, expression.line)
        if (isFile(target)) return this.fileMethod(target, expression.name, args, expression.line)
        if (isSet(target)) return this.setMethod(target, expression.name, args, expression.line)
        if (isModule(target)) return this.moduleMethod(target, expression.name, args, expression.line)
        if (typeof target === 'string') {
          return this.stringMethod(target, expression.name, args, expression.line)
        }
        if (isInstance(target)) {
          return this.instanceMethod(target, expression.name, args, expression.line)
        }
        if (isSuper(target)) {
          const found =
            target.klass.base === null ? undefined : this.findMethod(target.klass.base, expression.name)
          if (!found) {
            throw new ProgramError(
              expression.line,
              `La clase ${target.klass.name} no hereda ningún «${expression.name}()»`,
            )
          }
          return this.callMethod(found.method, target.instance, args, expression.line, found.owner)
        }

        throw new ProgramError(
          expression.line,
          `${describeType(target)} no tiene métodos, y «${expression.name}()» lo es`,
        )
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
        'IndexError',
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

    if (isDict(target)) {
      if (expression.slice) {
        throw new ProgramError(expression.line, 'Un diccionario no se corta: se busca por su clave')
      }
      if (expression.index === null) {
        throw new ProgramError(expression.line, 'Dentro de los corchetes falta la clave')
      }

      const key = this.evaluate(expression.index, scope)
      const entry = target.entries.get(requireKey(key, expression.line))
      if (!entry) {
        throw new ProgramError(
          expression.line,
          `La clave ${repr(key)} no está en el diccionario: usa get() si puede faltar`,
          'KeyError',
        )
      }
      return entry.value
    }

    if (!isList(target) && !isTuple(target) && typeof target !== 'string') {
      throw new ProgramError(
        expression.line,
        `No puedo sacar una posición de ${describeType(target)}`,
      )
    }

    const items: RuntimeValue[] = typeof target === 'string' ? [...target] : target.items

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
    if (isTuple(target)) return { kind: 'tuple', items: pieces }
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

      case 'index': {
        if (args.length !== 1) {
          throw new ProgramError(line, 'index() busca un valor: index(lo_que_sea)')
        }

        const position = items.findIndex((item) => deepEqual(item, args[0]!))
        if (position === -1) {
          throw new ProgramError(line, `La lista no tiene ${repr(args[0]!)}`)
        }
        return position
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
          `Las listas no tienen «${name}()». Están append(), insert(), remove(), pop(), index() y sort()`,
        )
    }
  }

  private dictMethod(
    dict: DictValue,
    name: string,
    args: RuntimeValue[],
    line: number,
  ): RuntimeValue {
    switch (name) {
      case 'get': {
        if (args.length < 1 || args.length > 2) {
          throw new ProgramError(
            line,
            'get() busca una clave y, si quieres, trae un valor por defecto',
          )
        }

        const entry = dict.entries.get(requireKey(args[0]!, line))
        if (entry) return entry.value
        return args.length === 2 ? args[1]! : null
      }

      case 'keys':
        return { kind: 'list', items: [...dict.entries.values()].map((entry) => entry.key) }

      case 'values':
        return { kind: 'list', items: [...dict.entries.values()].map((entry) => entry.value) }

      case 'items':
        return {
          kind: 'list',
          items: [...dict.entries.values()].map(
            (entry): TupleValue => ({ kind: 'tuple', items: [entry.key, entry.value] }),
          ),
        }

      case 'pop': {
        if (args.length < 1 || args.length > 2) {
          throw new ProgramError(line, 'pop() saca una clave: pop(clave) o pop(clave, lo_que_haya)')
        }

        const key = requireKey(args[0]!, line)
        const entry = dict.entries.get(key)
        if (!entry) {
          if (args.length === 2) return args[1]!
          throw new ProgramError(line, `La clave ${repr(args[0]!)} no está en el diccionario`)
        }

        dict.entries.delete(key)
        return entry.value
      }

      default:
        throw new ProgramError(
          line,
          `Los diccionarios no tienen «${name}()». Están get(), keys(), values(), items() y pop()`,
        )
    }
  }

  private setMethod(set: SetValue, name: string, args: RuntimeValue[], line: number): RuntimeValue {
    switch (name) {
      case 'add': {
        if (args.length !== 1) {
          throw new ProgramError(line, 'add() añade un valor: add(lo_que_sea)')
        }
        if (!set.items.some((item) => deepEqual(item, args[0]!))) set.items.push(args[0]!)
        return null
      }

      case 'remove': {
        if (args.length !== 1) {
          throw new ProgramError(line, 'remove() quita un valor: remove(lo_que_sea)')
        }

        const position = set.items.findIndex((item) => deepEqual(item, args[0]!))
        if (position === -1) {
          throw new ProgramError(line, `El conjunto no tiene ${repr(args[0]!)}`)
        }
        set.items.splice(position, 1)
        return null
      }

      default:
        throw new ProgramError(
          line,
          `Los conjuntos no tienen «${name}()». Están add(), remove() y len()`,
        )
    }
  }

  private stringMethod(
    text: string,
    name: string,
    args: RuntimeValue[],
    line: number,
  ): RuntimeValue {
    switch (name) {
      case 'upper':
        if (args.length !== 0) throw new ProgramError(line, 'upper() no necesita nada')
        return text.toUpperCase()

      case 'lower':
        if (args.length !== 0) throw new ProgramError(line, 'lower() no necesita nada')
        return text.toLowerCase()

      case 'strip':
        if (args.length !== 0) throw new ProgramError(line, 'strip() no necesita nada')
        return text.trim()

      case 'replace': {
        if (args.length !== 2 || typeof args[0] !== 'string' || typeof args[1] !== 'string') {
          throw new ProgramError(
            line,
            'replace() necesita dos textos: replace("lo_viejo", "lo_nuevo")',
          )
        }
        return text.split(args[0]).join(args[1])
      }

      case 'split': {
        if (args.length > 1) {
          throw new ProgramError(line, 'split() parte por el separador que le digas, o por espacios')
        }
        if (args.length === 0) {
          return { kind: 'list', items: text.split(/\s+/).filter((piece) => piece !== '') }
        }
        if (typeof args[0] !== 'string') {
          throw new ProgramError(line, 'split() parte por un texto: split(":")')
        }
        return { kind: 'list', items: text.split(args[0]) }
      }

      default:
        throw new ProgramError(
          line,
          `Los textos no tienen «${name}()». Están upper(), lower(), strip(), replace() y split()`,
        )
    }
  }

  /** Busca un método en la clase y después en sus clases madres. */
  private findMethod(
    klass: ClassValue,
    name: string,
  ): { method: FunctionValue; owner: ClassValue } | undefined {
    let current: ClassValue | null = klass
    while (current !== null) {
      const method = current.methods.get(name)
      if (method !== undefined) return { method, owner: current }
      current = current.base
    }
    return undefined
  }

  private classAttribute(klass: ClassValue, name: string): RuntimeValue | undefined {
    let current: ClassValue | null = klass
    while (current !== null) {
      const attribute = current.attributes.get(name)
      if (attribute !== undefined) return attribute
      current = current.base
    }
    return undefined
  }

  private instanceAttribute(instance: InstanceValue, name: string, line: number): RuntimeValue {
    const own = instance.attributes.get(name)
    if (own !== undefined) return own

    const inherited = this.classAttribute(instance.klass, name)
    if (inherited !== undefined) return inherited

    throw new ProgramError(
      line,
      `${instance.klass.name} no tiene «${name}»: revisa cómo se llama el atributo`,
    )
  }

  private callMethod(
    method: FunctionValue,
    instance: InstanceValue,
    args: RuntimeValue[],
    line: number,
    owner: ClassValue,
  ): RuntimeValue {
    if (method.params[0] !== 'self') {
      throw new ProgramError(
        line,
        `Al método ${method.name}() le falta self como primer parámetro: def ${method.name}(self, …):`,
      )
    }
    return this.callUser(method, [instance, ...args], line, owner)
  }

  private instanceMethod(
    instance: InstanceValue,
    name: string,
    args: RuntimeValue[],
    line: number,
  ): RuntimeValue {
    const found = this.findMethod(instance.klass, name)
    if (!found) {
      const available = [...instance.klass.methods.keys()].join(', ')
      throw new ProgramError(
        line,
        `${instance.klass.name} no tiene «${name}()». Sus métodos son ${available === '' ? 'ninguno' : available}`,
      )
    }
    return this.callMethod(found.method, instance, args, line, found.owner)
  }

  private instantiate(klass: ClassValue, args: RuntimeValue[], line: number): InstanceValue {
    const instance: InstanceValue = { kind: 'instance', klass, attributes: new Map() }
    const init = this.findMethod(klass, '__init__')

    if (!init) {
      if (args.length > 0) {
        throw new ProgramError(
          line,
          `La clase ${klass.name} no tiene __init__ y no acepta valores al crearse`,
        )
      }
      return instance
    }

    this.callMethod(init.method, instance, args, line, init.owner)
    return instance
  }

  /** super() dentro de un método: la clase madre de la clase donde se escribe. */
  private makeSuper(args: RuntimeValue[], scope: Scope, line: number): RuntimeValue {
    if (args.length !== 0) throw new ProgramError(line, 'super() no lleva argumentos')

    const klass = scope.lookup('__clase__')
    const self = scope.lookup('self')
    if (klass === undefined || self === undefined || !isClass(klass) || !isInstance(self)) {
      throw new ProgramError(
        line,
        'super() solo se usa dentro de un método, para llamar a la clase madre',
      )
    }
    return { kind: 'super', klass, instance: self }
  }

  private fileMethod(
    file: FileValue,
    name: string,
    args: RuntimeValue[],
    line: number,
  ): RuntimeValue {
    const open = () => {
      if (file.closed) {
        throw new ProgramError(
          line,
          `El archivo «${file.name}» ya está cerrado: ábrelo otra vez con open()`,
        )
      }
    }

    switch (name) {
      case 'write': {
        open()
        if (args.length !== 1 || typeof args[0] !== 'string') {
          throw new ProgramError(line, 'write() escribe un texto: diario.write("una línea")')
        }
        if (file.mode !== 'w') {
          throw new ProgramError(
            line,
            `El archivo «${file.name}» está abierto para leer: ábrelo con "w" para escribir`,
          )
        }

        file.content += args[0]
        file.store.set(file.name, file.content)
        return null
      }

      case 'read': {
        open()
        if (args.length !== 0) throw new ProgramError(line, 'read() no necesita nada')
        return file.store.get(file.name) ?? ''
      }

      case 'readlines': {
        open()
        if (args.length !== 0) throw new ProgramError(line, 'readlines() no necesita nada')
        return { kind: 'list', items: linesOf(file.store.get(file.name) ?? '') }
      }

      case 'close':
        if (args.length !== 0) throw new ProgramError(line, 'close() no necesita nada')
        file.closed = true
        return null

      default:
        throw new ProgramError(
          line,
          `Los archivos no tienen «${name}()». Están write(), read(), readlines() y close()`,
        )
    }
  }

  private moduleMethod(
    module: ModuleValue,
    name: string,
    args: RuntimeValue[],
    line: number,
  ): RuntimeValue {
    const fn = module.functions.get(name)
    if (!fn) {
      throw new ProgramError(
        line,
        `El módulo ${module.name} no tiene «${name}()». Está ${[...module.functions.keys()].join(', ')}`,
      )
    }
    return fn(args, line)
  }

  private call(expression: Extract<Expression, { type: 'call' }>, scope: Scope): RuntimeValue {
    const { callee, args, line } = expression
    const values = args.map((arg) => this.evaluate(arg, scope))

    const local = scope.lookup(callee)
    if (local !== undefined) {
      if (isFunction(local)) return this.callUser(local, values, line)
      if (isClass(local)) return this.instantiate(local, values, line)
      throw new ProgramError(line, `«${callee}» no es una función`)
    }

    if (callee === 'super') return this.makeSuper(values, scope, line)

    const builtin = BUILTINS.get(callee)
    if (builtin !== undefined) return builtin(values, line, this.context)

    const apiFunction = this.api[callee]
    if (apiFunction !== undefined) {
      const args = values.map((value) => this.toApi(value, callee, line))
      try {
        const returned = apiFunction(...args)
        return returned === undefined ? null : this.fromApi(returned, line)
      } catch (error) {
        if (error instanceof ApiError) throw new ProgramError(line, error.message, error.kind)
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
    if (isList(value) || isTuple(value) || isSet(value)) {
      return value.items.map((item) => this.toApi(item, callee, line))
    }
    if (isDict(value)) {
      const result: Record<string, Value> = {}
      for (const entry of value.entries.values()) {
        result[String(entry.key)] = this.toApi(entry.value, callee, line)
      }
      return result
    }
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
    if (
      isRange(value) ||
      isModule(value) ||
      isFile(value) ||
      isClass(value) ||
      isInstance(value) ||
      isSuper(value)
    ) {
      throw new ProgramError(line, `${callee}() no acepta ${describeType(value)}`)
    }
    return value
  }

  private fromApi(value: Value, line: number): RuntimeValue {
    if (typeof value === 'function') {
      throw new ProgramError(line, 'Un minijuego no puede devolver una función')
    }
    if (Array.isArray(value)) {
      return { kind: 'list', items: value.map((item) => this.fromApi(item, line)) }
    }
    if (typeof value === 'object' && value !== null) {
      const entries = new Map<string, DictEntry>()
      for (const [key, item] of Object.entries(value)) {
        entries.set(requireKey(key, line), { key, value: this.fromApi(item, line) })
      }
      return { kind: 'dict', entries }
    }
    return value
  }

  private callUser(
    fn: FunctionValue,
    args: RuntimeValue[],
    line: number,
    owner?: ClassValue,
  ): RuntimeValue {
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
      if (owner !== undefined) scope.define('__clase__', owner)
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
