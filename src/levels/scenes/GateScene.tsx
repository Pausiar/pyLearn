import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { GATE_PASSES } from '../../engine/gate'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  brickWall,
  cloud,
  disc,
  dither,
  glow,
  gradient,
  label,
  panel,
  rect,
  speckle,
  starfield,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface Visitor {
  pass: string
  door: string
}

const EXPECTED: Record<string, string> = {
  A: 'grande',
  B: 'pequeña',
  C: 'sin entrada',
}

function drawSky(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  gradient(context, 0, 0, 224, 72, '#241a3a', '#d98a5a', 9)
  dither(context, 0, 0, 224, 66, alpha(COLORS.pink, 0.05), 3)
  starfield(context, 0, 0, 224, 40, COLORS.ice, 19, 16, time, reduced)
  cloud(context, 150, 20, 40, '#5a3a5a', '#452e48')
  cloud(context, 12, 8, 30, '#4a3050', '#3a2542')
  for (const [x, y] of [[44, 22], [52, 18], [60, 24]] as const) {
    rect(context, x, y, 2, 1, alpha(COLORS.ink, 0.65))
    rect(context, x + 2, y - 1, 2, 1, alpha(COLORS.ink, 0.65))
    rect(context, x + 4, y, 2, 1, alpha(COLORS.ink, 0.65))
  }
}

function drawTower(
  context: CanvasRenderingContext2D,
  x: number,
  time: number,
  reduced: boolean,
): void {
  brickWall(context, x, 18, 44, 86, '#5f677d', '#464d61')
  rect(context, x - 1, 18, 1, 86, '#6f7790')
  rect(context, x + 44, 18, 1, 86, '#363c4e')
  rect(context, x, 34, 44, 2, '#4b5266')

  // Almenas.
  for (let index = 0; index < 4; index += 1) {
    rect(context, x + 1 + index * 11, 12, 8, 8, '#5f677d')
    rect(context, x + 1 + index * 11, 12, 8, 1, '#7a829a')
    rect(context, x + 1 + index * 11, 19, 8, 1, '#363c4e')
  }

  // Tejado cónico y banderín.
  for (let band = 0; band < 8; band += 1) {
    const width = 4 + band * 6
    rect(context, x + 22 - width / 2, 4 + band, width, 1, band < 3 ? '#a8402f' : '#7d2f26')
  }
  rect(context, x + 4, 4, 1, 8, alpha(COLORS.ice, 0.25))
  rect(context, x + 22, 0, 1, 5, COLORS.steel)
  const flutter = reduced ? 0 : Math.round(Math.sin(time / 380 + x) * 1)
  rect(context, x + 23, 1 + flutter, 7, 3, COLORS.coral)
  rect(context, x + 23, 4 + flutter, 4, 2, COLORS.coral)

  for (const wy of [42, 62]) {
    rect(context, x + 16, wy, 8, 12, '#2a2f40')
    rect(context, x + 17, wy + 1, 6, 10, '#f2c46a')
    rect(context, x + 19, wy + 1, 1, 10, '#8a5a2a')
    rect(context, x + 17, wy + 6, 6, 1, '#8a5a2a')
  }
}

function drawWall(context: CanvasRenderingContext2D): void {
  brickWall(context, 46, 40, 132, 64, '#5a6278', '#434a5e')
  rect(context, 46, 40, 132, 2, '#6f7790')
  for (let index = 0; index < 11; index += 1) {
    rect(context, 48 + index * 12, 32, 8, 8, '#5a6278')
    rect(context, 48 + index * 12, 32, 8, 1, '#6f7790')
    rect(context, 48 + index * 12, 39, 8, 1, '#434a5e')
  }
  for (const x of [54, 122]) {
    rect(context, x, 56, 3, 48, '#6f7790')
    rect(context, x + 3, 56, 1, 48, '#434a5e')
  }
}

