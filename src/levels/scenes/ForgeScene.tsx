import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { FORGE_HERO, FORGE_START_LIFE, FORGE_STEPS } from '../../engine/forge'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bevel,
  brickWall,
  disc,
  dither,
  glow,
  gradient,
  label,
  line,
  mix,
  panel,
  rand,
  rect,
  truncate,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface ForgeView {
  hero: { nombre: string; vida: number; pasos: number } | null
  log: string[]
  done: boolean
}

const RESTING: ForgeView = { hero: null, log: [], done: false }
const MAX_LIFE = FORGE_START_LIFE
const TOTAL_STEPS = FORGE_STEPS.length

const PATH: readonly (readonly [number, number])[] = [
  [26, 74],
  [48, 56],
  [68, 74],
  [84, 56],
]

interface Beat {
  text: string
  vida: number
  pasos: number
  direction: 'inicio' | 'norte' | 'sur'
}

function parseBeats(log: readonly string[]): Beat[] {
  const beats: Beat[] = []
  for (const text of log) {
    const start = /^(.+) empieza con (\d+) de vida$/.exec(text)
    if (start) {
      beats.push({
        text,
        vida: Number(start[2] ?? FORGE_START_LIFE),
        pasos: 0,
        direction: 'inicio',
      })
      continue
    }

    const move = /^(norte|sur): vida (\d+), pasos (\d+)$/.exec(text)
    if (move) {
      beats.push({
        text,
        vida: Number(move[2] ?? FORGE_START_LIFE),
        pasos: Number(move[3] ?? 0),
        direction: move[1] === 'norte' ? 'norte' : 'sur',
      })
      continue
    }

    const previous = beats[beats.length - 1]
    beats.push({
      text,
      vida: previous?.vida ?? FORGE_START_LIFE,
      pasos: previous?.pasos ?? 0,
      direction: 'inicio',
    })
  }
  return beats
}

function drawArrow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  north: boolean,
  colour: string,
): void {
  rect(context, x, y, 1, 5, colour)
  rect(context, x - 1, y + (north ? 1 : 3), 1, 1, colour)
  rect(context, x + 1, y + (north ? 1 : 3), 1, 1, colour)
  rect(context, x - 2, y + 2, 1, 1, colour)
  rect(context, x + 2, y + 2, 1, 1, colour)
}

function drawBat(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  reduced: boolean,
): void {
  const flap = reduced ? 0 : Math.round(time / 190 + x) % 2
  rect(context, x - 4, y + 1 + flap, 2, 1, '#4a2f7a')
  rect(context, x + 3, y + 1 + flap, 2, 1, '#4a2f7a')
  rect(context, x - 3, y + 2, 2, 1, '#5a3f96')
  rect(context, x + 2, y + 2, 2, 1, '#5a3f96')
  rect(context, x - 1, y, 3, 3, '#3a2a5a')
  rect(context, x - 2, y + 2, 5, 1, '#2a1f42')
  rect(context, x - 1, y + 1, 1, 1, COLORS.coral)
  rect(context, x + 1, y + 1, 1, 1, COLORS.coral)
}

function drawPlatform(
  context: CanvasRenderingContext2D,
  cx: number,
  y: number,
  width: number,
): void {
  const x = cx - Math.floor(width / 2)
  bevel(context, x, y, width, 6, '#3f4a52', '#6a7a86', '#222a32', '#0a1216')
  for (let seam = x + 2; seam < x + width - 1; seam += 5) {
    rect(context, seam, y + 2, 1, 3, alpha(COLORS.ink, 0.22))
  }
  rect(context, x + 1, y - 1, width - 2, 1, alpha(COLORS.moss, 0.25))
  rect(context, x + 3, y + 6, 2, 1, '#222a32')
  rect(context, x + width - 6, y + 6, 1, 1, '#222a32')
}

