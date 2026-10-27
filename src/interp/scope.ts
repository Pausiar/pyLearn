import type { RuntimeValue } from './values'

/**
 * Ámbito de nombres. La asignación crea la variable en el ámbito actual, como
 * en Python; la lectura sube por la cadena, así que una función ve lo global y
 * también sus parámetros.
 */
export class Scope {
  private readonly vars = new Map<string, RuntimeValue>()

  constructor(private readonly parent: Scope | null = null) {}

  define(name: string, value: RuntimeValue): void {
    this.vars.set(name, value)
  }

  lookup(name: string): RuntimeValue | undefined {
    if (this.vars.has(name)) return this.vars.get(name)
    return this.parent?.lookup(name)
  }
}
