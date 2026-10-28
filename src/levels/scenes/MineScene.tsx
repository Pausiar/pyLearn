import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { MINE_MESSAGE, MINE_ROCKS } from '../../engine/mine'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  disc,
  dither,
  glow,
  gradient,
  label,
  panel,
  rect,
  speckle,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface MineView {
  rocks: number
  picadas: number
}

const RESTING: MineView = { rocks: MINE_ROCKS, picadas: 0 }

/** La veta, en el orden en que el pico la va vaciando. */
const ROCKS = [
  { x: 108, y: 76 },
  { x: 108, y: 42 },
  { x: 148, y: 76 },
  { x: 148, y: 42 },
  { x: 188, y: 76 },
  { x: 188, y: 42 },
]

const PIVOT_X = 65
const PIVOT_Y = 72
const PICK_REACH = 37
const IMPACT_ANGLE = 0.3

function drawCave(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  gradient(context, 0, 0, 224, 104, '#272234', '#15121e', 9)
  speckle(context, 0, 0, 224, 104, alpha('#7a7498', 0.16), 57, 64)
  dither(context, 0, 0, 224, 40, alpha(COLORS.violet, 0.05), 3)
  rect(context, 0, 52, 224, 1, alpha('#0c0a14', 0.5))
  rect(context, 0, 88, 224, 1, alpha('#0c0a14', 0.45))

  // Vetas de mineral incrustadas en la pared.
  for (let index = 0; index < 9; index += 1) {
    const x = 96 + (index * 37) % 122
    const y = 34 + (index * 23) % 56
    rect(context, x, y, 3, 1, alpha(COLORS.gold, 0.28))
    rect(context, x + 1, y + 1, 1, 1, alpha(COLORS.gold, 0.2))
  }

  // Vigas de madera del túnel.
  rect(context, 0, 0, 224, 6, '#3e2a1c')
  rect(context, 0, 6, 224, 1, '#1e140e')
  for (let x = 4; x < 224; x += 36) {
    rect(context, x, 0, 4, 4, '#5a3e2b')
    rect(context, x, 0, 1, 4, '#7a5638')
  }
  rect(context, 0, 0, 6, 104, '#4a3424')
  rect(context, 6, 0, 1, 104, '#2a1c12')
  rect(context, 218, 0, 6, 104, '#4a3424')
  rect(context, 218, 0, 1, 104, '#7a5638')

  // Farol colgado entre la veta y la placa.
  const flicker = reduced ? 0 : Math.round(Math.sin(time / 130) * 1)
  rect(context, 100, 0, 1, 18, '#6a5440')
  glow(context, 100, 26, 14, COLORS.gold, 0.22)
  rect(context, 97, 17, 7, 3, COLORS.steel)
  rect(context, 97, 20, 7, 8, '#3a2a1c')
  rect(context, 98, 21, 5, 6, COLORS.gold)
  rect(context, 99, 22 + flicker, 3, 4, COLORS.yellow)

  rect(context, 212, 38, 6, 2, COLORS.steel)
  rect(context, 213, 40, 4, 2, '#3a2a1c')
  rect(context, 213, 42, 4, 6, COLORS.steel)
  rect(context, 214, 43, 2, 4, COLORS.orange)
  glow(context, 214, 44, 10, COLORS.orange, 0.2)
}

/** Siluetas irregulares: sangría de cada fila de 2 px de alto. */
const ROCK_FORMS = [
  [4, 2, 1, 0, 0, 0, 2, 5],
  [6, 3, 1, 0, 0, 1, 3, 6],
  [3, 1, 0, 0, 0, 0, 2, 4],
]

function drawRock(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  index: number,
  time: number,
  reduced: boolean,
): void {
  const left = x - 13
  const top = y - 8
  const form = ROCK_FORMS[index % ROCK_FORMS.length] ?? ROCK_FORMS[0]
  if (!form) return

  form.forEach((pad, row) => {
    rect(context, left + pad - 1, top + row * 2, 28 - pad * 2, 2, '#0d0b14')
  })
  form.forEach((pad, row) => {
    const colour = row < 2 ? '#71768c' : row < 4 ? '#5a5f74' : row < 6 ? '#4a4e62' : '#3a3d4e'
    rect(context, left + pad, top + row * 2, 26 - pad * 2, 2, colour)
  })

  const head = form[0] ?? 4
  const shoulder = form[1] ?? 2
  rect(context, left + head + 2, top, 26 - head * 2 - 4, 1, '#8a90a8')
  rect(context, left + shoulder + 3, top + 2, 7, 1, '#7a8098')

  // Facetas y sombra de la base.
  rect(context, left + 5, top + 4 + (index % 2), 5, 3, '#7a8098')
  rect(context, left + 16, top + 3, 4, 2, '#656a80')
  rect(context, left + 14, top + 7, 6, 3, '#3f4354')
  rect(context, left + 4, top + 11, 18, 2, '#343748')
  rect(context, left + 7, top + 10, 4, 1, '#42465a')

  // Una vena dorada continua y una grieta.
  rect(context, left + 6, top + 7, 3, 1, COLORS.gold)
  rect(context, left + 9, top + 8, 1, 2, COLORS.gold)
  rect(context, left + 10, top + 9, 3, 1, COLORS.gold)
  rect(context, left + 17, top + 5, 2, 1, '#ffe08a')
  rect(context, left + 3, top + 9, 1, 1, alpha(COLORS.gold, 0.8))
  rect(context, left + 12, top + 2 + (index % 2), 1, 3, '#383c4e')
  rect(context, left + 13, top + 5 + (index % 2), 2, 1, '#383c4e')

  if (!reduced) {
    const glint = (time / 900 + x / 40) % 1
    if (glint < 0.12) {
      rect(context, left + 17, top + 5, 1, 1, '#ffffff')
      rect(context, left + 16, top + 5, 1, 1, alpha('#ffffff', 0.6))
    }
  }
}