function drawGate(
  context: CanvasRenderingContext2D,
  x: number,
  width: number,
  top: number,
  open: boolean,
  time: number,
  reduced: boolean,
): void {
  const bottom = 104

  // Arco de piedra.
  rect(context, x - 4, top + 8, width + 8, bottom - top - 8, '#3d4458')
  rect(context, x - 4, top + 8, width + 8, 2, '#6f7790')
  rect(context, x - 4, top + 8, 2, bottom - top - 8, '#6f7790')
  rect(context, x + width + 2, top + 8, 2, bottom - top - 8, '#2c3142')
  rect(context, x + 2, top + 2, width - 4, 6, '#3d4458')
  rect(context, x + 6, top - 2, width - 12, 4, '#3d4458')
  rect(context, x + 6, top - 2, width - 12, 1, '#6f7790')

  const inner = { x: x + 2, y: top + 6, w: width - 4, h: bottom - top - 6 }

  if (open) {
    gradient(context, inner.x, inner.y, inner.w, inner.h, '#3a2414', '#100b15', 8)
    glow(context, x + width / 2, top + 26, 20, COLORS.gold, 0.2)
    // Suelo del patio, iluminado por los farolillos.
    rect(context, inner.x + 2, bottom - 12, inner.w - 4, 10, '#2c1c12')
    rect(context, inner.x + 2, bottom - 12, inner.w - 4, 1, alpha(COLORS.gold, 0.45))
    for (const glowX of [inner.x + 7, inner.x + inner.w - 7]) {
      glow(context, glowX, inner.y + 16, 9, COLORS.gold, 0.3)
      rect(context, glowX - 1, inner.y + 12, 3, 5, COLORS.yellow)
      rect(context, glowX - 1, inner.y + 13, 3, 1, COLORS.orange)
      rect(context, glowX, inner.y + 17, 1, 2, COLORS.steel)
    }
    // Rastrillo subido y hojas de la puerta abiertas hacia dentro.
    for (let barX = inner.x + 4; barX < inner.x + inner.w - 3; barX += 8) {
      rect(context, barX, inner.y + 2, 2, 5, '#4a4f62')
    }
    rect(context, inner.x + 3, inner.y + 4, 2, inner.h - 10, '#5c3a1c')
    rect(context, inner.x + inner.w - 5, inner.y + 4, 2, inner.h - 10, '#5c3a1c')
    rect(context, inner.x + 3, inner.y + 4, 2, 1, '#7a5028')
    rect(context, inner.x + inner.w - 5, inner.y + 4, 2, 1, '#7a5028')
    const dust = reduced ? 0 : Math.round(Math.sin(time / 600 + x) * 2)
    rect(context, inner.x + inner.w - 8 + dust, inner.y + 22, 1, 1, alpha(COLORS.cream, 0.6))
  } else {
    rect(context, inner.x, inner.y, inner.w, inner.h, '#5c3a1c')
    rect(context, inner.x + 1, inner.y + 1, inner.w - 2, inner.h - 1, '#6a4326')
    for (let plank = 1; plank < Math.floor(inner.w / 8); plank += 1) {
      rect(context, inner.x + plank * 8, inner.y + 1, 1, inner.h - 1, '#4a2f18')
    }
    rect(context, inner.x, inner.y + 4, inner.w, 2, '#2c3142')
    rect(context, inner.x, inner.y + inner.h - 12, inner.w, 2, '#2c3142')
    rect(context, inner.x + inner.w / 2 - 1, inner.y + 1, 2, inner.h - 1, '#3e2712')
    for (let stud = 0; stud < 4; stud += 1) {
      rect(context, inner.x + 4 + stud * (inner.w / 4), inner.y + 3, 2, 2, COLORS.steel)
      rect(context, inner.x + 4 + stud * (inner.w / 4), inner.y + inner.h - 11, 2, 2, COLORS.steel)
    }
    rect(context, inner.x + inner.w / 2 - 5, inner.y + inner.h / 2, 3, 3, COLORS.gold)
    rect(context, inner.x + inner.w / 2 + 3, inner.y + inner.h / 2, 3, 3, COLORS.gold)
  }
}

function drawTorch(
  context: CanvasRenderingContext2D,
  x: number,
  time: number,
  reduced: boolean,
): void {
  const flick = reduced ? 0 : Math.round(Math.sin(time / 120 + x) * 1)
  glow(context, x, 60, 12, COLORS.gold, 0.2)
  rect(context, x - 1, 64, 3, 10, COLORS.woodDark)
  rect(context, x - 3, 62, 7, 3, COLORS.steel)
  rect(context, x - 1, 57 + flick, 3, 5, COLORS.coral)
  rect(context, x, 55 + flick, 1, 3, COLORS.yellow)
}

