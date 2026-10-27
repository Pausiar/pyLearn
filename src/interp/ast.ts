/** Árbol de sintaxis del subconjunto de Python que entiende PyLearn. */

export type Statement =
  | { type: 'expr'; expression: Expression; line: number }
  | { type: 'assign'; targets: string[]; value: Expression; line: number }
  | { type: 'augassign'; target: string; op: string; value: Expression; line: number }
  | {
      type: 'if'
      branches: { test: Expression; body: Statement[] }[]
      orelse: Statement[]
      line: number
    }
  | { type: 'while'; test: Expression; body: Statement[]; line: number }
  | { type: 'for'; target: string; iterable: Expression; body: Statement[]; line: number }
  | {
      type: 'def'
      name: string
      params: { name: string; default: Expression | null }[]
      body: Statement[]
      line: number
    }
  | {
      type: 'try'
      body: Statement[]
      /** Un solo except, con su tipo de error o sin él. */
      handler: { kind: string | null; body: Statement[] }
      line: number
    }
  | { type: 'raise'; kind: string; value: Expression | null; line: number }
  | { type: 'with'; name: string; value: Expression; body: Statement[]; line: number }
  | { type: 'return'; value: Expression | null; line: number }
  | { type: 'setitem'; target: Expression; index: Expression; value: Expression; line: number }
  | { type: 'setattr'; target: Expression; name: string; value: Expression; line: number }
  | { type: 'class'; name: string; base: string | null; body: Statement[]; line: number }
  | { type: 'break'; line: number }
  | { type: 'continue'; line: number }
  | { type: 'pass'; line: number }

export type Expression =
  | { type: 'constant'; value: number | string | boolean | null; line: number }
  | { type: 'name'; name: string; line: number }
  | { type: 'binop'; op: string; left: Expression; right: Expression; line: number }
  | { type: 'unary'; op: string; operand: Expression; line: number }
  | { type: 'boolop'; op: 'and' | 'or'; left: Expression; right: Expression; line: number }
  | { type: 'compare'; left: Expression; ops: string[]; comparators: Expression[]; line: number }
  | { type: 'call'; callee: string; args: Expression[]; line: number }
  | { type: 'list'; items: Expression[]; line: number }
  | {
      type: 'subscript'
      target: Expression
      /** Posición, o principio de la rebanada; null cuando no lo hay. */
      index: Expression | null
      /** Final de la rebanada; null en un índice suelto o en una rebanada abierta. */
      end: Expression | null
      slice: boolean
      line: number
    }
  | { type: 'method'; target: Expression; name: string; args: Expression[]; line: number }
  | { type: 'attribute'; target: Expression; name: string; line: number }
  | { type: 'dict'; pairs: { key: Expression; value: Expression }[]; line: number }
  | { type: 'set'; items: Expression[]; line: number }
  | { type: 'tuple'; items: Expression[]; line: number }
  | {
      type: 'comprehension'
      element: Expression
      target: string
      iterable: Expression
      condition: Expression | null
      line: number
    }
