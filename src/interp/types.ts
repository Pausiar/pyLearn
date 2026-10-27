/**
 * Valor simple que viaja entre la API de un nivel y el código del alumno:
 * números, textos, booleanos y None.
 */
export type Scalar = number | string | boolean | null

/**
 * Lo que un motor de nivel recibe y devuelve: los valores simples y las listas,
 * que viajan como arrays para que ningún motor conozca el AST del intérprete.
 */
export type Value = Scalar | Value[]

/**
 * Funciones que un nivel ofrece al código del alumno. Pueden devolver un valor
 * simple (el input() simulado de la tienda, la luz del semáforo), una lista (los
 * vagones del tren) o nada.
 */
export type Api = Record<string, (...args: Value[]) => Value | void>

/**
 * Error lanzado por la API de un minijuego. El intérprete lo convierte en un
 * error de la línea que lo provocó, con el número de línea correcto.
 */
export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}
