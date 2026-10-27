/**
 * Lexer de un subconjunto de Python.
 *
 * Su trabajo propio, el que un `split` no puede hacer, es la sangría: emite
 * INDENT y DEDENT como en CPython, de modo que el parser recibe bloques ya
 * delimitados. Los comentarios se ignoran solo fuera de las cadenas, así que
 * `"#"` dentro de un texto no rompe la línea.
 */
import { ProgramError } from './errors'

export type TokenKind =
  | 'number'
  | 'string'
  | 'name'
  | 'keyword'
  | 'op'
  | 'newline'
  | 'indent'
  | 'dedent'
  | 'eof'

export interface Token {
  kind: TokenKind
  /** Texto del token: el valor de la cadena ya sin comillas, el nombre exacto. */
  value: string
  line: number
}

const KEYWORDS = new Set([
  'and',
  'as',
  'break',
  'class',
  'continue',
  'def',
  'elif',
  'else',
  'except',
  'False',
  'for',
  'if',
  'in',
  'None',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'True',
  'try',
  'while',
  'with',
])

/** De más largo a más corto: así `**=` no se lee como `**` y luego `=`. */
const OPERATORS = [
  '**=',
  '//=',
  '==',
  '!=',
  '<=',
  '>=',
  '//',
  '**',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '(',
  ')',
  '[',
  ']',
  '{',
  '}',
  '.',
  ',',
  ':',
  '+',
  '-',
  '*',
  '/',
  '%',
  '=',
  '<',
  '>',
]

const ESCAPES: Record<string, string> = {
  n: '\n',
  t: '\t',
  r: '\r',
  '\\': '\\',
  '"': '"',
  "'": "'",
}

function isDigit(character: string): boolean {
  return character >= '0' && character <= '9'
}

function isNameStart(character: string): boolean {
  return (
    (character >= 'a' && character <= 'z') ||
    (character >= 'A' && character <= 'Z') ||
    character === '_' ||
    // Letras acentuadas y ñ: el alumnado escribe en español.
    (character >= '\u00c0' && character <= '\u024f')
  )
}

function isNamePart(character: string): boolean {
  return isNameStart(character) || isDigit(character)
}

function readString(text: string, start: number, line: number): { value: string; end: number } {
  const quote = text[start]
  let index = start + 1
  let value = ''

  while (index < text.length) {
    const character = text[index] ?? ''

    if (character === quote) return { value, end: index + 1 }

    if (character === '\\') {
      const escaped = text[index + 1]
      if (escaped === undefined) break
      value += ESCAPES[escaped] ?? escaped
      index += 2
      continue
    }

    value += character
    index += 1
  }

  throw new ProgramError(line, 'Falta cerrar las comillas')
}

/** Convierte el código del alumno en tokens, con INDENT y DEDENT por bloque. */
export function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  const indents = [0]

  source.split('\n').forEach((raw, index) => {
    const line = index + 1
    const text = raw.endsWith('\r') ? raw.slice(0, -1) : raw

    let cursor = 0
    let indent = 0
    while (cursor < text.length && (text[cursor] === ' ' || text[cursor] === '\t')) {
      if (text[cursor] === '\t') {
        throw new ProgramError(line, 'Usa espacios para la sangría, no tabuladores')
      }
      indent += 1
      cursor += 1
    }

    const first = text[cursor]
    if (first === undefined || first === '#') return

    if (indent > (indents[indents.length - 1] ?? 0)) {
      indents.push(indent)
      tokens.push({ kind: 'indent', value: '', line })
    } else {
      while (indent < (indents[indents.length - 1] ?? 0)) {
        indents.pop()
        tokens.push({ kind: 'dedent', value: '', line })
      }
      if (indent !== indents[indents.length - 1]) {
        throw new ProgramError(line, 'La sangría no coincide con ningún bloque anterior')
      }
    }

    while (cursor < text.length) {
      const character = text[cursor] ?? ''

      if (character === ' ' || character === '\t') {
        cursor += 1
        continue
      }

      if (character === '#') break

      if (character === '"' || character === "'") {
        const string = readString(text, cursor, line)
        tokens.push({ kind: 'string', value: string.value, line })
        cursor = string.end
        continue
      }

      if (isDigit(character)) {
        let value = ''
        while (cursor < text.length && isDigit(text[cursor] ?? '')) {
          value += text[cursor]
          cursor += 1
        }
        if (text[cursor] === '.') {
          value += '.'
          cursor += 1
          while (cursor < text.length && isDigit(text[cursor] ?? '')) {
            value += text[cursor]
            cursor += 1
          }
        }
        tokens.push({ kind: 'number', value, line })
        continue
      }

      if (isNameStart(character)) {
        let value = ''
        while (cursor < text.length && isNamePart(text[cursor] ?? '')) {
          value += text[cursor]
          cursor += 1
        }
        tokens.push({ kind: KEYWORDS.has(value) ? 'keyword' : 'name', value, line })
        continue
      }

      const operator = OPERATORS.find((candidate) => text.startsWith(candidate, cursor))
      if (operator === undefined) {
        throw new ProgramError(line, `No entiendo el símbolo «${character}»`)
      }
      tokens.push({ kind: 'op', value: operator, line })
      cursor += operator.length
    }

    tokens.push({ kind: 'newline', value: '', line })
  })

  const lastLine = source.split('\n').length
  while (indents.length > 1) {
    indents.pop()
    tokens.push({ kind: 'dedent', value: '', line: lastLine })
  }
  tokens.push({ kind: 'eof', value: '', line: lastLine })

  return tokens
}
