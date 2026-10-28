import { CROPS } from '../engine/drone'
import { COLORS, THEMES } from './palette'
import { drawSprite, SPRITES } from './sprites'
import {
  cloud,
  disc,
  dither,
  glow,
  gradient,
  groundTexture,
  hills,
  label,
  line,
  mix,
  panel,
  rand,
  rect,
  speckle,
} from './shapes'

export const LOGICAL_WIDTH = 224
export const LOGICAL_HEIGHT = 128

const TILE = 32
const SOIL_TOP = 88
const THEME = THEMES[1]

export interface SceneView {
  x: number
  targetX: number
  watered: Set<number>
  dropStart: number | null
  time: number
}

function drawSky(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  gradient(context, 0, 0, LOGICAL_WIDTH, SOIL_TOP - 8, THEME.skyTop, THEME.skyBottom, 9)
  dither(context, 0, 44, LOGICAL_WIDTH, 30, 'rgba(255,255,255,0.16)', 4)

  glow(context, 56, 18, 26, COLORS.yellow, 0.45)
  disc(context, 56, 18, 10, COLORS.gold)
  disc(context, 56, 17, 7, COLORS.yellow)
  rect(context, 54, 12, 4, 2, COLORS.cream)

  cloud(context, 8, 28, 30, COLORS.cloud, '#cfe9ff')
  cloud(context, 104, 30, 36, COLORS.cloud, '#cfe9ff')
  cloud(context, 140, 8, 26, COLORS.cloud, '#dff3ff')

  const flap = reduced ? 0 : Math.round(Math.sin(time / 260))
  for (const [x, y] of [
    [62, 24],
    [70, 20],
    [118, 34],
  ]) {
    line(context, x - 3, y, x, y + flap, COLORS.steel)
    line(context, x, y + flap, x + 3, y, COLORS.steel)
  }

  hills(context, SOIL_TOP - 6, 20, mix(THEME.silhouette, THEME.skyBottom, 0.35), 7)
  hills(context, SOIL_TOP - 4, 12, mix(THEME.silhouette, THEME.ground, 0.25), 23, 3)
}

function drawFence(context: CanvasRenderingContext2D): void {
  rect(context, 0, 72, LOGICAL_WIDTH, 2, '#b58a5a')
  rect(context, 0, 80, LOGICAL_WIDTH, 2, '#9a7044')
  for (let x = 6; x < LOGICAL_WIDTH; x += 28) {
    rect(context, x, 66, 3, 18, '#c79a68')
    rect(context, x, 66, 1, 18, '#e0b888')
    rect(context, x - 1, 66, 5, 2, '#8a5a2b')
  }
}

function drawWaterTower(context: CanvasRenderingContext2D): void {
  const x = 176
  rect(context, x + 6, 52, 4, 36, COLORS.woodDark)
  rect(context, x + 28, 52, 4, 36, COLORS.woodDark)
  line(context, x + 8, 60, x + 30, 74, COLORS.wood)
  line(context, x + 30, 60, x + 8, 74, COLORS.wood)
  rect(context, x, 32, 38, 22, COLORS.steel)
  rect(context, x, 32, 38, 3, COLORS.silver)
  rect(context, x + 2, 36, 34, 3, COLORS.stone)
  rect(context, x + 2, 46, 34, 4, COLORS.blue)
  rect(context, x + 4, 54, 30, 2, COLORS.steel)
  label(context, 'AGUA', x + 19, 45, 7, COLORS.ice, 'center')
  rect(context, x + 4, 30, 30, 2, COLORS.stone)
  rect(context, x + 16, 20, 6, 4, COLORS.steel)
  rect(context, x + 18, 16, 2, 6, COLORS.silver)
  rect(context, x + 18, 14, 2, 2, COLORS.coral)
}

function drawFieldFloor(context: CanvasRenderingContext2D): void {
  rect(context, 0, SOIL_TOP - 8, LOGICAL_WIDTH, 8, COLORS.green)
  rect(context, 0, SOIL_TOP - 8, LOGICAL_WIDTH, 2, '#66c96a')
  speckle(context, 0, SOIL_TOP - 6, LOGICAL_WIDTH, 6, COLORS.forest, 41, 34)

  groundTexture(context, 0, SOIL_TOP, LOGICAL_WIDTH, LOGICAL_HEIGHT - SOIL_TOP, '#6b4423', '#8a5f2e', '#4a2f18', 9)
  for (let y = SOIL_TOP + 8; y < LOGICAL_HEIGHT; y += 10) {
    for (let x = (y * 7) % 18; x < LOGICAL_WIDTH; x += 26) {
      rect(context, x, y, 9 + ((x + y) % 7), 1, '#5a3a1f')
      rect(context, x + 2, y + 1, 4, 1, '#7d5227')
    }
  }
  speckle(context, 0, SOIL_TOP + 2, LOGICAL_WIDTH, 38, '#3d2714', 77, 28)
  speckle(context, 0, SOIL_TOP + 4, LOGICAL_WIDTH, 34, '#8a5f2e', 131, 12)
}

