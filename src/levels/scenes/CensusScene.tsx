import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { CENSUS_START } from '../../engine/census'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bar,
  disc,
  dither,
  gradient,
  label,
  line,
  mix,
  panel,
  rect,
  ring,
  speckle,
  starfield,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface CensusView {
  planets: { name: string; people: number }[]
  total: number
  listed: boolean
}

const RESTING: CensusView = { planets: [], total: 0, listed: false }

const PLANET_STYLE = [
  { x: 48, y: 50, radius: 13, body: '#b06a3a', light: '#e89a5a', dark: '#5c3420', tag: 'MARTE' },
  { x: 104, y: 68, radius: 10, body: '#d9a24a', light: '#f5d48a', dark: '#7a5220', tag: 'VENUS' },
  { x: 140, y: 34, radius: 7, body: '#9aa4b8', light: '#d7dee8', dark: '#4a5568', tag: 'LUNA' },
] as const

function drawPlanet(
  context: CanvasRenderingContext2D,
  index: number,
  people: number,
  scanned: boolean,
  current: boolean,
  time: number,
  reduced: boolean,
): void {
  const style = PLANET_STYLE[index]!
  const { x, y, radius } = style
  const orbit = radius + 7

  context.globalAlpha = 0.22
  ring(context, x, y, orbit, scanned ? COLORS.cyan : '#3d5c8a')
  context.globalAlpha = 1

  if (current) {
    const pulse = reduced ? 0.5 : 0.3 + 0.25 * Math.sin(time / 260)
    context.globalAlpha = pulse
    ring(context, x, y, orbit + 2, COLORS.cyan)
    ring(context, x, y, orbit + 3, alpha(COLORS.cyan, 0.5))
    context.globalAlpha = 1
  }

  for (let row = -radius; row <= radius; row += 1) {
    const half = Math.floor(Math.sqrt(radius * radius - row * row))
    const tone =
      (row + radius) % 7 < 2 ? style.light : (row + radius) % 11 < 1 ? style.dark : style.body
    const body = scanned ? tone : mix(style.body, COLORS.ink, current ? 0.45 : 0.74)
    rect(context, x - half, y + row, half * 2 + 1, 1, body)
  }
  if (scanned) {
    rect(context, x - radius + 2, y - radius + 3, 5, 1, style.light)
    rect(context, x - radius + 1, y - radius + 4, 3, 1, style.light)
    rect(context, x + radius - 4, y + 4, 2, 2, style.dark)
    rect(context, x + radius - 7, y + 7, 2, 1, style.dark)
    if (index === 2) {
      rect(context, x - 3, y - 2, 3, 2, style.dark)
      rect(context, x + 2, y + 2, 2, 2, style.dark)
    }
    if (index === 0) {
      dither(context, x - radius, y - radius, radius * 2 + 1, radius * 2 + 1, alpha(style.dark, 0.3), 3)
    }
  } else {
    dither(context, x - radius, y - radius, radius * 2 + 1, radius * 2 + 1, alpha(COLORS.ink, 0.4), 2)
  }

  if (current) {
    const offset = reduced ? -radius : Math.floor((time / 40) % (radius * 2 + 1)) - radius
    const half = Math.floor(Math.sqrt(Math.max(0, radius * radius - offset * offset)))
    rect(context, x - half, y + offset, half * 2 + 1, 1, alpha(COLORS.cyan, 0.6))
  }

  label(
    context,
    style.tag,
    x,
    y + orbit + 8,
    5,
    scanned ? COLORS.paper : '#5f7595',
    'center',
  )
  label(
    context,
    scanned ? String(people) : '—',
    x,
    y + orbit + 15,
    6,
    scanned ? COLORS.gold : '#3d5c8a',
    'center',
  )
}

function drawMap(
  context: CanvasRenderingContext2D,
  view: CensusView,
  time: number,
  reduced: boolean,
): void {
  const planets = view.planets.length > 0 ? view.planets : CENSUS_START.map(([name, people]) => ({ name, people }))

  let counted = 0
  planets.forEach((planet, index) => {
    const style = PLANET_STYLE[index]
    if (!style) return
    const scanned = view.listed && view.total >= counted + planet.people
    const current = view.listed && !scanned && view.total >= counted
    counted += planet.people
    drawPlanet(context, index, planet.people, scanned, current, time, reduced)
  })
}

