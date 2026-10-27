/**
 * Valor simple que viaja entre la API de un nivel y el código del alumno:
 * números, textos, booleanos y None.
 */
export type Scalar = number | string | boolean | null

/** Una función del alumno que un minijuego puede llamar tantas veces como quiera. */
export type ApiFunction = (...args: Value[]) => Value | void

/**
 * Lo que un motor de nivel recibe y devuelve: los valores simples, las listas
 * (que viajan como arrays para que ningún motor conozca el AST del intérprete)
 * y las funciones del alumno, que un motor llama como si fueran suyas.
 */
export type Value = Scalar | Value[] | { [key: string]: Value } | ApiFunction

/** Distingue una función del alumno del resto de valores que viajan a la API. */
export function isApiFunction(value: Value): value is ApiFunction {
  return typeof value === 'function'
}

/**
 * Funciones que un nivel ofrece al código del alumno. Pueden devolver un valor
 * simple, una lista o nada, y pueden recibir funciones del alumno que vuelven
 * al intérprete cuando el motor las llama.
 */
export type Api = Record<string, (...args: Value[]) => Value | void>

/**
 * Error lanzado por la API de un minijuego. El intérprete lo convierte en un
 * error de la línea que lo provocó, con el número de línea correcto.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    /** El tipo de error de Python que puede cazar el alumno: ValueError, KeyError… */
    readonly kind: string = 'Error',
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
