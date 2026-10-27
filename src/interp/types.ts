/** Un valor que el intérprete entiende hoy: número o texto. */
export type Value = number | string

/** Funciones que un nivel ofrece al código del alumno. */
export type Api = Record<string, (...args: Value[]) => void>

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
