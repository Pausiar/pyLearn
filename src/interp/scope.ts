import type { RuntimeValue } from './values'

/**
 * Ámbito de nombres. La asignación crea la variable en el ámbito actual, como
 * en Python; la lectura sube por la cadena, así que una función ve lo global y
 * también sus parámetros.
 *
 * Además, un nombre que el cuerpo de una función asigna es local desde el
 * principio: se declara al entrar y leerlo antes de darle valor es un error,
 * igual que en Python.
 */
export class Scope {
  private readonly vars = new Map<string, RuntimeValue>()
  private readonly locals = new Set<string>()

  constructor(private readonly parent: Scope | null = null) {}

  /** Marca un nombre como local aunque todavía no tenga valor. */
  declare(name: string): void {
    this.locals.add(name)
  }

  define(name: string, value: RuntimeValue): void {
    this.vars.set(name, value)
  }

  lookup(name: string): RuntimeValue | undefined {
    if (this.vars.has(name)) return this.vars.get(name)
    if (this.locals.has(name)) return undefined
    return this.parent?.lookup(name)
  }

  /** Un nombre local que todavía no tiene valor (se lee antes de asignarlo). */
  isPending(name: string): boolean {
    return this.locals.has(name) && !this.vars.has(name)
  }
}
