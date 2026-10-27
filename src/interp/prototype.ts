/**
 * PROTOTIPO de la Fase 0.
 *
 * Cubre lo justo para que el nivel 1 de la demo funcione: llamadas, asignación
 * con números y texto, `for ... in range(...)` y aritmética básica.
 *
 * Se sustituye en la Fase 1 por lexer con INDENT/DEDENT, parser a AST y
 * evaluador por generador con traza de eventos. La interfaz pública
 * (`runPrototype`) se mantiene para que el cambio no toque los niveles.
 */
import { ApiError, type Api, type Value } from './types'

export interface InterpError {
  line: number
  message: string
}

export interface RunResult {
  /** Líneas de código con contenido (sin comentarios ni líneas vacías). */
  lines: number
  error?: InterpError
}

/** Tope de sentencias ejecutadas. Un bucle infinito termina con un mensaje, nunca cuelga la pestaña. */
export const STEP_LIMIT = 20_000

class UserError extends Error {
  constructor(
    readonly line: number,
    message: string,
  ) {
    super(message)
    this.name = 'UserError'
  }
}

interface SourceLine {
  number: number
  indent: number
  text: string
}

const TOKEN = /"[^"]*"|'[^']*'|\d+(?:\.\d+)?|[A-Za-z_]\w*|[+\-*/%]/g
const FOR = /^for ([A-Za-z_]\w*) in range\((.+)\):$/
const ASSIGNMENT = /^([A-Za-z_]\w*) = (.+)$/
const CALL = /^([A-Za-z_]\w*)\((.*)\)$/

function stripComment(raw: string): string {
  const hash = raw.indexOf('#')
  // El prototipo no distingue una almohadilla dentro de una cadena; el lexer de la Fase 1 sí.
  return hash === -1 ? raw : raw.slice(0, hash)
}

function readLines(source: string): SourceLine[] {
  const lines: SourceLine[] = []

  source.split('\n').forEach((raw, index) => {
    if (raw.includes('\t')) {
      throw new UserError(index + 1, 'Usa espacios para la sangría, no tabuladores')
    }

    const withoutComment = stripComment(raw).trimEnd()
    if (withoutComment.trim() === '') return

    const indent = withoutComment.length - withoutComment.trimStart().length
    lines.push({ number: index + 1, indent, text: withoutComment.trim() })
  })

  return lines
}

function atom(token: string | undefined, line: number, vars: Map<string, Value>): Value {
  if (token === undefined) throw new UserError(line, 'Falta un valor')

  if (token.startsWith('"') || token.startsWith("'")) {
    const quote = token[0]
    if (token.length < 2 || token[token.length - 1] !== quote) {
      throw new UserError(line, 'Falta cerrar las comillas')
    }
    return token.slice(1, -1)
  }

  if (/^\d/.test(token)) return Number(token)

  const value = vars.get(token)
  if (value === undefined) {
    throw new UserError(line, `La variable «${token}» todavía no existe`)
  }
  return value
}

function evaluate(expr: string, line: number, vars: Map<string, Value>): Value {
  const tokens = expr.match(TOKEN)
  if (!tokens || tokens.length === 0) throw new UserError(line, 'Falta un valor')

  let value = atom(tokens[0], line, vars)

  for (let i = 1; i < tokens.length; i += 2) {
    const operator = tokens[i]
    const right = atom(tokens[i + 1], line, vars)

    if (operator === '+') {
      value =
        typeof value === 'number' && typeof right === 'number'
          ? value + right
          : `${String(value)}${String(right)}`
      continue
    }

    if (typeof value !== 'number' || typeof right !== 'number') {
      throw new UserError(line, `No puedo usar «${operator}» con texto. Para unir textos usa +`)
    }

    switch (operator) {
      case '-':
        value -= right
        break
      case '*':
        value *= right
        break
      case '/':
      case '%':
        if (right === 0) throw new UserError(line, 'No se puede dividir entre cero')
        value = operator === '/' ? value / right : value % right
        break
      default:
        throw new UserError(line, `No entiendo el operador «${operator}»`)
    }
  }

  return value
}

function splitArguments(raw: string): string[] {
  const parts: string[] = []
  let current = ''
  let depth = 0
  let quote = ''

  for (const character of raw) {
    if (quote) {
      current += character
      if (character === quote) quote = ''
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      current += character
      continue
    }
    if (character === '(') depth += 1
    if (character === ')') depth -= 1
    if (character === ',' && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += character
  }

  if (current.trim() !== '') parts.push(current)
  return parts.map((part) => part.trim())
}

function runBlock(lines: SourceLine[], start: number, indent: number, api: Api, vars: Map<string, Value>, budget: { steps: number }): number {
  let index = start

  while (index < lines.length) {
    const line = lines[index]
    if (line === undefined) break
    if (line.indent < indent) break
    if (line.indent > indent) {
      throw new UserError(line.number, 'Sangría inesperada: revisa los espacios al inicio de la línea')
    }

    budget.steps += 1
    if (budget.steps > STEP_LIMIT) {
      throw new UserError(line.number, 'Demasiados pasos: puede que haya un bucle infinito')
    }

    const loop = FOR.exec(line.text)
    if (loop) {
      const name = loop[1] ?? ''
      const count = evaluate(loop[2] ?? '', line.number, vars)
      if (typeof count !== 'number') {
        throw new UserError(line.number, 'range() necesita un número')
      }

      const bodyStart = index + 1
      const first = lines[bodyStart]
      if (!first || first.indent <= line.indent) {
        throw new UserError(
          line.number,
          'Después de los dos puntos (:) hace falta una línea con sangría',
        )
      }

      if (count <= 0) {
        let skip = bodyStart
        while (skip < lines.length) {
          const candidate = lines[skip]
          if (!candidate || candidate.indent < first.indent) break
          skip += 1
        }
        index = skip
        continue
      }

      let end = bodyStart
      for (let turn = 0; turn < count; turn += 1) {
        vars.set(name, turn)
        end = runBlock(lines, bodyStart, first.indent, api, vars, budget)
      }
      index = end
      continue
    }

    const assignment = ASSIGNMENT.exec(line.text)
    if (assignment) {
      vars.set(assignment[1] ?? '', evaluate(assignment[2] ?? '', line.number, vars))
      index += 1
      continue
    }

    const call = CALL.exec(line.text)
    if (call) {
      const name = call[1] ?? ''
      const fn = api[name]
      if (!fn) {
        throw new UserError(line.number, `La función ${name}() no existe. Revisa cómo la has escrito`)
      }
      const args = splitArguments(call[2] ?? '').map((arg) => evaluate(arg, line.number, vars))
      try {
        fn(...args)
      } catch (error) {
        if (error instanceof ApiError) throw new UserError(line.number, error.message)
        throw error
      }
      index += 1
      continue
    }

    throw new UserError(line.number, 'No entiendo esta línea. ¿Falta un paréntesis o los dos puntos?')
  }

  return index
}

/** Ejecuta el subconjunto de Python de la Fase 0 contra la API de un nivel. */
export function runPrototype(source: string, api: Api): RunResult {
  let lines: SourceLine[] = []

  try {
    lines = readLines(source)
    if (lines.length === 0) return { lines: 0 }

    const budget = { steps: 0 }
    runBlock(lines, 0, lines[0]?.indent ?? 0, api, new Map<string, Value>(), budget)
    return { lines: lines.length }
  } catch (error) {
    if (error instanceof UserError) {
      return { lines: lines.length, error: { line: error.line, message: error.message } }
    }
    throw error
  }
}
