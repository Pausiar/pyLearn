import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bevel,
  disc,
  dither,
  gradient,
  label,
  line,
  panel,
  rand,
  rect,
  ring,
  speckle,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface QuestView {
  room: string
  visited: string[]
  item: string | null
  done: boolean
}

const RESTING: QuestView = { room: 'inicio', visited: [], item: null, done: false }

const ROOMS = [
  { name: 'inicio', x: 30, y: 64 },
  { name: 'cueva', x: 80, y: 64 },
  { name: 'tesoro', x: 132, y: 64 },
] as const

const TOKEN: Record<string, { x: number; y: number }> = {
  inicio: { x: 45, y: 54 },
  cueva: { x: 99, y: 54 },
  tesoro: { x: 102, y: 52 },
}

function dashed(
  context: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  colour: string,
): void {
  const length = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
  for (let step = 0; step < length; step += 3) {
    const ratio = step / length
    rect(
      context,
      Math.round(x0 + (x1 - x0) * ratio),
      Math.round(y0 + (y1 - y0) * ratio),
      2,
      1,
      colour,
    )
  }
}

function drawLandmark(
  context: CanvasRenderingContext2D,
  room: string,
  time: number,
  reduced: boolean,
  current: boolean,
  visited: boolean,
): void {
  const pulse = reduced ? 0.6 : 0.4 + 0.3 * Math.sin(time / 380)
  const centre = ROOMS.find((entry) => entry.name === room)!

  if (current) {
    context.globalAlpha = pulse
    ring(context, centre.x, centre.y, 19, COLORS.gold)
    context.globalAlpha = 1
  }

  if (room === 'inicio') {
    drawSprite(context, SPRITES.house, 18, 54, { scale: 1, outline: alpha(COLORS.ink, 0.65) })
  } else if (room === 'cueva') {
    disc(context, 80, 65, 16, '#8a7a58')
    disc(context, 80, 64, 15, '#a89670')
    rect(context, 68, 66, 24, 12, '#8a7a58')
    disc(context, 80, 66, 8, '#3a3226')
    rect(context, 72, 66, 16, 12, '#3a3226')
    rect(context, 66, 62, 3, 3, '#6a5c42')
    rect(context, 91, 58, 3, 2, '#6a5c42')
    rect(context, 86, 72, 2, 2, '#6a5c42')
  } else {
    drawSprite(context, SPRITES.chest, 118, 54, { scale: 2, outline: alpha(COLORS.ink, 0.6) })
    if (!reduced) {
      const spark = 0.4 + 0.4 * Math.sin(time / 260)
      context.globalAlpha = spark
      drawSprite(context, SPRITES.star, 140, 48, { scale: 1 })
      context.globalAlpha = spark * 0.7
      drawSprite(context, SPRITES.star, 112, 58, { scale: 1 })
      context.globalAlpha = 1
    }
  }

  const colour = current ? '#8a2f2f' : visited ? '#3f6b3a' : '#7a6448'
  label(context, room.toUpperCase(), centre.x, 86, 4, colour, 'center')
  if (current) {
    rect(context, centre.x - 1, 88, 3, 1, '#8a2f2f')
  }
  if (visited && !current) {
    drawSprite(context, SPRITES.check, centre.x + 17, 74, { scale: 1, palette: { g: '#3f6b3a' } })
  }
}