function drawRubble(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  index: number,
  time: number,
  reduced: boolean,
): void {
  const ground = y + 8
  rect(context, x - 14, ground - 5, 12, 5, '#3a3c4c')
  rect(context, x - 11, ground - 8, 7, 8, '#4a4c5e')
  rect(context, x - 9, ground - 8, 4, 2, '#5c5f72')
  rect(context, x - 3, ground - 5, 12, 5, '#44475a')
  rect(context, x - 1, ground - 6, 7, 3, '#55586a')
  rect(context, x + 7, ground - 3, 7, 3, '#3a3c4c')
  rect(context, x + 9, ground - 4, 4, 2, '#4a4c5e')
  rect(context, x - 12, ground - 1, 26, 1, '#2c2e3c')
  rect(context, x - 8, ground - 3, 2, 1, COLORS.gold)
  rect(context, x - 5, ground - 2, 1, 1, alpha(COLORS.gold, 0.7))
  rect(context, x + 9, ground - 2, 2, 1, alpha(COLORS.gold, 0.65))

  if (!reduced) {
    for (let mote = 0; mote < 2; mote += 1) {
      const phase = (time / 1400 + index * 0.3 + mote * 0.5) % 1
      rect(
        context,
        x - 4 + Math.round(Math.sin(phase * 6 + mote) * 8),
        ground - 4 - Math.round(phase * 8),
        1,
        1,
        alpha(COLORS.gold, 0.5 * (1 - phase)),
      )
    }
  }
}

function drawPickaxe(context: CanvasRenderingContext2D, angle: number): void {
  const tipX = PIVOT_X + Math.cos(angle) * PICK_REACH
  const tipY = PIVOT_Y + Math.sin(angle) * PICK_REACH

  for (let step = 0; step <= 1; step += 0.06) {
    const x = Math.round(PIVOT_X + (tipX - PIVOT_X) * step)
    const y = Math.round(PIVOT_Y + (tipY - PIVOT_Y) * step)
    rect(context, x, y, 2, 2, step > 0.82 ? '#6a4424' : '#8a5a2b')
  }

  const nx = -Math.sin(angle)
  const ny = Math.cos(angle)
  for (let step = -5; step <= 5; step += 1) {
    const x = Math.round(tipX + nx * step)
    const y = Math.round(tipY + ny * step)
    rect(context, x, y, 2, 2, step < -2 ? '#c9cfdd' : step > 2 ? '#7a8090' : '#a8aebe')
  }
  rect(context, Math.round(tipX + nx * -5) + 1, Math.round(tipY + ny * -5) + 1, 1, 1, '#eef2fa')
}

function drawMiner(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
  rocksLeft: number,
): void {
  disc(context, 46, 101, 16, alpha(COLORS.ink, 0.25))
  drawSprite(context, SPRITES.robot, 28, 54, { scale: 3, outline: COLORS.ink })
  rect(context, 60, 71, 6, 3, '#8a90a0')
  rect(context, 63, 69, 3, 5, '#6a7080')
  rect(context, 60, 71, 6, 1, '#aab0c0')

  let angle = -1.05 + (reduced ? 0 : Math.sin(time / 320) * 0.04)
  let impact = false
  if (!reduced) {
    const cycle = (time % 1100) / 1100
    if (cycle >= 0.55 && cycle < 0.66) {
      angle = -1.05 + (IMPACT_ANGLE + 1.05) * ((cycle - 0.55) / 0.11)
    } else if (cycle >= 0.66 && cycle < 0.8) {
      angle = IMPACT_ANGLE
      impact = cycle < 0.74
    } else if (cycle >= 0.8) {
      angle = IMPACT_ANGLE + (-1.05 - IMPACT_ANGLE) * ((cycle - 0.8) / 0.2)
    }
  }

  drawPickaxe(context, angle)

  if (impact && rocksLeft > 0) {
    const hitX = Math.round(PIVOT_X + Math.cos(IMPACT_ANGLE) * PICK_REACH)
    const hitY = Math.round(PIVOT_Y + Math.sin(IMPACT_ANGLE) * PICK_REACH)
    for (let spark = 0; spark < 5; spark += 1) {
      const angleSpark = spark * 1.3
      rect(
        context,
        hitX + Math.round(Math.cos(angleSpark) * 5),
        hitY + Math.round(Math.sin(angleSpark) * 4),
        1,
        1,
        spark % 2 === 0 ? COLORS.yellow : COLORS.cream,
      )
    }
    glow(context, hitX, hitY, 9, COLORS.gold, 0.18)
  }
}

