/**
 * Valor simple que viaja entre la API de un nivel y el código del alumno:
 * números, textos, booleanos y None.
 */
export type Scalar = number | string | boolean | null

/**
 * Funciones que un nivel ofrece al código del alumno. Pueden devolver un valor
 * simple (el input() simulado de la tienda, la luz del semáforo) o nada.
 */
export type Api = Record<string, (...args: Scalar[]) => Scalar | void>

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
