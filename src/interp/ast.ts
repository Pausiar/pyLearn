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
  | { type: 'def'; name: string; params: string[]; body: Statement[]; line: number }
  | { type: 'return'; value: Expression | null; line: number }
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