function drawCart(context: CanvasRenderingContext2D, picadas: number): void {
  // Vía y traviesas.
  rect(context, 0, 100, 224, 28, '#241b14')
  rect(context, 0, 100, 224, 2, '#3c2d21')
  speckle(context, 0, 102, 224, 26, alpha('#6a5440', 0.22), 29, 58)
  for (let x = 4; x < 224; x += 16) {
    rect(context, x, 106, 10, 3, '#3a2a1e')
  }
  rect(context, 0, 110, 224, 2, '#6a5a4a')
  rect(context, 0, 114, 224, 2, '#8a8078')
  rect(context, 0, 116, 224, 1, '#3a3028')

  // Vagoneta con la carga picada.
  const left = 142
  disc(context, 153, 112, 5, '#15121a')
  disc(context, 187, 112, 5, '#15121a')
  disc(context, 153, 112, 3, '#5a6070')
  disc(context, 187, 112, 3, '#5a6070')
  rect(context, 152, 111, 2, 2, COLORS.steel)
  rect(context, 186, 111, 2, 2, COLORS.steel)

  rect(context, left, 92, 52, 16, '#4a3424')
  rect(context, left, 92, 52, 2, '#7a5638')
  rect(context, left, 106, 52, 2, '#2a1c12')
  for (let plank = 1; plank < 4; plank += 1) {
    rect(context, left + plank * 13, 94, 1, 12, '#3a281c')
  }
  rect(context, left + 2, 90, 48, 3, '#5a6070')

  const oreSlots = [
    [4, 0],
    [11, 1],
    [18, 0],
    [25, 1],
    [32, 0],
    [39, 1],
  ]
  for (let index = 0; index < Math.min(picadas, MINE_ROCKS); index += 1) {
    const slot = oreSlots[index]
    if (!slot) continue
    const x = left + slot[0]
    const y = 84 + slot[1] * 2
    rect(context, x, y + 1, 7, 4, '#3c3f50')
    rect(context, x + 1, y, 5, 3, '#5c6176')
    rect(context, x + 2, y + 1, 2, 1, COLORS.gold)
    rect(context, x + 5, y + 2, 1, 1, '#ffe08a')
  }
}

/** Lienzo de la mina: el robot pica la veta piedra a piedra. */
export function MineScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<MineView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      const complete = view.rocks === 0

      drawCave(context, time, reduced)
      ROCKS.forEach((rock, index) => {
        if (index < view.picadas) drawRubble(context, rock.x, rock.y, index, time, reduced)
        else drawRock(context, rock.x, rock.y, index, time, reduced)
      })
      drawCart(context, view.picadas)
      drawMiner(context, time, reduced, view.rocks)

      // Placa con la cuenta de picadas.
      panel(context, 6, 8, 84, 24, 'rgba(18,14,24,0.92)', '#7a6248')
      label(context, 'PICADAS', 12, 18, 5, COLORS.cream)
      label(context, `${view.picadas} / ${MINE_ROCKS}`, 84, 18, 5, COLORS.gold, 'right')
      for (let index = 0; index < MINE_ROCKS; index += 1) {
        const done = index < view.picadas
        const x = 12 + index * 8
        rect(context, x, 23, 4, 4, done ? COLORS.gold : '#3a3448')
        rect(context, x + 1, 22, 2, 1, done ? COLORS.yellow : '#4a4458')
        rect(context, x, 27, 4, 1, done ? '#b8862a' : '#2a2434')
      }
      if (complete) {
        rect(context, 52, 23, 32, 1, alpha(COLORS.lime, 0.4))
      }

      if (complete) {
        panel(context, 104, 8, 114, 24, 'rgba(16,30,22,0.94)', '#6a9a6a')
        label(context, `«${MINE_MESSAGE}»`, 161, 17, 6, COLORS.lime, 'center')
        label(context, 'cuenta anunciada', 161, 27, 5, '#9fc8a8', 'center')
      } else {
        label(context, 'veta de mineral', 214, 18, 5, alpha(COLORS.cream, 0.55), 'right')
      }
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'mine') continue
      setView({ rocks: step.rocks, picadas: step.picadas })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 430)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.rocks === 0
      ? `La veta está agotada: ${view.picadas} piedras picadas. El robot dice «${MINE_MESSAGE}».`
      : `${view.picadas} piedras picadas y ${view.rocks} en la veta.`

  return <PixelCanvas label={description} draw={draw} />
}
