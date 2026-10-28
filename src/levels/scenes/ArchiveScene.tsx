import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { ARCHIVE_START } from '../../engine/archive'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  dither,
  disc,
  gradient,
  hills,
  label,
  line,
  panel,
  rand,
  rect,
  ring,
  speckle,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface ArchiveView {
  rooms: { name: string; hall: string; pieces: number }[]
  visited: string[]
  delivered: boolean
}

const RESTING: ArchiveView = { rooms: [], visited: [], delivered: false }

const ARCH_X = [10, 82, 154]
const ARCH_W = 60

function drawDinosaurs(context: CanvasRenderingContext2D, x: number, y: number): void {
  disc(context, x + 38, y + 6, 5, '#e8dcc0')
  rect(context, x + 40, y + 10, 7, 2, '#e8dcc0')
  rect(context, x + 42, y + 12, 5, 1, '#c9bda0')
  rect(context, x + 39, y + 4, 1, 1, COLORS.ink)
  line(context, x + 33, y + 8, x + 17, y + 15, '#e8dcc0')
  line(context, x + 33, y + 9, x + 18, y + 16, '#c9bda0')
  for (let index = 0; index < 4; index += 1) {
    const rx = x + 30 - index * 4
    line(context, rx, y + 9 + index, rx - 2, y + 20 - index, '#e8dcc0')
    line(context, rx + 1, y + 9 + index, rx + 1, y + 17 - index, '#c9bda0')
  }
  line(context, x + 17, y + 15, x + 13, y + 21, '#e8dcc0')
  line(context, x + 13, y + 21, x + 9, y + 20, '#c9bda0')
  rect(context, x + 18, y + 26, 26, 2, '#c9bda0')
  rect(context, x + 17, y + 25, 2, 3, '#8a7a5c')
  rect(context, x + 42, y + 25, 2, 3, '#8a7a5c')
}

function drawArt(context: CanvasRenderingContext2D, x: number, y: number): void {
  rect(context, x + 16, y + 1, 28, 33, COLORS.woodDark)
  rect(context, x + 17, y + 2, 26, 31, COLORS.gold)
  rect(context, x + 19, y + 4, 22, 27, '#241a20')
  gradient(context, x + 20, y + 5, 20, 20, '#5a3a6a', '#e8a060', 5)
  disc(context, x + 35, y + 12, 3, '#ffe8b8')
  context.save()
  context.beginPath()
  context.rect(x + 20, y + 5, 20, 20)
  context.clip()
  hills(context, y + 25, 6, '#4a3050', 4, 2)
  context.restore()
  rect(context, x + 20, y + 25, 20, 5, '#3a2a3a')
  rect(context, x + 20, y + 5, 20, 2, alpha(COLORS.paper, 0.12))
  rect(context, x + 21, y + 33, 18, 2, '#8a5a2b')
  rect(context, x + 20, y + 35, 20, 4, '#4a3a2a')
  rect(context, x + 22, y + 35, 16, 1, '#6a5540')
}

function drawTech(context: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = x + 30
  const cy = y + 17
  ring(context, cx, cy, 9, COLORS.silver)
  ring(context, cx, cy, 8, '#6b7590')
  for (let index = 0; index < 8; index += 1) {
    const angle = (index * Math.PI) / 4
    rect(context, Math.round(cx + Math.cos(angle) * 10) - 1, Math.round(cy + Math.sin(angle) * 10) - 1, 3, 3, COLORS.silver)
  }
  disc(context, cx, cy, 4, '#2a3147')
  disc(context, cx, cy, 2, COLORS.cyan)
  rect(context, cx - 1, cy - 1, 1, 1, COLORS.paper)
  rect(context, x + 18, y + 30, 24, 3, '#4a3a2a')
  rect(context, x + 21, y + 33, 18, 3, '#2a3147')
  rect(context, x + 24, y + 34, 2, 1, alpha(COLORS.cyan, 0.8))
  rect(context, x + 29, y + 34, 2, 1, alpha(COLORS.lime, 0.7))
}