function drawBanners(
  context: CanvasRenderingContext2D,
  visitors: Visitor[],
): void {
  const entries = visitors.length === 0 ? GATE_PASSES.map((pass) => ({ pass, door: '' })) : visitors

  entries.forEach((visitor, index) => {
    const x = [70, 120, 152][index] ?? 0
    const expected = EXPECTED[visitor.pass] ?? ''
    const colour =
      visitor.door === ''
        ? '#4a4f62'
        : visitor.door === expected
          ? COLORS.green
          : COLORS.coral
    rect(context, x + 1, 28, 1, 5, COLORS.steel)
    rect(context, x, 32, 14, 11, colour)
    rect(context, x, 32, 14, 1, alpha('#ffffff', 0.3))
    rect(context, x + 2, 43, 4, 1, colour)
    rect(context, x + 8, 43, 4, 1, colour)
    rect(context, x + 4, 44, 6, 1, colour)
    label(context, visitor.pass, x + 7, 40, 7, COLORS.paper, 'center')
  })
}

/** Lienzo del castillo: cada pase entra por su puerta, o se queda fuera. */
export function GateScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [visitors, setVisitors] = useState<Visitor[]>([])

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      const bigOpen = visitors.some((visitor) => visitor.door === 'grande')
      const smallOpen = visitors.some((visitor) => visitor.door === 'pequeña')
      const complete =
        visitors.length === GATE_PASSES.length &&
        visitors.every((visitor) => visitor.door === EXPECTED[visitor.pass])

      drawSky(context, time, reduced)

      // Colinas lejanas.
      for (let index = 0; index < 4; index += 1) {
        disc(context, 20 + index * 64, 74, 26 + index * 4, index % 2 === 0 ? '#3a2a44' : '#33253e')
      }

      drawTower(context, 6, time, reduced)
      drawTower(context, 174, time, reduced)
      drawWall(context)

      drawGate(context, 58, 50, 52, bigOpen, time, reduced)
      drawGate(context, 120, 24, 68, smallOpen, time, reduced)
      drawTorch(context, 52, time, reduced)
      drawTorch(context, 116, time, reduced)

      drawSprite(context, SPRITES.guard, 148, 52, { scale: 3, outline: COLORS.ink })
      drawBanners(context, visitors)

      // Camino de piedra.
      rect(context, 0, 104, 224, 24, '#2a2434')
      rect(context, 0, 104, 224, 2, '#4a4054')
      speckle(context, 0, 106, 224, 22, alpha(COLORS.stone, 0.4), 23, 46)
      for (let index = 0; index < 10; index += 1) {
        rect(context, 6 + index * 23, 106 + (index % 2) * 5, 11, 2, '#3a3348')
      }

      panel(context, 6, 110, 212, 15, 'rgba(18,14,26,0.94)', complete ? COLORS.green : '#5a4a68')
      const status = complete
        ? 'A por la puerta grande · B por la pequeña · C se queda fuera.'
        : visitors.length === 0
          ? 'El guardián espera los pases A, B y C.'
          : `A: ${visitors[0]?.door ?? '—'} · B: ${visitors[1]?.door ?? '—'} · C: ${visitors[2]?.door ?? '—'}`
      label(context, status, 12, 120, 5, complete ? COLORS.lime : visitors.length === 0 ? COLORS.cream : COLORS.coral)
      disc(context, 207, 117, 3, complete ? COLORS.lime : visitors.length === 0 ? '#5a4a68' : COLORS.coral)
      if (complete) glow(context, 207, 117, 7, COLORS.lime, 0.2)
    },
    [visitors],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'gate') continue
      setVisitors(step.visitors)
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 520)
      })
    }
  }, [])

  const reset = useCallback(() => setVisitors([]), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    visitors.length === 0
      ? 'El guardián espera a los visitantes con pase A, B y C.'
      : `El guardián ha atendido: ${visitors
          .map((visitor) => `pase ${visitor.pass}, ${visitor.door}`)
          .join('; ')}.`

  return <PixelCanvas label={description} draw={draw} />
}