function drawPanel(
  context: CanvasRenderingContext2D,
  view: CensusView,
  time: number,
  reduced: boolean,
): void {
  const planets = view.planets.length > 0 ? view.planets : CENSUS_START.map(([name, people]) => ({ name, people }))
  const total = planets.reduce((sum, planet) => sum + planet.people, 0)
  const complete = view.listed && view.total === total

  panel(context, 156, 16, 64, 84, 'rgba(7,14,28,0.88)', '#2b3d66')
  rect(context, 156, 16, 64, 1, '#3d5c8a')
  label(context, 'CENSO', 162, 27, 7, COLORS.cyan)
  label(
    context,
    complete ? 'CERRADO' : view.listed ? 'CONTANDO' : 'EN ESPERA',
    214,
    26,
    4,
    complete ? COLORS.lime : view.listed ? COLORS.gold : '#5f7595',
    'right',
  )
  rect(context, 162, 31, 52, 1, alpha(COLORS.cyan, 0.3))

  let running = 0
  planets.forEach((planet, index) => {
    const style = PLANET_STYLE[index]
    const y = 38 + index * 18
    const seen = view.listed && view.total >= running + planet.people
    const active = view.listed && !seen && view.total >= running
    running += planet.people
    const colour = style?.body ?? COLORS.steel

    rect(context, 162, y + 1, 3, 3, seen ? colour : '#253a5c')
    label(context, planet.name.toUpperCase(), 169, y + 7, 5, seen ? COLORS.paper : '#5f7595')
    label(
      context,
      seen ? String(planet.people) : active ? '…' : '—',
      214,
      y + 7,
      5,
      seen ? COLORS.gold : active ? COLORS.cyan : '#3d5c8a',
      'right',
    )
    bar(context, 169, y + 11, 30, 3, seen ? planet.people / 12 : active ? 0.12 : 0, seen ? colour : '#2b3d66', '#101a2e')
  })

  rect(context, 162, 88, 52, 1, alpha(COLORS.cyan, 0.25))
  label(context, 'HABITANTES', 162, 95, 4, '#8fa3cc')
  label(
    context,
    view.listed ? String(view.total) : '—',
    214,
    97,
    8,
    complete ? COLORS.lime : view.listed ? COLORS.gold : '#3d5c8a',
    'right',
  )

  if (activeScan(view)) {
    const pulse = reduced ? 0.6 : 0.35 + 0.3 * Math.sin(time / 240)
    context.globalAlpha = pulse
    rect(context, 158, 33, 2, 2, COLORS.cyan)
    context.globalAlpha = 1
  }
}

function activeScan(view: CensusView): boolean {
  return view.listed && view.total < view.planets.reduce((sum, planet) => sum + planet.people, 0)
}