function drawArch(
  context: CanvasRenderingContext2D,
  room: { name: string; hall: string; pieces: number },
  index: number,
  visited: boolean,
  time: number,
  reduced: boolean,
): void {
  const x = ARCH_X[index]!
  const gold = visited ? COLORS.gold : '#3d4c6a'

  panel(context, x, 17, ARCH_W, 12, visited ? 'rgba(58,44,24,0.95)' : 'rgba(16,24,40,0.95)', gold)
  label(context, room.name.toUpperCase(), x + 4, 24, 6, visited ? COLORS.cream : '#8fa3cc')
  label(context, `SALA ${room.hall.toUpperCase()}`, x + 4, 27, 4, visited ? '#d9b878' : '#5f7595')
  label(context, `${room.pieces} P`, x + 56, 27, 4, visited ? COLORS.gold : '#5f7595', 'right')
  if (visited) {
    drawSprite(context, SPRITES.check, x + 50, 18, { scale: 1, palette: { g: COLORS.lime } })
  }

  rect(context, x, 34, ARCH_W, 62, '#202a3e')
  rect(context, x, 34, ARCH_W, 2, '#3d4c6a')
  rect(context, x + 2, 36, ARCH_W - 4, 58, '#2a3548')
  rect(context, x + 4, 32, ARCH_W - 8, 4, '#2a3548')
  rect(context, x + 10, 31, ARCH_W - 20, 3, '#3d4c6a')
  rect(context, x + 11, 30, ARCH_W - 22, 2, '#46527a')
  rect(context, x + 27, 30, 7, 5, visited ? COLORS.gold : '#4a5568')
  rect(context, x + 28, 31, 5, 2, visited ? COLORS.yellow : '#6b7280')

  const opening = visited ? '#3a2a1c' : '#08101e'
  rect(context, x + 12, 35, 36, 3, opening)
  rect(context, x + 8, 38, 44, 3, opening)
  rect(context, x + 6, 41, 48, 51, opening)
  gradient(context, x + 7, 42, 46, 49, visited ? '#4a3420' : '#0e1830', visited ? '#241a12' : '#050a14', 6)
  dither(context, x + 7, 42, 46, 49, alpha(COLORS.ink, 0.15), 3)

  if (visited) {
    const lamp = reduced ? 0.35 : 0.28 + 0.1 * Math.sin(time / 500 + index)
    context.globalAlpha = lamp
    disc(context, x + 30, 47, 11, COLORS.gold)
    context.globalAlpha = 1
    disc(context, x + 30, 44, 2, COLORS.cream)
    rect(context, x + 29, 42, 2, 2, '#4a3420')
    rect(context, x + 7, 87, 46, 1, alpha(COLORS.gold, 0.25))

    if (room.name === 'dinos') drawDinosaurs(context, x, 55)
    else if (room.name === 'arte') drawArt(context, x, 46)
    else drawTech(context, x, 48)

    if (!reduced) {
      context.globalAlpha = 0.25
      rect(context, x + 14 + Math.round(Math.sin(time / 700 + index) * 3), 50, 1, 1, COLORS.cream)
      rect(context, x + 40 + Math.round(Math.cos(time / 900 + index) * 3), 62, 1, 1, COLORS.cream)
      context.globalAlpha = 1
    }
  } else {
    rect(context, x + 29, 60, 9, 7, '#6a5a3a')
    rect(context, x + 30, 61, 7, 1, '#8a7a5c')
    ring(context, x + 33, 57, 3, '#6a5a3a')
    rect(context, x + 32, 58, 3, 1, '#0a1220')
    rect(context, x + 33, 63, 1, 2, '#4a3a20')
    label(context, 'CERRADA', x + 30, 78, 4, '#4a5a78', 'center')
  }

  rect(context, x + 6, 92, 48, 4, visited ? '#4a3a28' : '#161e30')
  rect(context, x + 6, 92, 48, 1, visited ? '#8a7050' : '#2a3548')
  rect(context, x, 96, ARCH_W, 2, '#161e30')

  rect(context, x - 2, 34, 3, 62, '#161e2a')
  rect(context, x + ARCH_W - 1, 34, 3, 62, '#161e2a')
  rect(context, x - 2, 34, 3, 1, '#3d4c6a')
  rect(context, x + ARCH_W - 1, 34, 3, 1, '#3d4c6a')
}

function drawFloor(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  rect(context, 0, 96, 224, 32, '#101a2c')
  for (let row = 0; row < 3; row += 1) {
    const y = 98 + row * 10
    for (let column = 0; column < 22; column += 1) {
      const offset = row % 2 === 0 ? 0 : -6
      if ((row + column) % 2 === 0) continue
      rect(context, 2 + column * 11 + offset, y, 10, 9, '#16223a')
    }
    rect(context, 0, y + 9, 224, 1, alpha(COLORS.ink, 0.25))
  }
  rect(context, 0, 96, 224, 1, '#2a3548')
  speckle(context, 0, 98, 224, 28, alpha(COLORS.ice, 0.05), 17, 16)

  if (!reduced) {
    context.globalAlpha = 0.12
    for (let index = 0; index < 3; index += 1) {
      const x = 30 + index * 74 + Math.sin(time / 900 + index) * 6
      rect(context, Math.round(x), 98, 34, 1, COLORS.gold)
    }
    context.globalAlpha = 1
  }
}

