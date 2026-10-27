/**
 * Parser de descenso recursivo con la precedencia real de Python.
 *
 * La diferencia con el prototipo de la Fase 0 es esta: `2 + 3 * 2` da 8, no 10,
 * porque cada nivel de la gramática consume solo los operadores que le tocan.
 */
import type { Expression, Statement } from './ast'
import { ProgramError } from './errors'
import type { Token } from './lexer'

const COMPARISONS = new Set(['==', '!=', '<', '>', '<=', '>='])
const AUGMENTED = new Set(['+=', '-=', '*=', '/=', '//=', '%=', '**='])

const NEEDS_COLON = 'Después de los dos puntos (:) hace falta una línea con sangría'

export function parse(tokens: Token[]): Statement[] {
  return new Parser(tokens).parseProgram()
}

class Parser {
  private index = 0

  constructor(private readonly tokens: Token[]) {}

  parseProgram(): Statement[] {
    const body: Statement[] = []

    while (!this.at('eof')) {
      if (this.match('newline')) continue
      if (this.at('indent')) {
        throw new ProgramError(
          this.peek().line,
          'Sangría inesperada: revisa los espacios al inicio de la línea',
        )
      }
      body.push(this.statement())
    }

    return body
  }

  // --- sentencias ---------------------------------------------------------

  private statement(): Statement {
    const token = this.peek()

    if (token.kind === 'keyword') {
      switch (token.value) {
        case 'if':
          return this.ifStatement()
        case 'while':
          return this.whileStatement()
        case 'for':
          return this.forStatement()
        case 'def':
          return this.defStatement()
        case 'return':
          return this.returnStatement()
        case 'break':
          this.next()
          this.endStatement()
          return { type: 'break', line: token.line }
        case 'continue':
          this.next()
          this.endStatement()
          return { type: 'continue', line: token.line }
        case 'pass':
          this.next()
          this.endStatement()
          return { type: 'pass', line: token.line }
        case 'elif':
        case 'else':
          throw new ProgramError(token.line, `Este «${token.value}» no tiene un if delante`)
        default:
          throw new ProgramError(token.line, `No puedo empezar una línea con «${token.value}»`)
      }
    }

    return this.simpleStatement()
  }

  private simpleStatement(): Statement {
    const start = this.peek()
    let expression = this.expression()

    if (expression.type === 'subscript' && !expression.slice && this.at('op', '=')) {
      this.next()
      const value = this.expression()
      this.endStatement()
      return {
        type: 'setitem',
        target: expression.target,
        index: expression.index!,
        value,
        line: start.line,
      }
    }

    const targets: string[] = []

    while (this.at('op', '=')) {
      targets.push(this.targetName(expression))
      this.next()
      expression = this.expression()
    }

    if (targets.length === 0 && this.at('op') && AUGMENTED.has(this.peek().value)) {
      const target = this.targetName(expression)
      const op = this.next().value.slice(0, -1)
      const value = this.expression()
      this.endStatement()
      return { type: 'augassign', target, op, value, line: start.line }
    }

    this.endStatement()

    if (targets.length > 0) {
      return { type: 'assign', targets, value: expression, line: start.line }
    }

    return { type: 'expr', expression, line: start.line }
  }

  private ifStatement(): Statement {
    const { line } = this.next()
    const branches: { test: Expression; body: Statement[] }[] = [
      { test: this.expression(), body: [] },
    ]
    this.expect('op', ':', 'A la condición del if le faltan los dos puntos (:) al final')
    branches[0]!.body = this.suite(line)

    while (this.at('keyword', 'elif')) {
      this.next()
      const test = this.expression()
      this.expect('op', ':', 'A la condición del elif le faltan los dos puntos (:) al final')
      branches.push({ test, body: this.suite(line) })
    }

    let orelse: Statement[] = []
    if (this.at('keyword', 'else')) {
      this.next()
      this.expect('op', ':', 'Al else le faltan los dos puntos (:)')
      orelse = this.suite(line)
    }

    return { type: 'if', branches, orelse, line }
  }

  private whileStatement(): Statement {
    const { line } = this.next()
    const test = this.expression()
    this.expect('op', ':', 'Al while le faltan los dos puntos (:) al final')
    return { type: 'while', test, body: this.suite(line), line }
  }

  private forStatement(): Statement {
    const { line } = this.next()
    const target = this.peek()
    if (target.kind !== 'name') {
      throw new ProgramError(line, 'Después de for hace falta el nombre de una variable')
    }
    this.next()

    if (!this.at('keyword', 'in')) {
      throw new ProgramError(line, 'Al for le falta la palabra «in»: for i in range(3):')
    }
    this.next()

    const iterable = this.expression()
    this.expect('op', ':', 'Al for le faltan los dos puntos (:) al final')
    return { type: 'for', target: target.value, iterable, body: this.suite(line), line }
  }