function drawWalkway(
  context: CanvasRenderingContext2D,
  from: readonly [number, number],
  to: readonly [number, number],
): void {
  const steps = Math.max(4, Math.round(Math.abs(to[0] - from[0]) / 3))
  for (let index = 0; index <= steps; index += 1) {
    const amount = index / steps
    const x = Math.round(from[0] + (to[0] - from[0]) * amount) - 2
    const y = Math.round(from[1] + (to[1] - from[1]) * amount)
    rect(context, x, y, 4, 4, '#34424c')
    rect(context, x, y, 4, 1, '#5a6a74')
    rect(context, x, y + 4, 4, 1, '#1c262e')
  }
}

/** Lienzo del jefe final: la recreativa con la partida que juega el motor. */
export function ForgeScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<ForgeView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      const beats = parseBeats(view.log)
      const latest = beats[beats.length - 1]
      const vida = latest?.vida ?? view.hero?.vida ?? FORGE_START_LIFE
      const pasos = latest?.pasos ?? view.hero?.pasos ?? 0
      const heroName = view.hero?.nombre ?? FORGE_HERO

      gradient(context, 0, 0, 224, 128, '#0a161c', '#0c2026', 8)
      dither(context, 0, 0, 224, 128, alpha(COLORS.ink, 0.12), 4)

      bevel(context, 4, 16, 216, 86, '#183238', '#2f5a54', '#0b1a1e', '#060e10')

      bevel(context, 10, 22, 104, 64, '#0c1a22', '#2a464a', '#061014')
      brickWall(context, 14, 26, 96, 56, '#10242c', '#0a161e')
      dither(context, 14, 26, 96, 56, alpha(COLORS.ink, 0.14), 3)
      line(context, 20, 32, 22, 38, alpha(COLORS.ink, 0.5))
      line(context, 22, 38, 20, 43, alpha(COLORS.ink, 0.4))
      line(context, 104, 44, 102, 49, alpha(COLORS.ink, 0.45))

      for (let index = 0; index < PATH.length - 1; index += 1) {
        const from = PATH[index]
        const to = PATH[index + 1]
        if (!from || !to) continue
        line(context, from[0], from[1] + 2, to[0], to[1] + 2, '#2c3a42')
        line(context, from[0], from[1] + 3, to[0], to[1] + 3, '#1a242a')
        drawWalkway(context, from, to)
      }

      drawPlatform(context, 26, 74, 20)
      drawPlatform(context, 48, 56, 20)
      drawPlatform(context, 68, 74, 20)
      drawPlatform(context, 90, 56, 32)

      drawBat(context, 37, 44, time, reduced)
      drawBat(context, 76, 44, time + 90, reduced)

      if (view.done) {
        glow(context, 99, 50, 10, COLORS.gold, 0.1)
      }
      drawSprite(context, SPRITES.chest, 92, 44, { scale: 1 })
      if (view.done) {
        label(context, '¡FIN!', 99, 42, 5, COLORS.gold, 'center')
        if (!reduced) {
          for (let index = 0; index < 5; index += 1) {
            const sparkle = (time / 380 + index * 1.7) % 4
            context.globalAlpha = Math.max(0, 0.9 - sparkle * 0.22)
            rect(context, 91 + Math.round(rand(index + 71) * 16), 40 + Math.round(sparkle * 3), 1, 1, COLORS.yellow)
          }
          context.globalAlpha = 1
        }
      }

      if (beats.length > 0) {
        const point = PATH[Math.min(pasos, PATH.length - 1)] ?? PATH[0] ?? [26, 74]
        const heroX = point[0]
        const heroY = point[1]
        rect(context, heroX - 4, heroY - 1, 9, 1, alpha(COLORS.ink, 0.5))
        drawSprite(context, SPRITES.explorer, heroX - 6, heroY - 15, { scale: 1 })

        if (latest?.direction === 'norte' && vida < MAX_LIFE) {
          rect(context, heroX - 7, heroY - 12, 1, 1, COLORS.coral)
          rect(context, heroX + 7, heroY - 9, 1, 1, COLORS.coral)
          rect(context, heroX + 3, heroY - 17, 1, 1, COLORS.yellow)
        }
      }

      if (beats.length > 0) {
        rect(context, 14, 26, 96, 10, 'rgba(4,10,14,0.6)')
        label(context, truncate(heroName.toUpperCase(), 4), 18, 34, 4, COLORS.cream)
        for (let index = 0; index < MAX_LIFE; index += 1) {
          drawSprite(context, SPRITES.heart, 28 + index * 8, 27, {
            scale: 1,
            palette: { r: index < vida ? COLORS.red : '#2a3a40' },
          })
        }
        label(context, `PASOS ${pasos}`, 108, 34, 4, COLORS.cream, 'right')
      }

      for (let y = 28; y < 82; y += 3) {
        rect(context, 14, y, 96, 1, alpha(COLORS.ink, 0.1))
      }

      if (beats.length === 0) {
        rect(context, 14, 26, 96, 56, 'rgba(5,14,19,0.78)')
        drawSprite(context, SPRITES.star, 30, 33, { scale: 1 })
        drawSprite(context, SPRITES.star, 87, 33, { scale: 1 })
        label(context, 'TU JUEGO', 62, 52, 8, COLORS.gold, 'center')
        label(context, 'ESPERANDO TU CÓDIGO', 62, 64, 4, '#dfeaec', 'center')
        const phase = reduced ? 0 : Math.floor(time / 420) % 3
        for (let index = 0; index < 3; index += 1) {
          disc(context, 56 + index * 6, 72, 1, index === phase ? COLORS.teal : alpha(COLORS.teal, 0.3))
        }
      }

      bevel(context, 10, 88, 104, 12, '#153034', '#2a4a4a', '#0a1a1e')
      disc(context, 26, 97, 4, '#0b161a')
      disc(context, 26, 96, 3, '#3f4a52')
      line(context, 26, 95, 26, 90, '#a8b0c0')
      disc(context, 26, 89, 2, COLORS.red)
      disc(context, 25, 88, 1, COLORS.pink)
      for (const [x, colour] of [
        [48, COLORS.gold],
        [62, COLORS.teal],
        [76, COLORS.coral],
      ] as const) {
        disc(context, x, 96, 3, '#0b161a')
        disc(context, x, 95, 2, colour)
        rect(context, x - 1, 94, 1, 1, mix(colour, COLORS.paper, 0.55))
      }
      rect(context, 98, 92, 12, 6, '#0b161a')
      rect(context, 100, 94, 8, 1, COLORS.gold)
      rect(context, 103, 91, 2, 1, '#8a96a8')

      bevel(context, 118, 20, 100, 82, '#0c1a22', '#2a464a', '#061014')
      rect(context, 122, 24, 92, 74, 'rgba(6,18,22,0.96)')
      context.strokeStyle = alpha(COLORS.teal, 0.35)
      context.lineWidth = 1
      context.strokeRect(122.5, 24.5, 91, 73)
      label(context, 'EL MOTOR JUEGA', 128, 34, 4, '#8fe0d0')
      rect(context, 128, 37, 80, 1, alpha(COLORS.teal, 0.25))

      if (beats.length === 0) {
        for (let row = 0; row < 4; row += 1) {
          rect(context, 128, 45 + row * 12, 80, 1, alpha(COLORS.teal, 0.08))
        }
        label(context, 'EL MOTOR LLAMARÁ A', 168, 58, 3, alpha(COLORS.teal, 0.7), 'center')
        label(context, 'crear() y mover()', 168, 69, 4, alpha(COLORS.cream, 0.55), 'center')
      }

      beats.slice(-4).forEach((beat, index, rows) => {
        const rowY = 49 + index * 12
        const current = index === rows.length - 1
        if (current) {
          rect(context, 126, rowY - 8, 84, 10, alpha(COLORS.teal, 0.12))
        }
        if (beat.direction === 'inicio') {
          disc(context, 131, rowY - 3, 2, current ? COLORS.gold : '#6a7a80')
        } else {
          drawArrow(
            context,
            131,
            rowY - 7,
            beat.direction === 'norte',
            current ? (beat.direction === 'norte' ? COLORS.coral : COLORS.teal) : '#6a7a80',
          )
        }
        label(
          context,
          truncate(beat.text, 30),
          138,
          rowY,
          4,
          current ? COLORS.cream : '#8fbcb4',
        )
      })

      rect(context, 128, 89, 80, 1, alpha(COLORS.teal, 0.22))
      const status = view.done ? '¡PARTIDA COMPLETA!' : beats.length > 0 ? 'JUGANDO' : 'SIN JUGADAS'
      label(
        context,
        status,
        128,
        97,
        4,
        view.done ? COLORS.lime : beats.length > 0 ? COLORS.cream : '#6a8a90',
      )

      rect(context, 0, 0, 224, 14, '#0a141e')
      rect(context, 0, 13, 224, 1, alpha(COLORS.teal, 0.5))
      label(context, 'TU MINIJUEGO', 6, 10, 5, COLORS.cream)
      disc(context, 168, 7, 2, view.done ? COLORS.lime : beats.length > 0 ? COLORS.gold : '#52657a')
      disc(context, 167, 6, 1, alpha(COLORS.paper, 0.5))
      label(
        context,
        view.done ? 'PARTIDA COMPLETA' : beats.length > 0 ? 'PARTIDA EN MARCHA' : 'SIN JUGAR',
        218,
        10,
        4,
        view.done ? COLORS.lime : beats.length > 0 ? COLORS.cream : '#8fa3b8',
        'right',
      )

      panel(context, 4, 106, 216, 18, 'rgba(6,18,22,0.95)', '#2f5a54')
      label(context, 'VIDA', 10, 113, 3, '#6a8a90')
      for (let index = 0; index < MAX_LIFE; index += 1) {
        drawSprite(context, SPRITES.heart, 24 + index * 9, 107, {
          scale: 1,
          palette: { r: index < vida ? COLORS.red : '#2a3a40' },
        })
      }
      label(context, `${vida}/${MAX_LIFE}`, 60, 113, 4, COLORS.cream)

      label(context, 'PASOS', 76, 113, 3, '#6a8a90')
      for (let index = 0; index < TOTAL_STEPS; index += 1) {
        rect(context, 96 + index * 8, 108, 5, 5, index < pasos ? COLORS.gold : '#22383a')
        rect(context, 96 + index * 8, 108, 5, 1, alpha(COLORS.paper, index < pasos ? 0.4 : 0.08))
      }
      label(context, `${pasos}/${TOTAL_STEPS}`, 124, 113, 4, COLORS.cream)

      if (view.done) {
        panel(context, 144, 109, 72, 12, 'rgba(47,107,58,0.9)', COLORS.lime)
        drawSprite(context, SPRITES.check, 147, 111, { scale: 1, palette: { g: COLORS.cream } })
        label(context, 'PARTIDA COMPLETA', 157, 117, 4, COLORS.cream)
      } else {
        label(
          context,
          beats.length > 0 ? 'SIN TERMINAR' : 'SIN JUGAR',
          212,
          117,
          4,
          beats.length > 0 ? COLORS.coral : '#52657a',
          'right',
        )
      }

      for (const [x, y] of [
        [8, 20],
        [215, 20],
        [8, 98],
        [215, 98],
      ] as const) {
        disc(context, x, y, 1, '#0a1418')
        disc(context, x, y, 1, alpha(COLORS.silver, 0.5))
      }

      if (!reduced) {
        for (let index = 0; index < 4; index += 1) {
          const x = 22 + Math.round(rand(index + 11) * 80)
          const y = 30 + ((time / 300 + index * 9) % 50)
          context.globalAlpha = 0.05
          rect(context, x, Math.round(y), 1, 1, COLORS.cream)
        }
        context.globalAlpha = 1
      }
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'forge') continue
      setView({ hero: step.hero, log: step.log, done: step.done })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const beats = parseBeats(view.log)
  const latest = beats[beats.length - 1]
  const description =
    latest === undefined
      ? 'La recreativa espera: el motor todavía no ha jugado al minijuego.'
      : `El motor juega el minijuego de ${view.hero?.nombre ?? FORGE_HERO}: ${latest.vida} de vida y ${latest.pasos} pasos. ${
          view.done ? 'La partida está completa.' : 'La partida sigue en marcha.'
        }`

  return <PixelCanvas label={description} draw={draw} />
}
