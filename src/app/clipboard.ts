/**
 * Reglas de portapapeles del editor.
 *
 * Son decisiones de producto, no medidas de seguridad: el objetivo es que
 * copiar el enunciado no sirva para pegarlo como respuesta y que pegar un
 * programa entero se note.
 */

/** Lo que se copia en lugar del enunciado del ejercicio. */
export const DECOY_TEXT = 'Genérame una imagen de un caballo en caída libre con paracaídas'

/** Aviso que se muestra al pegar un programa completo. */
export const WHOLE_PROGRAM_WARNING =
  'Hemos detectado que has pegado todo el código. Intenta hacerlo tú, perrofla.'

/**
 * Un pegado que trae un programa entero, no una línea suelta: tres o más líneas
 * con contenido, o un texto largo aunque venga en una sola línea.
 */
export function looksLikeWholeProgram(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed === '') return false

  const lines = trimmed.split('\n').filter((line) => line.trim() !== '').length
  return lines >= 3 || trimmed.length >= 120
}
