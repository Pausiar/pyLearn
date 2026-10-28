import { useCallback, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { TRAIN_LOADS } from '../../engine/train'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { COLORS } from '../../pixel/palette'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import {
  alpha,
  disc,
  dither,
  glow,
  gradient,
  groundTexture,
  label,
  line,
  rect,
  speckle,
  truncate,
} from '../../pixel/shapes'

const WIDTH = 224

const WAGON_W = 24
const WAGON_STEP = 27
const WAGON_X = (index: number): number => 2 + index * WAGON_STEP
const WAGON_TOP = 54
const LOCO_X = 192

const BOARD_X = 14
const BOARD_Y = 21
const BOARD_W = 176
const BOARD_H = 29

const PLATFORM_Y = 86

const CARGO_COLOUR: Record<string, string> = {
  carbón: '#3c434d',
  madera: '#8a5a2b',
  agua: '#4aa8ff',
  ganado: '#e8e0cf',
  correo: '#f4f6fb',
  fruta: '#e88a3a',
  vacío: '#2b3546',
}

interface TrainView {
  loads: string[]
  sent: boolean
}

const RESTING: TrainView = { loads: [], sent: false }

function drawStation(context: CanvasRenderingContext2D): void {
  gradient(context, 0, 0, WIDTH, 18, '#0a0f16', '#1c2732', 5)
  rect(context, 0, 0, WIDTH, 3, '#273543')
  rect(context, 0, 0, WIDTH, 1, '#3d5162')
  rect(context, 0, 10, WIDTH, 2, '#22303c')
  rect(context, 0, 10, WIDTH, 1, '#32465a')

  for (let x = 0; x < WIDTH; x += 14) {
    line(context, x, 2, x + 7, 10, alpha('#33495a', 0.55))
    line(context, x + 7, 10, x + 14, 2, alpha('#33495a', 0.55))
  }

  for (const x of [36, 92, 148, 204]) {
    rect(context, x, 12, 1, 3, '#39445c')
    rect(context, x - 4, 15, 9, 2, '#233241')
    rect(context, x - 3, 15, 7, 1, '#39445c')
    rect(context, x - 2, 17, 5, 1, '#ffe0a0')
    glow(context, x, 19, 7, '#ffd27a', 0.05)
  }

  gradient(context, 0, 18, WIDTH, 68, '#1a2430', '#10161e', 7)
  dither(context, 0, 18, WIDTH, 68, alpha(COLORS.ink, 0.2), 3)
  for (const x of [0, 56, 112, 168, 224]) {
    rect(context, x - 1, 18, 2, 68, '#0c1118')
    rect(context, x, 18, 1, 68, alpha('#4a5f70', 0.12))
  }
  rect(context, 0, 50, WIDTH, 3, '#22303c')
  rect(context, 0, 50, WIDTH, 1, '#35485a')
}

function drawBoard(
  context: CanvasRenderingContext2D,
  view: TrainView,
  time: number,
  reduced: boolean,
): void {
  const loads = view.loads.length > 0 ? view.loads : TRAIN_LOADS
  const count = loads.length
  const first = loads[0] ?? '—'
  const last = loads[loads.length - 1] ?? '—'
  const sent = view.sent

  rect(context, 40, 17, 2, 5, '#39445c')
  rect(context, 164, 17, 2, 5, '#39445c')

  rect(context, BOARD_X, BOARD_Y, BOARD_W, BOARD_H, '#2a3a48')
  rect(context, BOARD_X, BOARD_Y, BOARD_W, 1, '#4f6575')
  rect(context, BOARD_X + 1, BOARD_Y + 1, BOARD_W - 2, BOARD_H - 2, '#0b1218')
  rect(context, BOARD_X + 2, BOARD_Y + 2, BOARD_W - 4, BOARD_H - 4, '#0e1720')
  rect(context, BOARD_X + 2, BOARD_Y + 2, BOARD_W - 4, 1, '#16222d')
  dither(
    context,
    BOARD_X + 2,
    BOARD_Y + 3,
    BOARD_W - 4,
    BOARD_H - 6,
    alpha('#8fd3ff', 0.035),
    2,
  )

  rect(context, BOARD_X + 7, BOARD_Y + 6, 2, 2, sent ? '#b8e986' : '#d9a441')
  label(context, 'SALIDAS', BOARD_X + 14, BOARD_Y + 9, 5, '#8fa3b5')
  label(
    context,
    sent ? 'EN MARCHA' : 'EN ESTACIÓN',
    BOARD_X + BOARD_W - 12,
    BOARD_Y + 9,
    5,
    sent ? '#b8e986' : '#8fa3b5',
    'right',
  )
  rect(context, BOARD_X + BOARD_W - 8, BOARD_Y + 6, 2, 2, sent ? '#b8e986' : '#d9a441')
  if (sent) {
    const pulse = reduced ? 0.12 : 0.09 + 0.04 * Math.sin(time / 240)
    glow(context, BOARD_X + BOARD_W - 7, BOARD_Y + 7, 5, COLORS.lime, pulse)
  }

  const rows: [string, string, string][] = [
    ['Vagones', String(count), COLORS.cream],
    ['Primero [0]', truncate(first, 16), COLORS.cream],
    ['Último [-1]', truncate(last, 16), last === 'vacío' ? '#ff9a8a' : '#b8e986'],
  ]
  rows.forEach(([name, value, colour], index) => {
    const baseline = BOARD_Y + 15 + index * 6
    label(context, name, BOARD_X + 14, baseline, 5, '#7f95a5')
    label(context, value, BOARD_X + BOARD_W - 14, baseline, 5, colour, 'right')
    for (let x = 68; x < 150; x += 4) {
      rect(context, x, baseline - 2, 1, 1, alpha('#4f6473', 0.5))
    }
  })

  rect(context, BOARD_X + 4, BOARD_Y + BOARD_H - 2, 2, 2, '#1b2a35')
  rect(context, BOARD_X + BOARD_W - 6, BOARD_Y + BOARD_H - 2, 2, 2, '#1b2a35')
}

function drawCargo(
  context: CanvasRenderingContext2D,
  load: string,
  x: number,
  y: number,
): void {
  switch (load) {
    case 'carbón': {
      rect(context, x + 1, y + 6, 16, 4, '#1c2129')
      const chunks: [number, number, number, number][] = [
        [1, 4, 4, 2],
        [6, 3, 3, 3],
        [10, 4, 3, 2],
        [14, 5, 2, 2],
        [3, 7, 4, 2],
        [9, 6, 4, 2],
      ]
      for (const [dx, dy, width, height] of chunks) {
        rect(context, x + dx, y + dy, width, height, '#3c434d')
        rect(context, x + dx, y + dy, width, 1, '#69737f')
      }
      break
    }
    case 'madera': {
      for (let log = 0; log < 3; log += 1) {
        const top = y + 2 + log * 3
        rect(context, x + 1, top, 16, 3, '#8a5a2b')
        rect(context, x + 1, top, 16, 1, '#b07a3f')
        rect(context, x + 1, top + 2, 16, 1, '#5c3a1c')
        const end = log % 2 === 0 ? x + 2 : x + 13
        rect(context, end, top, 2, 3, '#5c3a1c')
        rect(context, end, top + 1, 1, 1, '#d9b878')
      }
      break
    }
    case 'agua': {
      rect(context, x + 3, y + 2, 12, 8, '#2b6cb0')
      rect(context, x + 3, y + 2, 12, 2, '#8fd3ff')
      rect(context, x + 4, y + 2, 10, 1, '#cfefff')
      rect(context, x + 3, y + 8, 12, 1, '#1b4a7a')
      for (const band of [x + 7, x + 11]) rect(context, band, y + 4, 1, 4, '#1b4a7a')
      rect(context, x + 4, y + 4, 1, 4, '#5fb8f0')
      rect(context, x + 10, y + 1, 3, 1, '#d9a441')
      break
    }
    case 'ganado': {
      rect(context, x + 3, y + 4, 9, 4, '#e8e0cf')
      rect(context, x + 4, y + 3, 7, 1, '#f4efe2')
      rect(context, x + 5, y + 5, 2, 1, '#8a5a3a')
      rect(context, x + 9, y + 4, 2, 1, '#8a5a3a')
      rect(context, x + 12, y + 3, 4, 4, '#e8e0cf')
      rect(context, x + 15, y + 4, 1, 1, '#2a2020')
      rect(context, x + 12, y + 2, 1, 1, '#d9b878')
      rect(context, x + 2, y + 4, 1, 3, '#b9a98f')
      for (const leg of [x + 4, x + 7, x + 10]) rect(context, leg, y + 8, 1, 2, '#b9a98f')
      break
    }
    case 'correo': {
      rect(context, x + 3, y + 2, 8, 5, '#f4f6fb')
      rect(context, x + 3, y + 2, 8, 1, '#d7dde8')
      line(context, x + 3, y + 2, x + 7, y + 5, alpha('#5a6470', 0.5))
      line(context, x + 11, y + 2, x + 7, y + 5, alpha('#5a6470', 0.5))
      rect(context, x + 7, y + 4, 1, 1, '#e05263')
      rect(context, x + 8, y + 5, 8, 5, '#efe4c8')
      rect(context, x + 8, y + 5, 8, 1, '#d9c9a8')
      line(context, x + 8, y + 5, x + 12, y + 8, alpha('#5a6470', 0.5))
      line(context, x + 16, y + 5, x + 12, y + 8, alpha('#5a6470', 0.5))
      rect(context, x + 12, y + 7, 1, 1, '#e05263')
      break
    }
    case 'fruta': {
      rect(context, x + 3, y + 4, 13, 6, '#8a5a2b')
      rect(context, x + 3, y + 4, 13, 1, '#b07a3f')
      rect(context, x + 3, y + 9, 13, 1, '#5c3a1c')
      rect(context, x + 6, y + 4, 1, 6, '#5c3a1c')
      rect(context, x + 12, y + 4, 1, 6, '#5c3a1c')
      rect(context, x + 5, y + 2, 2, 2, '#e88a3a')
      rect(context, x + 5, y + 2, 2, 1, '#ffc857')
      rect(context, x + 9, y + 1, 2, 2, '#ffc857')
      rect(context, x + 13, y + 2, 2, 2, '#e05263')
      rect(context, x + 9, y + 1, 1, 1, '#4caf50')
      break
    }
    case 'vacío': {
      rect(context, x + 2, y + 8, 14, 2, '#332a1e')
      rect(context, x + 2, y + 8, 14, 1, '#4a3c2a')
      for (const plank of [x + 5, x + 9, x + 13]) rect(context, plank, y + 9, 1, 1, '#241d14')
      for (let dx = 3; dx < 15; dx += 3) {
        rect(context, x + dx, y + 3, 1, 1, alpha('#7f95a5', 0.45))
        rect(context, x + dx, y + 7, 1, 1, alpha('#7f95a5', 0.35))
      }
      for (let dy = 3; dy < 8; dy += 2) {
        rect(context, x + 2, y + dy, 1, 1, alpha('#7f95a5', 0.35))
        rect(context, x + 15, y + dy, 1, 1, alpha('#7f95a5', 0.35))
      }
      break
    }
    default: {
      rect(context, x + 4, y + 3, 10, 7, '#4a3a2a')
      rect(context, x + 4, y + 3, 10, 1, '#6b563a')
      rect(context, x + 4, y + 9, 10, 1, '#2a2118')
      rect(context, x + 8, y + 5, 2, 3, '#241d14')
    }
  }
}

function drawWagon(
  context: CanvasRenderingContext2D,
  index: number,
  load: string,
  last: boolean,
  view: TrainView,
  time: number,
  reduced: boolean,
  since: number,
): void {
  const x = WAGON_X(index)
  const empty = load === 'vacío'
  const sent = view.sent

  rect(context, x + 1, 82, 22, 2, alpha(COLORS.ink, 0.35))
  for (const wheel of [x + 6, x + 18]) {
    disc(context, wheel, 80, 2, '#0c1117')
    disc(context, wheel, 80, 1, '#28313c')
    rect(context, wheel, 80, 1, 1, '#77828e')
  }

  rect(context, x, WAGON_TOP, WAGON_W, 24, '#2c3b4a')
  rect(context, x, WAGON_TOP, WAGON_W, 3, '#5b6f82')
  rect(context, x, WAGON_TOP, WAGON_W, 1, '#8498aa')
  rect(context, x, WAGON_TOP + 2, WAGON_W, 1, '#3f5263')
  rect(context, x + 1, WAGON_TOP + 3, 22, 21, '#31424f')
  rect(context, x + 1, WAGON_TOP + 3, 1, 21, '#486070')
  rect(context, x + 22, WAGON_TOP + 3, 1, 21, '#1d2933')
  rect(context, x + 2, WAGON_TOP + 3, 1, 1, '#5c7183')
  rect(context, x + 21, WAGON_TOP + 3, 1, 1, '#5c7183')

  rect(context, x + 3, 58, 18, 11, empty ? '#0a1016' : '#0d151d')
  rect(context, x + 3, 58, 18, 1, '#1d2b36')
  rect(context, x + 3, 68, 18, 1, '#0a1016')
  drawCargo(context, load, x + 3, 58)

  label(
    context,
    truncate(load, 7),
    x + 12,
    76,
    5,
    empty ? '#8f9bb8' : '#ffe8b8',
    'center',
  )

  if (index < 6) {
    rect(context, x + 24, 71, 3, 2, '#4a5a6a')
  } else {
    rect(context, x + 24, 71, 4, 2, '#4a5a6a')
    rect(context, x + 27, 70, 1, 4, '#394a58')
  }

  if (last) {
    const edge = sent ? alpha(COLORS.lime, 0.85) : alpha(COLORS.gold, 0.8)
    rect(context, x - 1, WAGON_TOP - 1, WAGON_W + 2, 1, edge)
    rect(context, x - 1, WAGON_TOP + 24, WAGON_W + 2, 1, edge)
    rect(context, x - 1, WAGON_TOP, 1, 24, edge)
    rect(context, x + WAGON_W, WAGON_TOP, 1, 24, edge)
    if (!sent) {
      const pulse = reduced ? 0.12 : 0.08 + 0.06 * Math.sin(time / 220)
      rect(context, x + 18, 55, 2, 2, '#ffb04a')
      glow(context, x + 19, 56, 6, COLORS.gold, pulse)
    } else if (!reduced && since < 900) {
      glow(context, x + 12, 64, 14, COLORS.lime, 0.1)
    }
  }
}

function drawLoco(
  context: CanvasRenderingContext2D,
  sent: boolean,
  time: number,
  reduced: boolean,
): void {
  const x = LOCO_X
  const lamp = sent ? '#ffe08a' : '#5c6b52'

  rect(context, x + 2, 82, 28, 2, alpha(COLORS.ink, 0.35))
  rect(context, x + 1, 75, 27, 4, '#1b2430')
  rect(context, x + 1, 75, 27, 1, '#2b3a44')
  for (const [wheel, radius] of [[x + 6, 3], [x + 15, 3], [x + 25, 2]] as const) {
    disc(context, wheel, 80, radius, '#0c1117')
    disc(context, wheel, 80, radius - 1, '#28313c')
    rect(context, wheel, 80, 1, 1, '#c9a227')
  }
  line(context, x + 6, 81, x + 25, 81, alpha('#8a97a3', 0.7))
  rect(context, x + 9, 80, 3, 1, '#4a5a6a')

  // Cabina: techo con alero, ventana doble encendida y placa con el número.
  rect(context, x, 55, 14, 20, '#35634d')
  rect(context, x, 55, 1, 20, '#4a7a5f')
  rect(context, x + 1, 56, 12, 1, alpha('#a8d4b3', 0.25))
  rect(context, x - 1, 52, 16, 3, '#244535')
  rect(context, x - 1, 52, 16, 1, '#4a7a5f')
  rect(context, x + 3, 59, 9, 8, '#0e171c')
  rect(context, x + 4, 60, 7, 6, '#c9a04a')
  rect(context, x + 4, 60, 7, 1, '#ffe08a')
  rect(context, x + 7, 60, 1, 6, '#0e171c')
  rect(context, x + 2, 70, 10, 6, '#284c3c')
  rect(context, x + 2, 70, 10, 1, '#1d3a2d')
  label(context, '7', x + 7, 75, 5, '#d9a441', 'center')

  // Caldera con zunchos de latón y el faro delantero.
  rect(context, x + 12, 58, 16, 17, '#396b52')
  rect(context, x + 12, 58, 16, 1, '#5b8f70')
  rect(context, x + 12, 73, 16, 2, '#244535')
  for (const band of [x + 16, x + 24]) {
    rect(context, band, 59, 1, 15, '#d9a441')
  }
  rect(context, x + 13, 60, 3, 1, alpha('#a8d4b3', 0.45))
  rect(context, x + 17, 60, 6, 1, alpha('#a8d4b3', 0.3))

  // Chimenea pegada a la caldera.
  rect(context, x + 18, 50, 6, 8, '#2b5543')
  rect(context, x + 17, 49, 8, 2, '#3f7359')
  rect(context, x + 17, 49, 8, 1, '#5b8f70')
  rect(context, x + 18, 52, 6, 1, '#d9a441')
  rect(context, x + 19, 50, 3, 1, '#4a7a5f')

  // Silbato de latón entre la cabina y la chimenea.
  rect(context, x + 15, 53, 2, 5, '#d9a441')
  rect(context, x + 14, 53, 4, 1, '#ffe08a')

  rect(context, x + 27, 58, 3, 16, '#244535')
  rect(context, x + 28, 58, 2, 16, '#396b52')
  rect(context, x + 25, 55, 5, 4, '#1d2933')
  rect(context, x + 25, 55, 5, 1, '#4a5a6a')
  rect(context, x + 26, 56, 3, 2, lamp)
  if (sent) {
    const pulse = reduced ? 0.12 : 0.09 + 0.05 * Math.sin(time / 200)
    glow(context, x + 27, 57, 8, '#ffe08a', pulse)
  }

  // Quitapiedras.
  rect(context, x + 26, 74, 5, 2, '#2b3a44')
  rect(context, x + 27, 76, 4, 2, '#1d2933')
  rect(context, x + 28, 78, 3, 2, '#101820')
  rect(context, x + 26, 74, 5, 1, '#4a5a6a')
}

function drawSteam(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
): void {
  const chimneyX = LOCO_X + 20
  for (let puff = 0; puff < 4; puff += 1) {
    const phase = reduced ? (puff + 1) * 0.22 : (time / 1100 + puff * 0.25) % 1
    const x = chimneyX + Math.sin(phase * 3 + puff) * 3 + phase * 7
    const y = 48 - phase * 15
    context.globalAlpha = 0.26 * (1 - phase)
    disc(context, x, y, 2 + Math.round(phase * 2), '#d7e2ea')
  }
  context.globalAlpha = 1
}

function drawTrack(context: CanvasRenderingContext2D): void {
  rect(context, 0, 82, WIDTH, 4, '#171d25')
  speckle(context, 0, 83, WIDTH, 3, '#2d3540', 761, 26)
  for (let x = 2; x < WIDTH; x += 10) rect(context, x, 83, 6, 2, '#232a33')
  rect(context, 0, 82, WIDTH, 1, '#6b7686')
  rect(context, 0, 83, WIDTH, 1, '#2a323d')
}

function drawPlatform(context: CanvasRenderingContext2D): void {
  groundTexture(context, 0, PLATFORM_Y, WIDTH, 10, '#222b34', '#3d4a56', '#141a20', 617)
  rect(context, 0, PLATFORM_Y, WIDTH, 1, '#44525f')
  rect(context, 0, PLATFORM_Y + 1, WIDTH, 1, '#151c23')
  for (let x = 0; x < WIDTH; x += 8) {
    rect(context, x, PLATFORM_Y + 2, 5, 1, alpha('#b98f3a', 0.8))
  }
}

function drawTags(
  context: CanvasRenderingContext2D,
  loads: readonly string[],
  sent: boolean,
): void {
  const count = Math.min(loads.length, 7)
  for (let index = 0; index < count; index += 1) {
    const center = WAGON_X(index) + 12
    const last = index === count - 1
    rect(context, center - 9, 89, 18, 6, '#0f161e')
    rect(
      context,
      center - 9,
      89,
      18,
      1,
      last ? (sent ? '#b8e986' : '#c9a227') : '#2b3a46',
    )
    label(
      context,
      last ? `${index}/-1` : String(index),
      center,
      94,
      5,
      last ? (sent ? '#c8f0a0' : '#ffd27a') : '#c9d0e4',
      'center',
    )
  }

  // Maletas junto al andén.
  rect(context, 194, 90, 9, 5, '#6b4a2e')
  rect(context, 194, 90, 9, 1, '#8a6a3e')
  for (const strap of [196, 200]) rect(context, strap, 90, 1, 5, '#3a2a18')
  rect(context, 195, 89, 2, 1, '#8a6a3e')
  rect(context, 205, 89, 8, 6, '#2f4a5a')
  rect(context, 205, 89, 8, 1, '#456a7e')
  rect(context, 208, 89, 1, 6, '#1d3340')
  rect(context, 206, 88, 3, 1, '#456a7e')
}

function drawPanel(
  context: CanvasRenderingContext2D,
  view: TrainView,
  time: number,
  reduced: boolean,
): void {
  const loads = view.loads.length > 0 ? view.loads : TRAIN_LOADS
  const first = loads[0] ?? '—'
  const last = loads[loads.length - 1] ?? '—'
  const sent = view.sent

  rect(context, 4, 124, 216, 4, '#0a0e14')
  rect(context, 6, 96, 212, 30, '#18232b')
  rect(context, 6, 96, 212, 1, '#3d5560')
  rect(context, 6, 96, 1, 30, '#0e151b')
  rect(context, 217, 96, 1, 30, '#0e151b')
  rect(context, 6, 125, 212, 1, '#0e151b')

  label(context, 'ANDÉN 1 · CARGA', 13, 103, 5, '#8fa3b5')
  label(
    context,
    sent ? 'EN MARCHA' : 'EN ESTACIÓN',
    205,
    103,
    5,
    sent ? COLORS.lime : '#7f8ba3',
    'right',
  )
  rect(context, 210, 100, 3, 3, sent ? '#b8e986' : '#d9a441')
  if (sent) {
    const pulse = reduced ? 0.12 : 0.1 + 0.05 * Math.sin(time / 220)
    glow(context, 211, 101, 6, COLORS.lime, pulse)
  }

  for (let index = 0; index < 7; index += 1) {
    const x = 13 + index * 10
    const load = loads[index]
    const filled = load !== undefined
    const empty = load === 'vacío'
    rect(context, x, 107, 7, 6, filled ? CARGO_COLOUR[load] ?? '#4a5568' : '#1d2834')
    rect(
      context,
      x,
      107,
      7,
      1,
      filled ? alpha('#ffffff', 0.35) : '#26323e',
    )
    if (empty) {
      for (let dx = 1; dx < 6; dx += 2) rect(context, x + dx, 109, 1, 1, alpha('#8fa3b5', 0.5))
    }
    if (index === 6) {
      rect(context, x, 106, 7, 1, sent ? '#b8e986' : '#d9a441')
    }
  }

  label(context, `vagones: ${loads.length}`, 13, 122, 7, COLORS.cream)

  rect(context, 126, 105, 84, 18, '#0f171d')
  rect(context, 126, 105, 84, 1, '#22323c')
  rect(context, 168, 107, 1, 14, '#22323c')

  label(context, '[0]', 131, 112, 5, '#7f95a5')
  label(context, truncate(first, 7), 131, 119, 5, COLORS.cream)
  label(context, '[-1]', 173, 112, 5, '#7f95a5')
  label(
    context,
    truncate(last, 7),
    173,
    119,
    5,
    last === 'vacío' ? '#ff9a8a' : '#b8e986',
  )
}

/** Lienzo de la estación: siete vagones con su carga, índices y tablero de salidas. */
export function TrainScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<TrainView>(RESTING)
  const changedAtRef = useRef(0)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawStation(context)
      drawBoard(context, view, time, reduced)
      drawTrack(context)
      drawLoco(context, view.sent, time, reduced)
      const loads = view.loads.length > 0 ? view.loads : TRAIN_LOADS
      const count = Math.min(loads.length, 7)
      for (let index = 0; index < count; index += 1) {
        drawWagon(
          context,
          index,
          loads[index],
          index === count - 1,
          view,
          time,
          reduced,
          Math.max(0, time - changedAtRef.current),
        )
      }
      if (view.sent) drawSteam(context, time, reduced)
      drawPlatform(context)
      drawTags(context, loads, view.sent)
      drawPanel(context, view, time, reduced)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'train') continue
      if (step.sent) changedAtRef.current = performance.now()
      setView({ loads: step.loads, sent: step.sent })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 520)
      })
    }
  }, [])

  const reset = useCallback(() => {
    changedAtRef.current = 0
    setView(RESTING)
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const loads = view.loads.length > 0 ? view.loads : TRAIN_LOADS
  const description = view.sent
    ? `El tren está en marcha con ${loads.length} vagones: ${loads.join(', ')}. Primero: ${
        loads[0]
      }; último: ${loads[loads.length - 1]}.`
    : `Estación de noche: ${loads.length} vagones esperan en el andén y el último va vacío. El tablero anuncia primero ${loads[0]} y último ${
        loads[loads.length - 1]
      }.`

  return <PixelCanvas label={description} draw={draw} />
}