function drawLedger(
  context: CanvasRenderingContext2D,
  view: ArchiveView,
  time: number,
  reduced: boolean,
): void {
  const total = view.rooms.reduce((sum, room) => sum + room.pieces, 0)

  rect(context, 148, 102, 68, 22, alpha(COLORS.ink, 0.5))
  rect(context, 146, 100, 68, 22, '#5c3a1c')
  rect(context, 146, 100, 68, 1, '#8a5a2b')
  rect(context, 148, 102, 64, 18, '#efe0c2')
  rect(context, 150, 102, 2, 18, '#c9b896')
  rect(context, 152, 106, 58, 1, alpha(COLORS.brickDark, 0.3))
  label(context, 'TOTAL PIEZAS', 153, 112, 4, '#6a5a48')
  label(
    context,
    view.delivered ? String(total) : '—',
    209,
    118,
    9,
    view.delivered ? COLORS.forest : '#9a8a70',
    'right',
  )
  if (view.delivered) {
    const pulse = reduced ? 1 : 0.8 + 0.2 * Math.sin(time / 300)
    context.globalAlpha = pulse
    rect(context, 152, 115, 40, 4, 'rgba(47,107,58,0.85)')
    drawSprite(context, SPRITES.check, 153, 115, { scale: 1, palette: { g: COLORS.lime } })
    context.globalAlpha = 1
  } else {
    label(context, 'en consulta', 153, 118, 4, '#9a8a70')
  }
}

function drawMuseum(
  context: CanvasRenderingContext2D,
  view: ArchiveView,
  time: number,
  reduced: boolean,
): void {
  gradient(context, 0, 0, 224, 96, '#18233a', '#0c1424', 8)
  dither(context, 0, 16, 224, 80, alpha(COLORS.ink, 0.12), 4)

  rect(context, 0, 16, 224, 80, alpha(COLORS.ink, 0.18))
  for (const x of [74, 146]) {
    rect(context, x, 32, 4, 64, '#161e2a')
    rect(context, x - 1, 30, 6, 3, '#2a3548')
    rect(context, x - 1, 93, 6, 3, '#2a3548')
  }

  const rooms =
    view.rooms.length > 0
      ? view.rooms
      : ARCHIVE_START.map(([name, hall, pieces]) => ({ name, hall, pieces }))

  rooms.slice(0, 3).forEach((room, index) => {
    drawArch(context, room, index, view.visited.includes(room.name), time, reduced)
  })

  const plants = [74, 146]
  plants.forEach((x) => {
    rect(context, x, 88, 8, 8, '#7d2f26')
    rect(context, x, 88, 8, 1, '#a8553a')
    rect(context, x + 1, 86, 6, 2, '#4a2a20')
    disc(context, x + 4, 83, 4, COLORS.forest)
    disc(context, x + 2, 81, 3, COLORS.green)
    disc(context, x + 7, 80, 3, COLORS.moss)
    rect(context, x + 4, 86, 1, 3, '#1e4a2a')
  })

  drawFloor(context, time, reduced)

  drawSprite(context, SPRITES.explorer, 34, 94, { scale: 2 })
  rect(context, 32, 125, 28, 2, alpha(COLORS.ink, 0.4))

  drawLedger(context, view, time, reduced)

  rect(context, 0, 0, 224, 16, '#161e30')
  rect(context, 0, 15, 224, 1, '#3d4c6a')
  rect(context, 0, 16, 224, 1, '#050a14')
  label(context, 'ARCHIVO DEL MUSEO', 8, 11, 7, COLORS.gold)
  const complete = view.delivered
  label(
    context,
    complete ? 'CONSULTADO' : `${view.visited.length}/3 SALAS`,
    216,
    11,
    5,
    complete ? COLORS.lime : COLORS.silver,
    'right',
  )

  speckle(context, 0, 0, 224, 128, alpha(COLORS.paper, 0.04), 37, 22)

  if (view.delivered) {
    for (let index = 0; index < 10; index += 1) {
      const progress = reduced ? 0.5 : (time / 2000 + index / 10) % 1
      context.globalAlpha = 0.6 * (1 - progress)
      rect(
        context,
        Math.round(150 + rand(index + 8) * 64),
        Math.round(100 - progress * 50),
        1,
        1,
        index % 2 === 0 ? COLORS.gold : COLORS.lime,
      )
    }
    context.globalAlpha = 1
  }
}

/** Lienzo del archivo: las tres salas del museo y el libro de consulta. */
export function ArchiveScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<ArchiveView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawMuseum(context, view, time, reduced)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'archive') continue
      setView({ rooms: step.rooms, visited: step.visited, delivered: step.delivered })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const rooms =
    view.rooms.length > 0
      ? view.rooms
      : ARCHIVE_START.map(([name, hall, pieces]) => ({ name, hall, pieces }))
  const total = rooms.reduce((sum, room) => sum + room.pieces, 0)

  const description = `El archivo tiene ${rooms
    .map((room) => `${room.name} en la sala ${room.hall} con ${room.pieces} piezas`)
    .join(', ')}. Consultadas ${view.visited.length} de 3 salas.${
    view.delivered ? ` Total: ${total} piezas.` : ''
  }`

  return <PixelCanvas label={description} draw={draw} />
}
