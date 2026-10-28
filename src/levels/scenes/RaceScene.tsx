import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { RACE_DRIVERS, RACE_TIMES } from '../../engine/race'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bevel,
  disc,
  dither,
  glow,
  gradient,
  groundTexture,
  label,
  mix,
  panel,
  rand,
  rect,
  starfield,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface RaceView {
  times: number[]
  order: number[] | null
  pilot: string | null
  secret: number | null
}

const RESTING: RaceView = {
  times: [...RACE_TIMES],
  order: null,
  pilot: null,
  secret: null,
}

const DRIVER_COLOURS: readonly string[] = [COLORS.coral, COLORS.gold, COLORS.violet, COLORS.cyan]
const TRACK_TOP = 46
const LANE_HEIGHT = 15

function drawCity(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  gradient(context, 0, 14, 224, 32, '#0a1724', '#1d4650', 6)
  dither(context, 0, 14, 224, 32, alpha(COLORS.ink, 0.12), 4)
  starfield(context, 0, 15, 224, 16, COLORS.ice, 21, 24, time, reduced)

  glow(context, 150, 25, 10, COLORS.ice, 0.22)
  disc(context, 150, 25, 5, '#e8f1ff')
  disc(context, 152, 24, 1, alpha('#b8c8d8', 0.8))
  disc(context, 148, 27, 1, alpha('#b8c8d8', 0.6))

  const blocks: readonly (readonly [number, number, number])[] = [
    [0, 16, 9],
    [14, 10, 15],
    [22, 18, 8],
    [38, 9, 13],
    [46, 22, 6],
    [66, 12, 11],
    [76, 16, 8],
    [90, 10, 14],
    [98, 24, 7],
    [120, 12, 12],
    [130, 18, 9],
    [146, 10, 15],
    [154, 20, 8],
    [172, 12, 13],
    [182, 22, 10],
    [202, 14, 15],
  ]

  blocks.forEach(([x, width, height], index) => {
    const top = 46 - height
    rect(context, x, top, width, height, index % 2 === 0 ? '#0e2230' : '#122a38')
    rect(context, x, top, width, 1, alpha(COLORS.teal, 0.25))
    for (let windowIndex = 0; windowIndex < Math.floor(width / 6); windowIndex += 1) {
      const lit = rand(index * 7 + windowIndex * 13 + 3) > 0.45
      const wx = x + 2 + windowIndex * 5
      const wy = top + 2 + Math.floor(rand(index + windowIndex * 5) * Math.max(1, height - 5))
      rect(context, wx, wy, 2, 2, lit ? alpha(COLORS.gold, 0.75) : alpha(COLORS.ink, 0.35))
    }
  })

  for (const [x, phase] of [
    [26, 0],
    [210, 2],
  ] as const) {
    const strength = reduced ? 0.12 : 0.09 + 0.04 * Math.sin(time / 620 + phase)
    glow(context, x, 19, 7, COLORS.gold, strength)
    rect(context, x, 22, 1, 24, '#2a3a44')
    rect(context, x - 1, 22, 1, 24, '#1a2630')
    rect(context, x - 5, 18, 11, 4, '#1c2a34')
    rect(context, x - 5, 18, 11, 1, '#3a4e58')
    rect(context, x - 4, 19, 9, 2, '#ffe8a8')
    rect(context, x - 2, 19, 1, 2, '#8a7a4a')
    rect(context, x + 1, 19, 1, 2, '#8a7a4a')
  }
}

