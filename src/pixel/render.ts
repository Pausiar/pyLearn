import { CROPS } from '../engine/drone'
import { PALETTE } from './palette'
import { SPRITES } from './sprites'

export const LOGICAL_WIDTH = 224
export const LOGICAL_HEIGHT = 128

const TILE = 32
const PIXEL = 4
const SKY_HEIGHT = 80

const PIXELS: Record<string, string> = {
  k: PALETTE.night,
  c: PALETTE.glass,
  w: PALETTE.cloud,
  g: PALETTE.metal,
  y: PALETTE.sun,
  n: PALETTE.stem,
  s: PALETTE.soilDark,
  G: PALETTE.leaf,
  r: PALETTE.fruit,
}

const CLOUDS: readonly (readonly [number, number, number])[] = [
  [16, 14, 28],
  [150, 26, 32],
  [92, 8, 16],
]

const SPECKS: readonly (readonly [number, number])[] = Array.from({ length: 22 }, (_, index) => [
  (index * 37) % 216,
  92 + ((index * 23) % 30),
])

export interface SceneView {
  x: number
  targetX: number
  watered: Set<number>
  dropStart: number | null
  time: number
}

function drawSprite(
  context: CanvasRenderingContext2D,
  rows: readonly string[],
  x: number,
  y: number,
): void {
  rows.forEach((row, rowIndex) => {
    for (let column = 0; column < row.length; column += 1) {
      const colour = PIXELS[row[column] ?? '']
      if (!colour) continue
      context.fillStyle = colour
      context.fillRect(x + column * PIXEL, y + rowIndex * PIXEL, PIXEL, PIXEL)
    }
  })
}

export function drawField(
  context: CanvasRenderingContext2D,
  view: SceneView,
  reducedMotion: boolean,
): void {
  context.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)

  context.fillStyle = PALETTE.sky
  context.fillRect(0, 0, LOGICAL_WIDTH, SKY_HEIGHT)

  context.fillStyle = PALETTE.cloud
  CLOUDS.forEach(([x, y, width]) => context.fillRect(x, y, width, 8))

  context.fillStyle = PALETTE.grass
  context.fillRect(0, 80, LOGICAL_WIDTH, 6)

  context.fillStyle = PALETTE.soil
  context.fillRect(0, 86, LOGICAL_WIDTH, 42)

  context.fillStyle = PALETTE.soilSpeck
  SPECKS.forEach(([x, y]) => context.fillRect(x, y, 6, 4))

  context.fillStyle = PALETTE.pad
  context.fillRect(0, 76, 32, 4)

  CROPS.forEach((crop) => {
    drawSprite(
      context,
      view.watered.has(crop) ? SPRITES.wetPlant : SPRITES.dryPlant,
      crop * TILE,
      48,
    )
  })

  const bob = reducedMotion ? 0 : Math.round(Math.sin(view.time / 300) * 3)
  drawSprite(context, SPRITES.drone, Math.round(view.x * TILE), 16 + bob)

  if (view.dropStart !== null) {
    const fall = Math.min(1, (view.time - view.dropStart) / 400)
    context.fillStyle = PALETTE.water
    for (const drop of [0, 1]) {
      const x = Math.round(view.x * TILE) + 10 + drop * 8
      const y = 40 + Math.round(fall * 32) + drop * 6
      context.fillRect(x, y, 4, 4)
    }
  }
}