function drawMap(
  context: CanvasRenderingContext2D,
  view: QuestView,
  time: number,
  reduced: boolean,
): void {
  bevel(context, 6, 26, 154, 76, '#5c3a1c', '#8a5a2b', '#3a2412', COLORS.ink)
  rect(context, 9, 29, 148, 70, '#e8d9b0')
  rect(context, 9, 29, 148, 1, '#f4ecd8')
  rect(context, 9, 98, 148, 1, '#b8a478')
  speckle(context, 10, 30, 146, 68, alpha('#8a6a3a', 0.22), 13, 40)
  dither(context, 10, 30, 146, 10, alpha('#b8a478', 0.25), 3)
  rect(context, 56, 29, 1, 70, alpha('#b8a478', 0.35))
  rect(context, 110, 29, 1, 70, alpha('#b8a478', 0.25))

  disc(context, 34, 66, 20, '#b3c48f')
  disc(context, 60, 64, 28, '#b3c48f')
  disc(context, 96, 62, 25, '#b3c48f')
  disc(context, 130, 68, 21, '#b3c48f')
  rect(context, 30, 64, 108, 20, '#b3c48f')
  disc(context, 34, 65, 19, '#cdd9a8')
  disc(context, 60, 63, 27, '#cdd9a8')
  disc(context, 96, 61, 24, '#cdd9a8')
  disc(context, 130, 67, 20, '#cdd9a8')
  rect(context, 30, 63, 108, 20, '#cdd9a8')
  speckle(context, 34, 46, 116, 42, alpha('#5f7a4a', 0.35), 31, 26)

  for (const [x, y] of [
    [47, 47],
    [54, 51],
    [109, 45],
    [116, 49],
    [98, 88],
    [124, 86],
  ]) {
    rect(context, x!, y! + 2, 1, 3, '#5c3a1c')
    disc(context, x!, y! + 1, 2, '#4a6a3a')
    rect(context, x! - 2, y! + 2, 5, 1, '#5f7a4a')
  }
  line(context, 38, 40, 44, 34, alpha('#8a7a58', 0.5))
  line(context, 44, 34, 50, 40, alpha('#8a7a58', 0.5))
  line(context, 70, 92, 76, 86, alpha('#8a7a58', 0.35))
  line(context, 76, 86, 82, 92, alpha('#8a7a58', 0.35))

  const firstLeg = view.visited.includes('cueva')
  const secondLeg = view.visited.includes('tesoro')
  dashed(context, 42, 64, 64, 64, firstLeg ? alpha(COLORS.gold, 0.85) : alpha('#8a6a3a', 0.55))
  dashed(context, 96, 64, 118, 64, secondLeg ? alpha(COLORS.gold, 0.85) : alpha('#8a6a3a', 0.55))
  dashed(context, 80, 80, 92, 88, alpha('#8a6a3a', 0.4))

  ROOMS.forEach((room) => {
    drawLandmark(
      context,
      room.name,
      time,
      reduced,
      view.room === room.name,
      view.visited.includes(room.name),
    )
  })

  const cx = 143
  const cy = 42
  ring(context, cx, cy, 8, alpha('#8a6a3a', 0.6))
  line(context, cx, cy - 8, cx, cy + 8, alpha('#8a6a3a', 0.45))
  line(context, cx - 8, cy, cx + 8, cy, alpha('#8a6a3a', 0.45))
  const swing = reduced ? 0 : Math.round(Math.sin(time / 650))
  line(context, cx, cy - 6, cx + swing, cy, '#c0392b')
  line(context, cx, cy - 6, cx, cy, '#c0392b')
  line(context, cx, cy + 6, cx - swing, cy, '#4a5568')
  rect(context, cx - 1, cy - 1, 2, 2, COLORS.cream)
  label(context, 'N', cx, 32, 3, '#6b4a28', 'center')
  disc(context, 16, 34, 2, '#b8a23a')
  disc(context, 151, 34, 2, '#b8a23a')

  const bob = reduced ? 0 : Math.round(Math.sin(time / 260))
  if (view.room === 'nada') {
    const x = 96
    const y = 70 + bob
    disc(context, x + 6, y + 18, 5, alpha(COLORS.ink, 0.22))
    drawSprite(context, SPRITES.captain, x, y, { scale: 1, outline: COLORS.ink })
    rect(context, 112, 78, 2, 16, '#5c3a1c')
    rect(context, 108, 74, 10, 6, '#8a5a2b')
    label(context, '?', 113, 79, 5, COLORS.cream, 'center')
  } else {
    const position = TOKEN[view.room] ?? TOKEN.inicio!
    const x = position.x
    const y = position.y + bob
    disc(context, x + 6, y + 18, 5, alpha(COLORS.ink, 0.22))
    drawSprite(context, SPRITES.captain, x, y, { scale: 1, outline: COLORS.ink })
  }
}

function drawPack(
  context: CanvasRenderingContext2D,
  view: QuestView,
  time: number,
  reduced: boolean,
): void {
  panel(context, 164, 26, 54, 76, 'rgba(20,15,34,0.92)', '#5a3a6a')
  label(context, 'MOCHILA', 170, 37, 5, '#c9a7ff')
  rect(context, 170, 39, 42, 1, alpha(COLORS.violet, 0.3))

  drawSprite(context, SPRITES.backpack, 169, 42, { scale: 1 })
  rect(context, 184, 41, 28, 24, alpha(COLORS.ink, 0.45))
  context.strokeStyle = alpha(COLORS.violet, 0.4)
  context.lineWidth = 1
  context.strokeRect(184.5, 41.5, 27, 23)

  const icon =
    view.item === 'antorcha'
      ? SPRITES.torch
      : view.item === 'llave'
        ? SPRITES.key
        : view.item === 'mapa'
          ? SPRITES.compass
          : null

  if (view.item === 'mapa') {
    rect(context, 189, 46, 16, 12, '#e8d9b0')
    rect(context, 189, 46, 16, 1, '#f4ecd8')
    rect(context, 189, 57, 16, 1, '#b8a478')
    rect(context, 189, 46, 1, 12, '#f4ecd8')
    rect(context, 204, 46, 1, 12, '#b8a478')
    rect(context, 192, 49, 1, 5, alpha('#8a6a3a', 0.7))
    rect(context, 193, 52, 2, 1, alpha('#8a6a3a', 0.7))
    rect(context, 195, 54, 2, 1, alpha('#8a6a3a', 0.7))
    line(context, 199, 50, 203, 54, '#b03a2e')
    line(context, 203, 50, 199, 54, '#b03a2e')
  } else if (icon) {
    drawSprite(context, icon, 189, 43, { scale: 2, outline: alpha(COLORS.ink, 0.7) })
  } else {
    label(context, '?', 197, 57, 8, '#4a3a6a', 'center')
  }
  if (view.item && !reduced) {
    const sparkle = 0.45 + 0.4 * Math.sin(time / 300)
    context.globalAlpha = sparkle
    drawSprite(context, SPRITES.spark, 206, 56, { scale: 1 })
    context.globalAlpha = 1
  }
  label(context, view.item ? view.item.toUpperCase() : 'VACÍA', 170, 70, 4, view.item ? COLORS.cream : '#8a7a9a')
  rect(context, 170, 73, 42, 1, alpha(COLORS.violet, 0.2))
  label(context, 'SALAS', 170, 81, 4, '#a08fbe')

  ROOMS.forEach((room, index) => {
    const y = 88 + index * 6
    const current = view.room === room.name
    const visited = view.visited.includes(room.name)
    disc(context, 171, y - 1, 1, current ? COLORS.gold : visited ? COLORS.moss : '#4a3a6a')
    label(context, room.name, 176, y, 4, current ? COLORS.cream : visited ? '#c9b8e8' : '#7a6a96')
    if (current) {
      label(context, 'AQUÍ', 212, y, 3, COLORS.gold, 'right')
    } else if (visited) {
      drawSprite(context, SPRITES.check, 205, y - 6, { scale: 1, palette: { g: COLORS.moss } })
    }
  })
}

