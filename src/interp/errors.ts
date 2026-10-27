/**
 * Error del programa del alumno con el número de línea que lo provocó.
 *
 * Todo lo que el alumno puede equivocar (sintaxis, nombre, tipo, límites) sale
 * como un `ProgramError`; la capa pública lo convierte en datos, nunca en una
 * excepción que llegue a la interfaz.
 */
export class ProgramError extends Error {
  constructor(
    readonly line: number,
    message: string,
    /** El tipo de error de Python: ValueError, KeyError… Se caza con except. */
    readonly kind: string = 'Error',
  ) {
    super(message)
    this.name = 'ProgramError'
  }
}
