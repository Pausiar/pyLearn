import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { HUNT_LEVELS, HUNT_MONSTERS } from '../../engine/hunt'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bevel,
  dither,
  disc,
  gradient,
  glow,
  label,
  panel,
  rand,
  rect,
  speckle,
  starfield,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface HuntView {
  monsters: { name: string; level: number }[]
  caught: string[]
  done: boolean
}

const RESTING: HuntView = { monsters: [], caught: [], done: false }

const CARD_X = [8, 58, 108, 8, 58]
const CARD_Y = [22, 22, 22, 74, 74]
const CARD_W = 46
const CARD_H = 50

const MONSTER_COLOURS: Record<string, string> = {
  draco: '#4aa86a',
  ogro: '#e08a4a',
  hada: '#f0a0d0',
  trol: '#a07ae0',
  goblin: '#b8e986',
}

function drawMoon(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  const pulse = reduced ? 0.2 : 0.14 + 0.04 * Math.sin(time / 900)
  glow(context, 36, 11, 12, COLORS.ice, pulse)
  disc(context, 36, 11, 7, '#e8f0f8')
  disc(context, 36, 11, 6, '#f4f8fc')
  rect(context, 32, 7, 1, 1, '#cfdbe9')
  rect(context, 35, 9, 2, 1, '#cfdbe9')
  rect(context, 33, 13, 1, 1, '#cfdbe9')
  rect(context, 38, 12, 1, 1, '#cfdbe9')
}

function drawForest(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  gradient(context, 0, 0, 224, 128, '#081420', '#0e2630', 8)
  starfield(context, 0, 2, 224, 58, '#cfe8ff', 7, 22, time, reduced)
  dither(context, 0, 0, 224, 128, alpha(COLORS.ink, 0.16), 4)

  for (let index = 0; index < 7; index += 1) {
    const x = 6 + index * 34 + Math.round(rand(index + 4) * 12)
    const height = 22 + Math.round(rand(index + 21) * 18)
    rect(context, x, 60 - height, 3, height, '#0a1a1c')
    disc(context, x + 1, 58 - height, 9, '#0c2022')
    disc(context, x + 8, 60 - height, 7, '#0a1a1c')
    disc(context, x - 5, 61 - height, 6, '#0c2022')
  }
  rect(context, 0, 58, 224, 6, '#0a1a1c')
  rect(context, 0, 63, 224, 1, '#143034')

  rect(context, 0, 62, 224, 66, '#0d211c')
  dither(context, 0, 68, 224, 60, alpha(COLORS.ink, 0.22), 3)
  for (let index = 0; index < 20; index += 1) {
    const x = Math.round(rand(index + 12) * 224)
    const y = 66 + Math.round(rand(index + 39) * 58)
    rect(context, x, y, 1, 3, alpha(COLORS.moss, 0.35))
    rect(context, x + 1, y + 1, 1, 2, alpha(COLORS.moss, 0.22))
  }

  drawMoon(context, time, reduced)

  if (!reduced) {
    for (let index = 0; index < 7; index += 1) {
      const x = 6 + rand(index + 53) * 210
      const y = 10 + rand(index + 71) * 54
      const blink = 0.25 + 0.55 * Math.max(0, Math.sin(time / 620 + index * 2.1))
      context.globalAlpha = blink
      rect(context, Math.round(x), Math.round(y), 1, 1, COLORS.lime)
      context.globalAlpha = blink * 0.3
      rect(context, Math.round(x) - 1, Math.round(y), 3, 1, COLORS.lime)
      context.globalAlpha = 1
    }
  }
}

function drawMonsterCard(
  context: CanvasRenderingContext2D,
  monster: { name: string; level: number },
  index: number,
  time: number,
  reduced: boolean,
  caught: boolean,
): void {
  const x = CARD_X[index]!
  const y = CARD_Y[index]!
  const danger = monster.level > 5
  const colour = MONSTER_COLOURS[monster.name] ?? COLORS.steel
  const border = caught ? COLORS.lime : danger ? COLORS.coral : '#2f5a54'

  panel(context, x, y, CARD_W, CARD_H, caught ? 'rgba(18,38,30,0.92)' : 'rgba(10,22,26,0.92)', border)
  rect(context, x, y, CARD_W, 2, border)
  rect(context, x, y, CARD_W, 1, alpha(colour, caught ? 0.9 : 0.6))

  if (caught) {
    dither(context, x + 1, y + 2, CARD_W - 2, CARD_H - 3, alpha(COLORS.lime, 0.05), 3)
    context.globalAlpha = reduced ? 0.35 : 0.25 + 0.15 * Math.sin(time / 280)
    rect(context, x + 8, y + 3, 30, 30, alpha(COLORS.lime, 0.12))
    context.globalAlpha = 1
  }

  context.globalAlpha = caught ? 0.45 : 1
  drawSprite(context, SPRITES.monster, x + 11, y + 4, {
    scale: 2,
    palette: { p: colour, f: colour },
  })
  context.globalAlpha = 1
  rect(context, x + 12, y + 34, 22, 2, alpha(COLORS.ink, 0.5))

  label(context, monster.name.toUpperCase(), x + CARD_W / 2, y + 45, 6, caught ? COLORS.lime : COLORS.paper, 'center')

  for (let pip = 0; pip < 9; pip += 1) {
    const filled = pip < monster.level
    rect(
      context,
      x + 5 + pip * 4,
      y + 37,
      3,
      3,
      filled ? (danger ? COLORS.coral : COLORS.moss) : '#1b3030',
    )
  }

  if (caught) {
    drawSprite(context, SPRITES.check, x + CARD_W - 9, y + 2, { scale: 1, palette: { g: COLORS.lime } })
  } else if (!reduced) {
    const blink = Math.sin(time / 500 + index) > 0.55
    if (blink) {
      rect(context, x + 20, y + 13, 2, 2, COLORS.cream)
      rect(context, x + 25, y + 13, 2, 2, COLORS.cream)
    }
  }
}