function drawPad(context: CanvasRenderingContext2D): void {
  rect(context, 2, 82, 30, 6, COLORS.steel)
  rect(context, 2, 82, 30, 1, '#8d99ad')
  rect(context, 6, 84, 22, 2, '#4a5568')
  label(context, 'H', 17, 81, 6, COLORS.ice, 'center')
}

function drawCrops(context: CanvasRenderingContext2D, view: SceneView, reduced: boolean): void {
  CROPS.forEach((crop) => {
    const wet = view.watered.has(crop)
    const x = crop * TILE
    const centre = x + TILE / 2

    rect(context, centre - 13, SOIL_TOP - 2, 26, 4, '#57381c')
    disc(context, centre, SOIL_TOP + 1, 12, '#5f3d1f')
    disc(context, centre, SOIL_TOP, 10, '#6f4824')
    rect(context, centre - 7, SOIL_TOP - 1, 6, 1, '#83562b')

    drawSprite(context, wet ? SPRITES.wetPlant : SPRITES.dryPlant, x + 4, SOIL_TOP - 25, {
      scale: 2,
      outline: '#241508',
    })

    if (wet) {
      const shimmer = reduced ? 1 : 0.5 + 0.5 * Math.sin(view.time / 300 + crop)
      context.globalAlpha = 0.55 + shimmer * 0.45
      rect(context, centre - 12, SOIL_TOP - 20, 2, 2, COLORS.yellow)
      rect(context, centre + 10, SOIL_TOP - 13, 2, 2, COLORS.cream)
      context.globalAlpha = 1
    } else {
      dither(context, centre - 8, SOIL_TOP - 6, 16, 4, 'rgba(255,255,255,0.12)', 2)
    }
  })
}

function drawDrone(context: CanvasRenderingContext2D, view: SceneView, reduced: boolean): void {
  const x = Math.round(view.x * TILE)
  const bob = reduced ? 0 : Math.round(Math.sin(view.time / 300) * 2)
  const y = 24 + bob

  dither(context, x + 6, SOIL_TOP + 2, 22, 6, 'rgba(20,12,4,0.35)', 2)
  drawSprite(context, SPRITES.drone, x, y, { scale: 2, outline: '#0a0d16' })

  const rotor = reduced ? 0 : Math.round(Math.sin(view.time / 60)) * 2
  rect(context, x + 1 - rotor, y - 1, 7 + rotor * 2, 1, COLORS.silver)
  rect(context, x + 24 - rotor, y - 1, 7 + rotor * 2, 1, COLORS.silver)

  if (view.dropStart !== null) {
    const fall = Math.min(1, (view.time - view.dropStart) / 360)
    const dropY = 46 + fall * 34
    for (const drop of [0, 1]) {
      const dx = x + 12 + drop * 8
      const dy = dropY + drop * 5
      rect(context, dx, dy, 2, 3, COLORS.water)
      rect(context, dx, dy, 1, 1, COLORS.ice)
      dither(context, dx - 2, dy - 3, 6, 3, 'rgba(90,209,255,0.35)', 2)
    }
    if (fall > 0.86) {
      disc(context, x + TILE / 2, SOIL_TOP - 2, 5 + Math.round(fall * 3), COLORS.water)
    }
  }
}

/** El campo del dron: cielo con vida, surcos y plantas que responden al código. */
export function drawField(
  context: CanvasRenderingContext2D,
  view: SceneView,
  reducedMotion: boolean,
): void {
  context.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
  drawSky(context, view.time, reducedMotion)
  drawFence(context)
  drawWaterTower(context)
  drawFieldFloor(context)
  drawPad(context)
  drawCrops(context, view, reducedMotion)
  drawDrone(context, view, reducedMotion)

  if (view.watered.size === CROPS.length) {
    const sparkle = reducedMotion ? 0 : Math.sin(view.time / 240)
    for (let index = 0; index < 5; index += 1) {
      const sx = 34 + Math.round(rand(index * 7) * 120)
      const sy = 50 + Math.round(rand(index * 13 + 2) * 22)
      context.globalAlpha = 0.6 + sparkle * 0.3
      drawSprite(context, SPRITES.spark, sx, sy, { scale: 1 })
      context.globalAlpha = 1
    }
    panel(context, 64, 8, 96, 16, 'rgba(16,18,31,0.78)', '#4caf50')
    label(context, '¡Campo regado!', 112, 19, 8, COLORS.lime, 'center')
  }
}