  private defStatement(): Statement {
    const { line } = this.next()
    const name = this.peek()
    if (name.kind !== 'name') {
      throw new ProgramError(line, 'Después de def hace falta el nombre de la función')
    }
    this.next()

    this.expect('op', '(', 'Después del nombre de la función hacen falta los paréntesis')
    const params: { name: string; default: Expression | null }[] = []
    if (!this.at('op', ')')) {
      while (true) {
        const param = this.peek()
        if (param.kind !== 'name') {
          throw new ProgramError(
            param.line,
            'Los parámetros de una función son nombres separados por comas',
          )
        }
        this.next()

        let fallback: Expression | null = null
        if (this.match('op', '=')) {
          fallback = this.expression()
        } else if (params.some((entry) => entry.default !== null)) {
          throw new ProgramError(
            param.line,
            `El parámetro «${param.value}» necesita su valor por defecto: los que lo llevan van al final`,
          )
        }

        params.push({ name: param.value, default: fallback })
        if (!this.match('op', ',')) break
        if (this.at('op', ')')) break
      }
    }
    this.expect('op', ')', 'Falta cerrar un paréntesis')
    this.expect('op', ':', 'A la definición de la función le faltan los dos puntos (:) al final')

    return { type: 'def', name: name.value, params, body: this.suite(line), line }
  }

  private returnStatement(): Statement {
    const { line } = this.next()
    if (this.at('newline') || this.at('eof')) {
      this.endStatement()
      return { type: 'return', value: null, line }
    }
    const value = this.expression()
    this.endStatement()
    return { type: 'return', value, line }
  }

  /** Bloque con sangría después de los dos puntos. */
  private suite(owner: number): Statement[] {
    if (!this.at('newline')) throw new ProgramError(owner, NEEDS_COLON)
    this.next()

    if (!this.match('indent')) throw new ProgramError(owner, NEEDS_COLON)

    const body: Statement[] = []
    while (!this.at('dedent') && !this.at('eof')) {
      if (this.match('newline')) continue
      body.push(this.statement())
    }
    this.match('dedent')

    return body
  }

  // --- expresiones --------------------------------------------------------

  private expression(): Expression {
    return this.orExpression()
  }

  private orExpression(): Expression {
    let left = this.andExpression()

    while (this.at('keyword', 'or')) {
      const { line } = this.next()
      left = { type: 'boolop', op: 'or', left, right: this.andExpression(), line }
    }

    return left
  }

  private andExpression(): Expression {
    let left = this.notExpression()

    while (this.at('keyword', 'and')) {
      const { line } = this.next()
      left = { type: 'boolop', op: 'and', left, right: this.notExpression(), line }
    }

    return left
  }

  private notExpression(): Expression {
    if (this.at('keyword', 'not')) {
      const { line } = this.next()
      return { type: 'unary', op: 'not', operand: this.notExpression(), line }
    }

    return this.comparison()
  }

  private comparison(): Expression {
    const left = this.arithmetic()
    const ops: string[] = []
    const comparators: Expression[] = []

    while ((this.at('op') && COMPARISONS.has(this.peek().value)) || this.at('keyword', 'in')) {
      ops.push(this.next().value)
      comparators.push(this.arithmetic())
    }

    if (ops.length === 0) return left
    return { type: 'compare', left, ops, comparators, line: left.line }
  }

  private arithmetic(): Expression {
    let left = this.term()

    while (this.at('op', '+') || this.at('op', '-')) {
      const { value: op } = this.next()
      left = { type: 'binop', op, left, right: this.term(), line: left.line }
    }

    return left
  }

  private term(): Expression {
    let left = this.factor()

    while (['*', '/', '//', '%'].some((op) => this.at('op', op))) {
      const { value: op } = this.next()
      left = { type: 'binop', op, left, right: this.factor(), line: left.line }
    }

    return left
  }

  private factor(): Expression {
    if (this.at('op', '-') || this.at('op', '+')) {
      const { value: op, line } = this.next()
      return { type: 'unary', op, operand: this.factor(), line }
    }

    return this.power()
  }

  private power(): Expression {
    const base = this.atom()

    if (this.at('op', '**')) {
      this.next()
      return { type: 'binop', op: '**', left: base, right: this.factor(), line: base.line }
    }

    return base
  }

