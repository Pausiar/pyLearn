/**
 * Piezas para dibujar las escenas: todo se ajusta a píxeles enteros y se
 * compone con rectángulos, tramas y contornos. Sin degradados suaves ni
 * imágenes externas: la nitidez es parte del estilo.
 */

export function rect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  colour: string,
): void {
  context.fillStyle = colour
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height))
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
  context.fillText(value, Math.round(x), Math.round(y))
}

export function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`
}

/** Hash determinista: la misma semilla dibuja siempre la misma escena. */
export function rand(seed: number): number {
  let value = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b)
  value ^= value >>> 13
  value = Math.imul(value, 0xc2b2ae35)
  value ^= value >>> 16
  return (value >>> 0) / 4294967296
}

function components(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((part) => part + part).join('') : clean
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ]
}

export function mix(from: string, to: string, amount: number): string {
  const a = components(from)
  const b = components(to)
  const t = Math.max(0, Math.min(1, amount))
  const channels = a.map((value, index) => Math.round(value + (b[index] - value) * t))
  return `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

export function alpha(colour: string, opacity: number): string {
  const [r, g, b] = components(colour)
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, opacity))})`
}

/** Franjas horizontales cuantizadas: un degradado que sigue pareciendo pixel art. */
export function gradient(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  top: string,
  bottom: string,
  bands = 8,
): void {
  for (let band = 0; band < bands; band += 1) {
    const start = Math.round((band * height) / bands)
    const end = Math.round(((band + 1) * height) / bands)
    rect(context, x, y + start, width, end - start, mix(top, bottom, band / Math.max(1, bands - 1)))
  }
}

/** Trama de tablero de ajedrez a un píxel: la sombra del pixel art. */
export function dither(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  colour: string,
  step = 2,
  offset = 0,
): void {
  context.fillStyle = colour
  for (let row = 0; row < height; row += step) {
    for (let column = (row / step + offset) % step === 0 ? 0 : 1; column < width; column += step) {
      context.fillRect(Math.round(x + column), Math.round(y + row), 1, 1)
    }
  }
}

export function speckle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  colour: string,
  seed: number,
  count: number,
): void {
  context.fillStyle = colour
  for (let index = 0; index < count; index += 1) {
    const px = Math.floor(rand(seed + index * 17) * width)
    const py = Math.floor(rand(seed + index * 31 + 5) * height)
    const big = rand(seed + index * 53 + 9) > 0.82
    context.fillRect(Math.round(x + px), Math.round(y + py), big ? 2 : 1, 1)
  }
}

/** Línea de un píxel, sin suavizado (Bresenham). */
export function line(
  context: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  colour: string,
): void {
  let x = Math.round(x0)
  let y = Math.round(y0)
  const targetX = Math.round(x1)
  const targetY = Math.round(y1)
  const dx = Math.abs(targetX - x)
  const dy = -Math.abs(targetY - y)
  const sx = x < targetX ? 1 : -1
  const sy = y < targetY ? 1 : -1
  let error = dx + dy
  context.fillStyle = colour
  for (;;) {
    context.fillRect(x, y, 1, 1)
    if (x === targetX && y === targetY) break
    const doubled = 2 * error
    if (doubled >= dy) {
      error += dy
      x += sx
    }
    if (doubled <= dx) {
      error += dx
      y += sy
    }
  }
}

/** Disco de píxeles duros, dibujado por filas. */
export function disc(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  colour: string,
): void {
  const r = Math.max(1, Math.round(radius))
  context.fillStyle = colour
  for (let row = -r; row <= r; row += 1) {
    const half = Math.floor(Math.sqrt(r * r - row * row))
    context.fillRect(Math.round(cx) - half, Math.round(cy) + row, half * 2 + 1, 1)
  }
}

export function ring(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  colour: string,
): void {
  const r = Math.max(1, Math.round(radius))
  context.fillStyle = colour
  for (let row = -r; row <= r; row += 1) {
    const half = Math.floor(Math.sqrt(r * r - row * row))
    context.fillRect(Math.round(cx) - half, Math.round(cy) + row, 1, 1)
    context.fillRect(Math.round(cx) + half, Math.round(cy) + row, 1, 1)
  }
  context.fillRect(Math.round(cx), Math.round(cy) - r, 1, 1)
  context.fillRect(Math.round(cx), Math.round(cy) + r, 1, 1)
}

/** Halo escalonado: varias coronas con menos opacidad, sin desenfoque. */
export function glow(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  colour: string,
  strength = 0.5,
): void {
  for (let step = Math.round(radius); step >= 2; step -= 2) {
    context.globalAlpha = strength * (1 - step / radius) + 0.08
    disc(context, cx, cy, step, colour)
  }
  context.globalAlpha = 1
}

/** Caja con luz arriba a la izquierda y sombra abajo a la derecha. */
export function bevel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  light: string,
  dark: string,
  ink?: string,
): void {
  rect(context, x, y, width, height, fill)
  rect(context, x, y, width, 1, light)
  rect(context, x, y, 1, height, light)
  rect(context, x, y + height - 1, width, 1, dark)
  rect(context, x + width - 1, y, 1, height, dark)
  if (ink) {
    rect(context, x - 1, y - 1, width + 2, 1, ink)
    rect(context, x - 1, y + height, width + 2, 1, ink)
    rect(context, x - 1, y, 1, height, ink)
    rect(context, x + width, y, 1, height, ink)
  }
}

/** Ventana encendida o apagada, con marco y reflejo. */
export function windowPane(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  lit: boolean,
  frame = '#2a3147',
  glow = '#ffd86a',
): void {
  rect(context, x, y, width, height, frame)
  rect(context, x + 1, y + 1, width - 2, height - 2, lit ? glow : '#1b2440')
  if (lit) {
    rect(context, x + 2, y + 2, Math.max(1, Math.floor(width / 3)), 1, '#fff3c4')
    dither(context, x + 1, y + 1, width - 2, height - 2, alpha('#ffffff', 0.18), 2)
  }
  rect(context, x + Math.floor(width / 2), y + 1, 1, height - 2, frame)
  rect(context, x + 1, y + Math.floor(height / 2), width - 2, 1, frame)
}

/** Estrellas deterministas que parpadean por capas. */
export function starfield(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  colour: string,
  seed: number,
  count: number,
  time = 0,
  reduced = true,
): void {
  for (let index = 0; index < count; index += 1) {
    const px = Math.round(x + rand(seed + index * 13) * width)
    const py = Math.round(y + rand(seed + index * 29 + 3) * height)
    const phase = rand(seed + index * 7 + 11) * 6.28
    const twinkle = reduced ? 1 : 0.55 + 0.45 * Math.sin(time / 520 + phase)
    context.globalAlpha = twinkle
    context.fillStyle = colour
    const big = rand(seed + index * 41 + 2) > 0.86
    context.fillRect(px, py, 1, 1)
    if (big) {
      context.fillRect(px - 1, py, 3, 1)
      context.fillRect(px, py - 1, 1, 3)
    }
  }
  context.globalAlpha = 1
}

/** Nube de bloques, con borde inferior sombreado. */
export function cloud(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  body: string,
  shade: string,
): void {
  const height = Math.max(4, Math.round(width / 3))
  rect(context, x + Math.round(width * 0.18), y, Math.round(width * 0.64), height, body)
  rect(context, x, y + Math.round(height * 0.3), width, height, body)
  rect(context, x + Math.round(width * 0.3), y - Math.round(height * 0.25), Math.round(width * 0.4), Math.round(height * 0.3), body)
  rect(context, x + 2, y + height, width - 4, 1, shade)
}

/** Colinas lejanas recortadas contra el cielo. */
export function hills(
  context: CanvasRenderingContext2D,
  baseY: number,
  height: number,
  colour: string,
  seed: number,
  step = 4,
): void {
  context.fillStyle = colour
  for (let x = 0; x < 224; x += step) {
    const wave =
      Math.sin((x + seed) / 26) * 0.45 + Math.sin((x + seed * 3) / 11) * 0.2 + 0.65
    const top = Math.round(baseY - height * Math.max(0, wave))
    context.fillRect(x, top, step, baseY - top)
  }
}

/** Suelo con grano: base, banda de luz y motas deterministas. */
export function groundTexture(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  light: string,
  dark: string,
  seed: number,
): void {
  rect(context, x, y, width, height, fill)
  rect(context, x, y, width, 1, light)
  speckle(context, x, y + 2, width, height - 2, dark, seed, Math.max(8, Math.round(width / 5)))
  speckle(context, x, y + 1, width, height - 1, light, seed + 991, Math.max(4, Math.round(width / 12)))
}

/** Muro de ladrillo con juntas alternas. */
export function brickWall(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  mortar: string,
): void {
  rect(context, x, y, width, height, mortar)
  const brickWidth = 10
  const brickHeight = 5
  for (let row = 0; row < Math.ceil(height / brickHeight); row += 1) {
    const offset = row % 2 === 0 ? 0 : -Math.floor(brickWidth / 2)
    for (let column = offset; column < width; column += brickWidth) {
      const bx = Math.max(x, x + column)
      const bw = Math.min(brickWidth - 1, x + width - bx)
      if (bw <= 0) continue
      rect(context, bx, y + row * brickHeight, bw, brickHeight - 1, fill)
      rect(context, bx, y + row * brickHeight, bw, 1, mix(fill, '#ffffff', 0.18))
    }
  }
}

/** Panel de datos con borde de un píxel. */
export function panel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill = 'rgba(16,18,31,0.82)',
  border = '#4a5568',
): void {
  context.fillStyle = fill
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height))
  context.strokeStyle = border
  context.lineWidth = 1
  context.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(width) - 1, Math.round(height) - 1)
}

/** Barra de progreso pixelada. */
export function bar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  value: number,
  fill: string,
  track: string,
): void {
  rect(context, x, y, width, height, track)
  const filled = Math.round(width * Math.max(0, Math.min(1, value)))
  if (filled > 0) {
    rect(context, x, y, filled, height, fill)
    rect(context, x, y, filled, 1, mix(fill, '#ffffff', 0.35))
  }
}
