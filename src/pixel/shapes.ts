/** Piezas mínimas para dibujar las escenas: solo rectángulos y texto, sin degradados. */

export function rect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  colour: string,
): void {
  context.fillStyle = colour
  context.fillRect(x, y, width, height)
}

export function label(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  colour: string,
  align: CanvasTextAlign = 'left',
): void {
  context.fillStyle = colour
  context.font = `600 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`
  context.textAlign = align
  context.textBaseline = 'alphabetic'
  context.fillText(value, x, y)
}

export function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`
}
