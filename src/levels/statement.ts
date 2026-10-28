export type StatementPart =
  | { code: false; text: string }
  | { code: true; text: string }

interface Atom {
  end: number
  signal: boolean
  literal: boolean
}

interface Operator {
  end: number
  kind: string
}

const PYTHON_WORDS = new Set([
  'False',
  'None',
  'True',
  'and',
  'break',
  'class',
  'continue',
  'def',
  'elif',
  'else',
  'except',
  'for',
  'if',
  'in',
  'is',
  'not',
  'or',
  'return',
  'try',
  'while',
  'with',
  'self',
])

const COMPARISONS = new Set(['==', '!=', '<=', '>=', '<', '>'])

const isIdentifierStart = (char: string | undefined) => char !== undefined && /[\p{L}_]/u.test(char)
const isWordChar = (char: string | undefined) => char !== undefined && /[\p{L}\p{N}_]/u.test(char)
const isDigit = (char: string | undefined) => char !== undefined && /[0-9]/.test(char)

function readIdentifier(text: string, index: number): number {
  if (!isIdentifierStart(text[index])) return -1
  let end = index + 1
  while (end < text.length && isWordChar(text[end])) end++
  return end
}

function skipString(text: string, index: number): number {
  const quote = text[index]
  let end = index + 1
  while (end < text.length) {
    const char = text[end]
    if (char === '\\') {
      end += 2
      continue
    }
    if (char === quote) return end + 1
    if (char === '\n') return -1
    end++
  }
  return -1
}

function skipSpaces(text: string, index: number): number {
  let end = index
  while (end < text.length && (text[end] === ' ' || text[end] === '\t')) end++
  return end
}

function matchBalanced(text: string, index: number, open: string, close: string): number {
  let depth = 0
  let end = index
  while (end < text.length) {
    const char = text[end]
    if (char === '"' || char === "'") {
      const stringEnd = skipString(text, end)
      if (stringEnd < 0) return -1
      end = stringEnd
      continue
    }
    if (char === open) depth++
    else if (char === close) {
      depth--
      if (depth === 0) return end + 1
    } else if (char === '\n') return -1
    end++
  }
  return -1
}

function parseChain(text: string, index: number): { end: number; signal: boolean } | null {
  let end = readIdentifier(text, index)
  if (end < 0) return null

  let signal = false
  for (;;) {
    if (text[end] === '.' && isIdentifierStart(text[end + 1])) {
      end = readIdentifier(text, end + 1)
      signal = true
      continue
    }
    const closer = text[end] === '[' ? ']' : text[end] === '(' ? ')' : null
    if (!closer) break
    const balancedEnd = matchBalanced(text, end, text[end], closer)
    if (balancedEnd < 0) return null
    end = balancedEnd
    signal = true
  }
  return { end, signal }
}

function parseTarget(text: string, index: number): number | null {
  let end = readIdentifier(text, index)
  if (end < 0) return null

  for (;;) {
    if (text[end] === '.' && isIdentifierStart(text[end + 1])) {
      end = readIdentifier(text, end + 1)
      continue
    }
    if (text[end] === '[') {
      const balancedEnd = matchBalanced(text, end, '[', ']')
      if (balancedEnd < 0) return null
      end = balancedEnd
      continue
    }
    break
  }
  return end
}

function parseAtom(text: string, index: number): Atom | null {
  const char = text[index]

  if (char === '"' || char === "'") {
    const end = skipString(text, index)
    return end < 0 ? null : { end, signal: true, literal: true }
  }

  if (isDigit(char)) {
    let end = index
    while (end < text.length && isDigit(text[end])) end++
    if (text[end] === '.' && isDigit(text[end + 1])) {
      end++
      while (end < text.length && isDigit(text[end])) end++
    }
    return { end, signal: false, literal: true }
  }

  if (char === '[' || char === '{') {
    const close = char === '[' ? ']' : '}'
    const end = matchBalanced(text, index, char, close)
    return end < 0 ? null : { end, signal: true, literal: false }
  }

  if (char === '(') {
    const end = matchBalanced(text, index, '(', ')')
    return end < 0 ? null : { end, signal: false, literal: false }
  }

  if (isIdentifierStart(char)) {
    const chain = parseChain(text, index)
    return chain ? { end: chain.end, signal: chain.signal, literal: false } : null
  }

  return null
}

function matchOperator(text: string, index: number): Operator | null {
  const pair = text.slice(index, index + 2)
  if (pair === '**' || pair === '==' || pair === '!=' || pair === '<=' || pair === '>=') {
    return { end: index + 2, kind: pair }
  }
  const char = text[index]
  if (char !== undefined && '+-*%<>'.includes(char)) return { end: index + 1, kind: char }
  return null
}

function matchWordOperator(text: string, index: number): Operator | null {
  for (const word of ['not in', 'is not', 'and', 'or', 'in', 'is', 'not']) {
    if (
      text.startsWith(word, index) &&
      !isWordChar(text[index - 1]) &&
      !isWordChar(text[index + word.length])
    ) {
      return { end: index + word.length, kind: word }
    }
  }
  return null
}

function parseExpression(text: string, index: number): { end: number; standalone: boolean } | null {
  const first = parseAtom(text, index)
  if (!first) return null

  const atoms = [first]
  const operators: string[] = []
  let end = first.end

  for (;;) {
    const spaced = skipSpaces(text, end)
    const operator = matchOperator(text, spaced) ?? matchWordOperator(text, spaced)
    if (!operator) break
    const next = parseAtom(text, skipSpaces(text, operator.end))
    if (!next) break
    operators.push(operator.kind)
    atoms.push(next)
    end = next.end
  }

  const hasSignal = atoms.some((atom) => atom.signal)
  const hasComparison = operators.some((kind, position) => {
    if (!COMPARISONS.has(kind)) return false
    const left = atoms[position]
    const right = atoms[position + 1]
    return left.signal || left.literal || right.signal || right.literal
  })

  return { end, standalone: hasSignal || hasComparison }
}