function drawCage(
  context: CanvasRenderingContext2D,
  view: HuntView,
  time: number,
  reduced: boolean,
): void {
  bevel(context, 158, 16, 60, 106, '#162028', '#33424e', '#0a1218', COLORS.ink)
  rect(context, 160, 18, 56, 12, '#0d1a20')
  label(context, 'JAULA', 165, 27, 6, COLORS.cyan)
  label(context, `${view.caught.length}/3`, 210, 26, 5, view.caught.length === 3 ? COLORS.lime : COLORS.gold, 'right')
  rect(context, 160, 30, 56, 1, alpha(COLORS.cyan, 0.4))

  const inner = { x: 162, y: 33, width: 52, height: 85 }
  gradient(context, inner.x, inner.y, inner.width, inner.height, '#0b1a20', '#050c10', 5)
  dither(context, inner.x, inner.y, inner.width, inner.height, alpha(COLORS.cyan, 0.04), 3)

  const caught = view.caught.slice(0, 3)
  for (let index = 0; index < 3; index += 1) {
    const y = 38 + index * 26
    const name = caught[index]
    if (name === undefined) {
      rect(context, 168, y + 2, 14, 14, '#0a1418')
      rect(context, 169, y + 3, 12, 12, '#0d1a20')
      label(context, '—', 175, y + 12, 6, '#2a4a50', 'center')
      label(context, 'libre', 186, y + 12, 4, '#2a4a50')
      continue
    }
    const colour = MONSTER_COLOURS[name] ?? COLORS.steel
    const level = HUNT_LEVELS[HUNT_MONSTERS.indexOf(name)] ?? 0
    context.globalAlpha = 0.22
    disc(context, 175, y + 9, 9, colour)
    context.globalAlpha = 1
    drawSprite(context, SPRITES.monster, 169, y, { scale: 1, palette: { p: colour, f: colour } })
    label(context, name.toUpperCase(), 186, y + 9, 5, COLORS.paper)
    label(context, `NV ${level}`, 211, y + 16, 4, alpha(COLORS.lime, 0.85), 'right')
  }

  for (let x = 164; x < 214; x += 5) {
    rect(context, x, 33, 1, 85, alpha(COLORS.silver, 0.16))
  }
  rect(context, 160, 33, 56, 1, '#4a5a6e')
  rect(context, 160, 117, 56, 2, '#4a5a6e')

  rect(context, 160, 118, 56, 3, '#0a1218')

  if (view.done) {
    const pulse = reduced ? 1 : 0.78 + 0.22 * Math.sin(time / 280)
    context.globalAlpha = pulse
    rect(context, 161, 106, 54, 10, 'rgba(47,107,58,0.95)')
    drawSprite(context, SPRITES.check, 164, 107, { scale: 1, palette: { g: COLORS.lime } })
    label(context, 'JAULA LLENA', 192, 114, 5, COLORS.cream, 'center')
    context.globalAlpha = 1
  } else {
    label(context, 'NIVEL +5', 190, 114, 4, '#4a6a72', 'center')
  }
}

function drawHuntScene(
  context: CanvasRenderingContext2D,
  view: HuntView,
  time: number,
  reduced: boolean,
): void {
  drawForest(context, time, reduced)

  const monsters =
    view.monsters.length > 0
      ? view.monsters
      : HUNT_MONSTERS.map((name, index) => ({ name, level: HUNT_LEVELS[index]! }))

  monsters.slice(0, 5).forEach((monster, index) => {
    drawMonsterCard(context, monster, index, time, reduced, view.caught.includes(monster.name))
  })

  drawCage(context, view, time, reduced)

  speckle(context, 0, 0, 224, 128, alpha(COLORS.paper, 0.05), 29, 20)

  if (!reduced) {
    const fog = (time / 90) % 240
    context.globalAlpha = 0.05
    rect(context, Math.round(fog - 40), 60, 46, 3, COLORS.ice)
    rect(context, Math.round(((fog + 120) % 240) - 40), 66, 30, 2, COLORS.ice)
    context.globalAlpha = 1
  }
}

/** Lienzo del bosque: los monstruos, su nivel de peligro y la jaula. */
export function HuntScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<HuntView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawHuntScene(context, view, time, reduced)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'hunt') continue
      setView({ monsters: step.monsters, caught: step.caught, done: step.done })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const monsters =
    view.monsters.length > 0
      ? view.monsters
      : HUNT_MONSTERS.map((name, index) => ({ name, level: HUNT_LEVELS[index]! }))

  const description = `En el bosque hay ${monsters
    .map((monster) => `${monster.name} de nivel ${monster.level}`)
    .join(', ')}. En la jaula van ${view.caught.length} de 3.${view.done ? ' La jaula está llena.' : ''}`

  return <PixelCanvas label={description} draw={draw} />
}