function drawCar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  colour: string,
  leading: boolean,
  time: number,
  reduced: boolean,
): void {
  if (!reduced) {
    const drift = Math.round(time / 90 + x) % 4
    rect(context, x - 4 - drift, y + 5, 4, 1, alpha(COLORS.ice, 0.16))
    rect(context, x - 3 - drift, y + 8, 3, 1, alpha(COLORS.ice, 0.12))
  }

  rect(context, x + 2, y + 11, 14, 1, alpha(COLORS.ink, 0.45))
  if (leading) {
    glow(context, x + 8, y + 7, 10, COLORS.gold, 0.12)
  }

  rect(context, x, y + 3, 2, 3, mix(colour, COLORS.ink, 0.4))
  bevel(
    context,
    x,
    y + 4,
    17,
    6,
    colour,
    mix(colour, COLORS.paper, 0.35),
    mix(colour, COLORS.ink, 0.45),
    alpha(COLORS.ink, 0.9),
  )

  rect(context, x + 4, y + 1, 8, 3, mix(colour, COLORS.ink, 0.2))
  rect(context, x + 5, y + 2, 6, 2, alpha(COLORS.ice, 0.75))
  rect(context, x + 8, y + 2, 1, 2, mix(colour, COLORS.ink, 0.35))
  rect(context, x + 2, y + 6, 14, 1, alpha(COLORS.paper, 0.55))

  rect(context, x + 16, y + 6, 1, 2, COLORS.yellow)
  if (!reduced) {
    glow(context, x + 18, y + 7, 4, COLORS.gold, 0.16)
  }

  disc(context, x + 4, y + 10, 2, '#080c12')
  disc(context, x + 4, y + 10, 1, '#8a96a8')
  disc(context, x + 13, y + 10, 2, '#080c12')
  disc(context, x + 13, y + 10, 1, '#8a96a8')
}

function drawDriver(
  context: CanvasRenderingContext2D,
  index: number,
  name: string,
  colour: string,
  time: number,
  leading: boolean,
): void {
  const y = TRACK_TOP + index * LANE_HEIGHT
  panel(
    context,
    4,
    y + 2,
    45,
    11,
    leading ? 'rgba(38,50,30,0.92)' : 'rgba(8,16,22,0.88)',
    leading ? alpha(COLORS.gold, 0.8) : alpha(COLORS.paper, 0.16),
  )
  rect(context, 7, y + 5, 3, 5, colour)
  rect(context, 7, y + 5, 3, 1, mix(colour, COLORS.paper, 0.4))
  label(context, name, 13, y + 10, 4, leading ? COLORS.yellow : '#cfe0ea')
  label(context, `${time}s`, 46, y + 10, 4, leading ? COLORS.gold : '#8fa3b8', 'right')
  if (leading) {
    drawSprite(context, SPRITES.star, 29, y + 4, { scale: 1 })
  }
}

function drawTrack(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  groundTexture(context, 0, TRACK_TOP, 224, 60, '#202a38', '#2b3848', '#151d28', 7)

  for (let x = 0; x < 224; x += 8) {
    rect(context, x, TRACK_TOP, 4, 2, COLORS.coral)
    rect(context, x + 4, TRACK_TOP, 4, 2, COLORS.paper)
    rect(context, x, TRACK_TOP + 58, 4, 2, COLORS.paper)
    rect(context, x + 4, TRACK_TOP + 58, 4, 2, COLORS.coral)
  }

  for (let lane = 1; lane < 4; lane += 1) {
    const y = TRACK_TOP + lane * LANE_HEIGHT
    for (let x = 4; x < 224; x += 9) {
      rect(context, x, y, 4, 1, alpha(COLORS.paper, 0.2))
    }
  }

  for (let row = 0; row < 15; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      rect(
        context,
        178 + column * 4,
        TRACK_TOP + row * 4,
        4,
        4,
        (row + column) % 2 === 0 ? COLORS.paper : '#141c26',
      )
    }
  }
  rect(context, 176, TRACK_TOP, 2, 60, alpha(COLORS.ink, 0.35))

  panel(context, 164, 34, 36, 9, '#0b1620', alpha(COLORS.gold, 0.6))
  label(context, 'META', 182, 41, 4, COLORS.gold, 'center')

  rect(context, 196, 24, 1, 22, '#6a7a86')
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      rect(
        context,
        197 + column * 3,
        24 + row * 3,
        3,
        3,
        (row + column) % 2 === 0 ? COLORS.paper : COLORS.ink,
      )
    }
  }

  if (!reduced) {
    for (let index = 0; index < 4; index += 1) {
      const x = 60 + Math.round(rand(index + 31) * 100)
      const drift = (time / 300 + index) % 6
      context.globalAlpha = 0.06
      rect(context, x + drift, TRACK_TOP + 6 + index * 14, 10, 1, COLORS.ice)
    }
    context.globalAlpha = 1
  }
}