  private atom(): Expression {
    const token = this.peek()

    if (token.kind === 'number') {
      this.next()
      return this.postfix({ type: 'constant', value: Number(token.value), line: token.line })
    }

    if (token.kind === 'string') {
      this.next()
      return this.postfix({ type: 'constant', value: token.value, line: token.line })
    }

    if (token.kind === 'keyword') {
      if (token.value === 'True' || token.value === 'False' || token.value === 'None') {
        this.next()
        const value = token.value === 'None' ? null : token.value === 'True'
        return this.postfix({ type: 'constant', value, line: token.line })
      }
      throw new ProgramError(token.line, `Aquí no puedo usar «${token.value}»`)
    }

    if (token.kind === 'name') {
      this.next()
      const base: Expression = this.at('op', '(')
        ? this.call(token)
        : { type: 'name', name: token.value, line: token.line }
      return this.postfix(base)
    }

    if (token.kind === 'op' && token.value === '(') {
      this.next()
      const inner = this.expression()
      this.expect('op', ')', 'Falta cerrar un paréntesis')
      return this.postfix(inner)
    }

    if (token.kind === 'op' && token.value === '[') return this.postfix(this.listLiteral())

    throw new ProgramError(token.line, 'Falta un valor')
  }

  /** Una lista: [1, 2, 3], también vacía. */
  private listLiteral(): Expression {
    const { line } = this.next()
    const items: Expression[] = []

    if (!this.at('op', ']')) {
      while (true) {
        items.push(this.expression())
        if (!this.match('op', ',')) break
        if (this.at('op', ']')) break
      }
    }

    this.expect('op', ']', 'Falta cerrar el corchete de la lista')
    return { type: 'list', items, line }
  }

  /** Lo que va detrás de un valor: posiciones, rebanadas y métodos de lista. */
  private postfix(base: Expression): Expression {
    let expression = base

    while (true) {
      if (this.at('op', '[')) {
        const { line } = this.next()
        let index: Expression | null = null
        let end: Expression | null = null
        let slice = false

        if (!this.at('op', ':')) index = this.expression()

        if (this.at('op', ':')) {
          slice = true
          this.next()
          if (!this.at('op', ']')) end = this.expression()
        }

        this.expect('op', ']', 'Falta cerrar el corchete')
        expression = { type: 'subscript', target: expression, index, end, slice, line }
        continue
      }

      const method = this.tokens[this.index + 1]
      const parenthesis = this.tokens[this.index + 2]
      if (
        this.at('op', '.') &&
        method?.kind === 'name' &&
        parenthesis?.kind === 'op' &&
        parenthesis.value === '('
      ) {
        this.next()
        expression = this.methodCall(expression, this.next())
        continue
      }

      return expression
    }
  }

  private methodCall(target: Expression, name: Token): Expression {
    this.expect('op', '(', 'Después del nombre del método hacen falta los paréntesis')
    const args: Expression[] = []

    if (!this.at('op', ')')) {
      while (true) {
        args.push(this.expression())
        if (!this.match('op', ',')) break
        if (this.at('op', ')')) break
      }
    }

    this.expect('op', ')', 'Falta cerrar un paréntesis')
    return { type: 'method', target, name: name.value, args, line: name.line }
  }

  private call(name: Token): Expression {
    this.next() // el paréntesis de apertura
    const args: Expression[] = []

    if (!this.at('op', ')')) {
      while (true) {
        args.push(this.expression())
        if (!this.match('op', ',')) break
        if (this.at('op', ')')) break
      }
    }

    this.expect('op', ')', 'Falta cerrar un paréntesis')
    return { type: 'call', callee: name.value, args, line: name.line }
  }

  // --- utilidades ---------------------------------------------------------

  private targetName(expression: Expression): string {
    if (expression.type !== 'name') {
      throw new ProgramError(expression.line, 'A la izquierda del = hace falta el nombre de una variable')
    }
    return expression.name
  }

  private endStatement(): void {
    if (this.match('newline') || this.at('eof')) return
    throw new ProgramError(
      this.peek().line,
      'No entiendo esta línea. ¿Falta un paréntesis o los dos puntos?',
    )
  }

  private peek(): Token {
    return this.tokens[Math.min(this.index, this.tokens.length - 1)]!
  }

  private next(): Token {
    const token = this.peek()
    if (token.kind !== 'eof') this.index += 1
    return token
  }

  private at(kind: Token['kind'], value?: string): boolean {
    const token = this.peek()
    return token.kind === kind && (value === undefined || token.value === value)
  }

  private match(kind: Token['kind'], value?: string): boolean {
    if (!this.at(kind, value)) return false
    this.next()
    return true
  }

  private expect(kind: Token['kind'], value: string, message: string): Token {
    if (!this.at(kind, value)) throw new ProgramError(this.peek().line, message)
    return this.next()
  }
}