/** Lienzo de la aventura: el mapa de la mansión con el mayordomo y la mochila. */
export function QuestScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<QuestView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      gradient(context, 0, 0, 224, 128, '#1e1630', '#3a2c52', 8)
      dither(context, 0, 0, 224, 128, alpha(COLORS.ink, 0.12), 4)
      for (let x = 0; x < 224; x += 16) {
        rect(context, x, 0, 1, 128, alpha(COLORS.ink, 0.14))
      }
      rect(context, 0, 88, 224, 18, '#241a2c')
      for (let x = 4; x < 224; x += 20) {
        rect(context, x, 88, 1, 18, alpha(COLORS.ink, 0.5))
        rect(context, x + 1, 88, 1, 18, alpha('#5a4458', 0.2))
      }
      rect(context, 0, 87, 224, 1, '#4a3448')

      panel(context, 4, 4, 216, 18, 'rgba(20,15,34,0.92)', '#5a3a6a')
      rect(context, 4, 4, 216, 1, alpha(COLORS.violet, 0.45))
      label(context, 'MAPA DE LA AVENTURA', 12, 17, 7, '#c9a7ff')
      label(
        context,
        view.room === 'nada' ? 'EN: SIN SALIDA' : `EN: ${view.room.toUpperCase()}`,
        212,
        17,
        4,
        view.room === 'nada' ? COLORS.coral : COLORS.gold,
        'right',
      )

      drawMap(context, view, time, reduced)
      drawPack(context, view, time, reduced)

      panel(context, 6, 106, 212, 18, 'rgba(20,15,34,0.92)', '#5a3a6a')
      const stops = Math.min(5, view.visited.length)
      label(context, 'PASOS', 12, 114, 4, '#8a7a9a')
      label(context, String(view.visited.length), 38, 119, 6, COLORS.cream)
      for (let index = 0; index < 5; index += 1) {
        const filled = index < stops
        rect(context, 52 + index * 7, 112, 5, 5, filled ? COLORS.gold : '#3a2a4a')
        rect(context, 52 + index * 7, 112, 5, 1, alpha(COLORS.paper, filled ? 0.35 : 0.06))
      }

      if (view.done) {
        const pulse = reduced ? 0.9 : 0.72 + 0.2 * Math.sin(time / 350)
        context.globalAlpha = pulse
        panel(context, 128, 109, 84, 12, 'rgba(47,107,58,0.9)', COLORS.lime)
        drawSprite(context, SPRITES.check, 131, 111, { scale: 1, palette: { g: COLORS.cream } })
        label(context, 'RECORRIDO COMPLETO', 141, 117, 4, COLORS.cream)
        context.globalAlpha = 1
      } else {
        label(context, 'RECORRIENDO EL MAPA', 212, 117, 4, '#8a7a9a', 'right')
      }

      if (!reduced) {
        for (let index = 0; index < 7; index += 1) {
          const drift = (time / 130 + index * 9) % 60
          context.globalAlpha = 0.12 + 0.14 * rand(index + 4)
          rect(
            context,
            Math.round(12 + rand(index + 19) * 200),
            Math.round(28 + drift),
            1,
            1,
            COLORS.cream,
          )
        }
        context.globalAlpha = 1
      }
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'quest') continue
      setView({ room: step.room, visited: step.visited, item: step.item, done: step.done })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const stops = view.visited.map((room) => (room === 'nada' ? 'un callejón sin salida' : room))
  const description =
    stops.length === 0
      ? 'El mayordomo espera en el inicio, con la mochila sin abrir.'
      : `El mayordomo ha hecho ${stops.length} paradas: ${stops.join(', ')}. ${
          view.room === 'nada' ? 'Ahora está en un callejón sin salida' : `Ahora está en ${view.room}`
        }.${view.item === null ? '' : ` Lleva en la mochila ${view.item}.`}${
          view.done ? ' El recorrido está completo.' : ''
        }`

  return <PixelCanvas label={description} draw={draw} />
}