function drawFooter(
  context: CanvasRenderingContext2D,
  view: CensusView,
  time: number,
  reduced: boolean,
): void {
  const planets = view.planets.length > 0 ? view.planets : CENSUS_START.map(([name, people]) => ({ name, people }))
  const total = planets.reduce((sum, planet) => sum + planet.people, 0)
  const complete = view.listed && view.total === total

  rect(context, 0, 104, 224, 24, '#0a1220')
  rect(context, 0, 104, 224, 1, '#2b3d66')
  rect(context, 0, 105, 224, 1, '#050a14')

  rect(context, 8, 108, 22, 16, '#08101c')
  rect(context, 8, 108, 22, 1, '#1e3352')
  disc(context, 19, 116, 7, '#0d1a2c')
  ring(context, 19, 116, 7, alpha(COLORS.cyan, 0.4))
  ring(context, 19, 116, 4, alpha(COLORS.cyan, 0.25))
  line(context, 12, 116, 26, 116, alpha(COLORS.cyan, 0.2))
  line(context, 19, 109, 19, 123, alpha(COLORS.cyan, 0.2))
  const angle = reduced ? 0.6 : time / 700
  line(context, 19, 116, 19 + Math.cos(angle) * 7, 116 + Math.sin(angle) * 7, COLORS.lime)
  rect(context, 15, 112, 1, 1, alpha(COLORS.cyan, 0.8))
  rect(context, 23, 120, 1, 1, alpha(COLORS.cyan, 0.6))

  panel(context, 40, 108, 98, 16, '#08101c', '#1e3352')
  label(context, 'HABITANTES DE LA FLOTA', 46, 114, 4, '#8fa3cc')
  label(
    context,
    view.listed ? String(view.total) : 'por contar',
    132,
    122,
    9,
    complete ? COLORS.lime : view.listed ? COLORS.cream : '#6a80a8',
    'right',
  )

  for (let index = 0; index < 3; index += 1) {
    const seen =
      view.listed &&
      view.total >=
        planets.slice(0, index + 1).reduce((sum, planet) => sum + planet.people, 0)
    rect(context, 148 + index * 12, 110, 9, 6, seen ? (PLANET_STYLE[index]?.body ?? COLORS.steel) : '#182338')
    if (seen) drawSprite(context, SPRITES.check, 149 + index * 12, 110, { scale: 1, palette: { g: COLORS.ink } })
  }

  if (complete) {
    const pulse = reduced ? 1 : 0.75 + 0.25 * Math.sin(time / 300)
    context.globalAlpha = pulse
    rect(context, 148, 118, 68, 7, 'rgba(47,107,58,0.9)')
    drawSprite(context, SPRITES.check, 151, 118, { scale: 1, palette: { g: COLORS.lime } })
    label(context, 'CENSO CERRADO', 180, 124, 4, COLORS.cream, 'center')
    context.globalAlpha = 1
  } else {
    label(context, view.listed ? 'CONTANDO…' : 'SIN CONTAR', 216, 124, 4, '#5f7595', 'right')
  }

  if (!reduced) {
    for (let index = 0; index < 6; index += 1) {
      const progress = (time / 5000 + index / 6) % 1
      context.globalAlpha = 0.3 * (1 - progress)
      rect(context, Math.round(12 + (index * 37) % 200), Math.round(12 + progress * 88), 1, 1, COLORS.cyan)
    }
    context.globalAlpha = 1
  }
}

function drawCensus(
  context: CanvasRenderingContext2D,
  view: CensusView,
  time: number,
  reduced: boolean,
): void {
  gradient(context, 0, 0, 224, 128, '#070b1c', '#101a33', 8)
  starfield(context, 0, 12, 152, 92, COLORS.paper, 5, 26, time, reduced)
  starfield(context, 150, 0, 74, 12, COLORS.paper, 9, 4, time, reduced)

  for (let x = 8; x < 152; x += 24) {
    rect(context, x, 12, 1, 92, alpha(COLORS.cyan, 0.06))
  }
  for (let y = 20; y < 104; y += 20) {
    rect(context, 0, y, 152, 1, alpha(COLORS.cyan, 0.05))
  }
  dither(context, 0, 12, 152, 92, alpha(COLORS.ink, 0.12), 4)

  label(context, 'CENSO DE LA FLOTA', 8, 9, 6, COLORS.cyan)
  label(context, 'SECTOR 6 · MAPA', 148, 9, 4, '#5f7595', 'right')

  drawMap(context, view, time, reduced)

  rect(context, 130, 14, 8, 4, '#2b3d66')
  rect(context, 132, 18, 4, 2, '#4a5568')
  line(context, 126, 16, 130, 16, alpha(COLORS.cyan, 0.6))
  line(context, 138, 16, 142, 16, alpha(COLORS.cyan, 0.6))
  if (!reduced) {
    context.globalAlpha = 0.4 + 0.5 * Math.sin(time / 200)
    rect(context, 133, 15, 2, 1, COLORS.lime)
    context.globalAlpha = 1
  }

  drawPanel(context, view, time, reduced)
  drawFooter(context, view, time, reduced)

  speckle(context, 0, 0, 224, 128, alpha(COLORS.paper, 0.05), 23, 14)
}

/** Lienzo del censo: el mapa de la flota y el recuento que va subiendo. */
export function CensusScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<CensusView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawCensus(context, view, time, reduced)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'census') continue
      setView({ planets: step.planets, total: step.total, listed: step.listed })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 340)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.planets.length === 0
      ? 'El mapa de la flota espera el censo.'
      : `El censo lleva ${view.planets
          .map((planet) => `${planet.name} con ${planet.people}`)
          .join(', ')}. En total ${view.total} habitantes.`

  return <PixelCanvas label={description} draw={draw} />
}
