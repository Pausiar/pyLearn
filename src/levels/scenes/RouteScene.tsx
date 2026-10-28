import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { ROUTE_HOUSES } from '../../engine/route'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS, THEMES } from '../../pixel/palette'
import { cloud, disc, dither, glow, gradient, groundTexture, hills, label, panel, rand, rect, starfield } from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

const THEME = THEMES[4]
const HOUSE_Y = 46
const HOUSE_GAP = 54
const ROOF = [COLORS.brick, COLORS.coral, COLORS.purple, COLORS.teal]

interface RouteView {
  delivered: string[]
}

const RESTING: RouteView = { delivered: [] }

function drawHouse(context: CanvasRenderingContext2D, x: number, index: number, delivered: boolean): void {
  const wall = delivered ? '#f0dcb4' : '#c9bda8'
  drawSprite(context, SPRITES.house, x, HOUSE_Y, {
    scale: 2,
    outline: COLORS.ink,
    palette: {
      r: ROOF[index % ROOF.length],
      h: wall,
      w: delivered ? COLORS.gold : '#1b2440',
      n: COLORS.woodDark,
    },
  })

  // Chimenea y humo solo en las casas que ya han recibido su paquete.
  rect(context, x + 8, HOUSE_Y - 2, 6, 6, COLORS.brickDark)
  rect(context, x + 8, HOUSE_Y - 2, 6, 1, COLORS.brick)
  if (delivered) {
    const puffs = [0, 4, 8]
    puffs.forEach((offset, puff) => {
      const t = 1 - puff / 3
      disc(context, x + 11 + Math.round(offset * 0.4), HOUSE_Y - 8 - offset, 1 + puff, `rgba(220,220,230,${0.22 * t})`)
    })
    drawSprite(context, SPRITES.crate, x + 17, 80, { scale: 1, outline: COLORS.ink })
    drawSprite(context, SPRITES.check, x + 31, 52, { scale: 1 })
  }
}

function drawLamp(context: CanvasRenderingContext2D, x: number, time: number, reduced: boolean): void {
  rect(context, x, 56, 2, 36, COLORS.slate)
  rect(context, x - 1, 92, 4, 2, COLORS.steel)
  rect(context, x - 4, 51, 11, 3, COLORS.steel)
  rect(context, x - 2, 54, 7, 4, COLORS.ink)
  const flicker = reduced ? 1 : 0.85 + Math.sin(time / 330 + x) * 0.15
  context.globalAlpha = flicker
  rect(context, x - 1, 55, 5, 2, COLORS.yellow)
  context.globalAlpha = 1
  glow(context, x + 1, 56, 10, COLORS.yellow, 0.28)
}

function drawVan(context: CanvasRenderingContext2D, x: number, time: number, reduced: boolean): void {
  drawSprite(context, SPRITES.car, x, 108, {
    scale: 2,
    outline: COLORS.ink,
    palette: { r: COLORS.teal, w: COLORS.ice },
  })
  const beam = reduced ? 1 : 0.7 + Math.sin(time / 180) * 0.3
  context.globalAlpha = beam
  rect(context, x + 34, 116, 8, 2, COLORS.yellow)
  context.globalAlpha = 1
  drawSprite(context, SPRITES.explorer, Math.min(x + 42, 198), 80, {
    scale: 2,
    outline: COLORS.ink,
  })
}

/** Lienzo de la ruta: casas que se encienden y paquetes que llegan. */
export function RouteScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<RouteView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      gradient(context, 0, 0, 224, 92, THEME.skyTop, THEME.skyBottom, 10)
      starfield(context, 0, 0, 224, 46, COLORS.ice, 31, 20, time, reduced)
      glow(context, 194, 18, 16, COLORS.cream, 0.3)
      disc(context, 194, 18, 7, COLORS.cream)
      disc(context, 191, 16, 4, COLORS.yellow)
      cloud(context, 16, 20, 30, '#5a4a78', '#463a62')
      cloud(context, 122, 12, 24, '#5a4a78', '#463a62')
      hills(context, 86, 18, THEME.silhouette, 11)
      hills(context, 90, 10, '#2b2438', 29, 3)

      // Acera y calzada en planos, con farolas entre casa y casa.
      rect(context, 0, 92, 224, 20, '#4a4058')
      rect(context, 0, 92, 224, 2, '#6a5c80')
      dither(context, 0, 95, 224, 14, 'rgba(20,16,30,0.35)', 2)
      groundTexture(context, 0, 112, 224, 16, '#241e30', '#3a3148', '#141018', 17)
      rect(context, 0, 120, 224, 1, COLORS.gold)
      for (let x = 4; x < 224; x += 24) rect(context, x, 124, 12, 1, '#5a4a68')

      ROUTE_HOUSES.forEach((house, index) => {
        const x = 2 + index * HOUSE_GAP
        const delivered = view.delivered.includes(house)
        drawHouse(context, x, index, delivered)
        panel(context, x + 2, 94, 44, 14, delivered ? 'rgba(47,111,58,0.85)' : 'rgba(24,20,40,0.78)', delivered ? COLORS.green : THEME.panelLine)
        label(context, house, x + 24, 101, 7, delivered ? COLORS.lime : COLORS.paper, 'center')
        label(context, delivered ? 'entregado' : 'espera', x + 24, 108, 6, delivered ? '#bdf0c4' : THEME.muted, 'center')
      })

      const stops = [52, 106, 160, 212]
      stops.forEach((x) => drawLamp(context, x, time, reduced))

      const vanX = Math.min(view.delivered.length, 3) * HOUSE_GAP + 6
      drawVan(context, vanX, time, reduced)

      const done = view.delivered.length === ROUTE_HOUSES.length
      panel(context, 6, 6, 78, 14, THEME.panel, THEME.panelLine)
      label(context, `Entregas: ${view.delivered.length}/${ROUTE_HOUSES.length}`, 12, 16, 8, done ? COLORS.lime : COLORS.paper)
      if (done) {
        panel(context, 76, 24, 72, 16, 'rgba(47,111,58,0.88)', COLORS.green)
        label(context, 'RUTA COMPLETA', 112, 35, 8, COLORS.lime, 'center')
        for (let index = 0; index < 8; index += 1) {
          const x = 44 + Math.round(rand(index * 3) * 140)
          const y = 30 + Math.round(rand(index * 5 + 1) * 20) - Math.round((time / 60 + index * 6) % 24)
          rect(context, x, y, 2, 2, index % 2 === 0 ? COLORS.gold : COLORS.coral)
        }
      }
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'route') continue
      setView({ delivered: step.delivered })
      await new Promise<void>((resolve) => window.setTimeout(resolve, reduced ? 0 : 360))
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.delivered.length === 0
      ? 'El repartidor todavía no ha entregado ningún paquete.'
      : `Paquetes entregados en ${view.delivered.join(', ')}.`

  return <PixelCanvas label={description} draw={draw} />
}