/** Lienzo de la carrera: la parrilla, los coches y el podio con el número secreto. */
export function RaceScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<RaceView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawCity(context, time, reduced)
      drawTrack(context, time, reduced)

      const fastest = view.order?.[0] ?? null
      const slowest = Math.max(...view.times, 1)
      const span = Math.max(1, slowest - (fastest ?? slowest))

      RACE_DRIVERS.forEach((driver, index) => {
        const y = TRACK_TOP + index * LANE_HEIGHT
        const timeValue = view.times[index] ?? 0
        const colour = DRIVER_COLOURS[index] ?? COLORS.coral
        const leading = fastest !== null && timeValue === fastest
        const x =
          view.order === null
            ? 52 + (index % 2) * 6
            : 52 + Math.round(((slowest - timeValue) / span) * 112)
        drawDriver(context, index, driver, colour, timeValue, leading)
        drawCar(context, x, y, colour, leading, time, reduced)
      })

      rect(context, 0, 0, 224, 14, '#0a141e')
      rect(context, 0, 13, 224, 1, alpha(COLORS.teal, 0.5))
      label(context, 'LA CARRERA', 6, 10, 5, COLORS.cream)
      const started = view.order !== null
      disc(context, 181, 7, 2, started ? COLORS.lime : COLORS.coral)
      disc(context, 180, 6, 1, alpha(COLORS.paper, 0.5))
      label(
        context,
        started ? 'CARRERA VISTA' : 'EN PARRILLA',
        218,
        10,
        4,
        started ? COLORS.lime : '#8fa3b8',
        'right',
      )

      panel(context, 4, 106, 216, 18, 'rgba(8,16,22,0.95)', '#2f5a54')
      label(context, 'PODIO', 10, 113, 3, '#6a8a90')
      label(context, view.pilot ?? 'SIN PODIO', 10, 121, 5, view.pilot ? COLORS.gold : '#52657a')
      if (view.pilot !== null && fastest !== null) {
        label(context, `${fastest} s`, 76, 121, 4, '#ffe08a', 'right')
      }

      label(context, 'SECRETO', 84, 113, 3, '#8fe0d0')
      rect(context, 84, 114, 34, 10, '#0b1620')
      context.strokeStyle = view.secret === null ? alpha(COLORS.paper, 0.18) : alpha(COLORS.gold, 0.7)
      context.lineWidth = 1
      context.strokeRect(84.5, 114.5, 33, 9)
      label(
        context,
        view.secret === null ? '??' : String(view.secret),
        101,
        122,
        5,
        view.secret === null ? '#52657a' : COLORS.cream,
        'center',
      )

      const complete = started && view.pilot !== null && view.secret !== null
      const pending = !complete && (started || view.pilot !== null || view.secret !== null)
      if (complete) {
        panel(context, 144, 109, 72, 12, 'rgba(47,107,58,0.9)', COLORS.lime)
        drawSprite(context, SPRITES.check, 147, 111, { scale: 1, palette: { g: COLORS.cream } })
        label(context, 'CARRERA COMPLETA', 157, 117, 4, COLORS.cream)
      } else {
        label(
          context,
          pending ? 'SIN TERMINAR' : 'SIN ENTREGAR',
          212,
          117,
          4,
          pending ? COLORS.coral : '#52657a',
          'right',
        )
      }
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'race') continue
      setView({ times: step.times, order: step.order, pilot: step.pilot, secret: step.secret })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.order === null
      ? `La parrilla tiene a ${RACE_DRIVERS.join(', ')} con tiempos de ${view.times.join(', ')} segundos. La carrera está sin ordenar.`
      : `Los tiempos ordenados son ${view.order.join(', ')}. El podio es para ${
          view.pilot ?? 'nadie todavía'
        } con ${view.order[0] ?? '?'} segundos. ${
          view.secret === null ? 'El número secreto sigue sin elegir.' : `El número secreto es ${view.secret}.`
        }`

  return <PixelCanvas label={description} draw={draw} />
}