function matchConstruct(text: string, index: number): number | null {
  const wordEnd = readIdentifier(text, index)
  if (wordEnd < 0) return null

  const word = text.slice(index, wordEnd)
  const after = skipSpaces(text, wordEnd)

  if (word === 'for') {
    const variableEnd = readIdentifier(text, after)
    if (variableEnd < 0) return null
    const inPosition = skipSpaces(text, variableEnd)
    if (!text.startsWith('in', inPosition) || isWordChar(text[inPosition + 2])) return null
    const expression = parseExpression(text, skipSpaces(text, inPosition + 2))
    if (!expression) return null
    const colon = skipSpaces(text, expression.end)
    return text[colon] === ':' ? colon + 1 : null
  }

  if (word === 'if' || word === 'elif' || word === 'while') {
    const expression = parseExpression(text, after)
    if (!expression) return null
    const colon = skipSpaces(text, expression.end)
    return text[colon] === ':' ? colon + 1 : null
  }

  if (word === 'def') {
    const nameEnd = readIdentifier(text, after)
    if (nameEnd < 0) return null
    const paren = skipSpaces(text, nameEnd)
    if (text[paren] !== '(') return null
    const paramsEnd = matchBalanced(text, paren, '(', ')')
    if (paramsEnd < 0) return null
    const colon = skipSpaces(text, paramsEnd)
    return text[colon] === ':' ? colon + 1 : null
  }

  if (word === 'class') {
    const nameEnd = readIdentifier(text, after)
    if (nameEnd < 0) return null
    let end = nameEnd
    if (text[end] === '(') {
      const basesEnd = matchBalanced(text, end, '(', ')')
      if (basesEnd < 0) return null
      end = basesEnd
    }
    const colon = skipSpaces(text, end)
    return text[colon] === ':' ? colon + 1 : null
  }

  if (word === 'with') {
    const expression = parseExpression(text, after)
    if (!expression) return null
    const asPosition = skipSpaces(text, expression.end)
    if (!text.startsWith('as', asPosition) || isWordChar(text[asPosition + 2])) return null
    const nameEnd = readIdentifier(text, skipSpaces(text, asPosition + 2))
    if (nameEnd < 0) return null
    const colon = skipSpaces(text, nameEnd)
    return text[colon] === ':' ? colon + 1 : null
  }

  if (word === 'except') {
    let end = isIdentifierStart(text[after]) ? readIdentifier(text, after) : after
    const asPosition = skipSpaces(text, end)
    if (text.startsWith('as', asPosition) && !isWordChar(text[asPosition + 2])) {
      end = readIdentifier(text, skipSpaces(text, asPosition + 2))
      if (end < 0) return null
    }
    const colon = skipSpaces(text, end)
    return text[colon] === ':' ? colon + 1 : null
  }

  if (word === 'try' || word === 'else') {
    return text[after] === ':' ? after + 1 : null
  }

  return null
}

function matchAssignment(text: string, index: number): number | null {
  const targetEnd = parseTarget(text, index)
  if (targetEnd === null) return null
  const equals = skipSpaces(text, targetEnd)
  if (text[equals] !== '=' || text[equals + 1] === '=') return null
  const expression = parseExpression(text, skipSpaces(text, equals + 1))
  return expression ? expression.end : null
}

function codeEndAt(text: string, index: number): number | null {
  if (isWordChar(text[index - 1])) return null

  const constructEnd = matchConstruct(text, index)
  if (constructEnd !== null) return constructEnd

  const assignmentEnd = matchAssignment(text, index)
  if (assignmentEnd !== null) return assignmentEnd

  const expression = parseExpression(text, index)
  if (expression?.standalone) return expression.end

  const wordEnd = readIdentifier(text, index)
  if (wordEnd > 0) {
    const word = text.slice(index, wordEnd)
    if (PYTHON_WORDS.has(word) || /^__[A-Za-z0-9_]+__$/.test(word) || /^[A-Z][A-Za-z0-9]*Error$/.test(word)) {
      return wordEnd
    }
  }

  if (text.startsWith('==', index)) return index + 2
  if (text[index] === '+' && (index === 0 || text[index - 1] === ' ')) return index + 1
  return null
}

/**
 * Los enunciados son prosa con código incrustado, sin marcas. Se detectan las
 * construcciones de Python (llamadas, asignaciones, bloques y palabras clave)
 * para poder pintarlas aparte; lo que va entre «» es salida esperada y no se toca.
 */
export function splitStatement(text: string): StatementPart[] {
  const parts: StatementPart[] = []
  let textStart = 0
  let index = 0

  while (index < text.length) {
    const char = text[index]

    if (char === '«') {
      const close = text.indexOf('»', index + 1)
      index = close < 0 ? text.length : close + 1
      continue
    }

    const startsCode =
      isIdentifierStart(char) ||
      char === '"' ||
      char === "'" ||
      char === '[' ||
      char === '{' ||
      char === '+' ||
      char === '='

    if (!isWordChar(text[index - 1]) && startsCode) {
      const end = codeEndAt(text, index)
      if (end !== null && end > index) {
        if (index > textStart) parts.push({ code: false, text: text.slice(textStart, index) })
        parts.push({ code: true, text: text.slice(index, end) })
        index = end
        textStart = end
        continue
      }
    }

    index++
  }

  if (textStart < text.length) parts.push({ code: false, text: text.slice(textStart) })
  return parts
}
