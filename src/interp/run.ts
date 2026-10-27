/**
 * Punto de entrada del intérprete. Los niveles solo conocen esta función: el
 * lexer, el parser y el evaluador quedan detrás, y los errores salen como datos
 * con su número de línea.
 */
import { ProgramError } from './errors'
import { Interpreter, STEP_LIMIT } from './evaluator'
import { tokenize, type Token } from './lexer'
import { parse } from './parser'
import type { Api } from './types'

export interface InterpError {
  line: number
  message: string
}

export interface RunResult {
  /** Líneas de código con contenido (sin comentarios ni líneas vacías). */
  lines: number
  /** Lo que el programa ha impreso con print(), en orden. */
  output: string[]
  error?: InterpError
}

export { STEP_LIMIT }

const TRIVIAL: ReadonlySet<Token['kind']> = new Set(['newline', 'indent', 'dedent', 'eof'])

function countLines(tokens: Token[]): number {
  const lines = new Set<number>()
  for (const token of tokens) {
    if (!TRIVIAL.has(token.kind)) lines.add(token.line)
  }
  return lines.size
}

/** Recuento aproximado cuando el lexer falla antes de tener tokens. */
function naiveLines(source: string): number {
  return source.split('\n').filter((line) => {
    const trimmed = line.trim()
    return trimmed !== '' && !trimmed.startsWith('#')
  }).length
}

function failure(error: unknown, lines: number, output: string[]): RunResult {
  if (error instanceof ProgramError) {
    return { lines, output, error: { line: error.line, message: error.message } }
  }
  throw error
}

/** Ejecuta el código del alumno contra la API de un nivel. */
export function run(source: string, api: Api = {}): RunResult {
  const interpreter = new Interpreter(api)
  let tokens: Token[]

  try {
    tokens = tokenize(source)
  } catch (error) {
    return failure(error, naiveLines(source), [])
  }

  const lines = countLines(tokens)

  try {
    interpreter.execute(parse(tokens))
  } catch (error) {
    return failure(error, lines, interpreter.printed)
  }

  return { lines, output: interpreter.printed }
}
