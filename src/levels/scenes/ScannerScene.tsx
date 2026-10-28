import { useCallback, useImperativeHandle, useRef, useState, type Ref } from 'react'
import {
  AISLE_BOXES,
  CARGO_LIMIT,
  EMPTY_AISLES,
  SCANNER_AISLES,
  SCANNER_TOTAL,
} from '../../engine/scanner'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { COLORS } from '../../pixel/palette'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import {
  alpha,
  dither,
  glow,
  gradient,
  groundTexture,
  label,
  line,
  rect,
} from '../../pixel/shapes'

const WIDTH = 224
const RACK_W = 28
const RACK_STEP = 34
const RACK_X = (index: number): number => 8 + index * RACK_STEP
const SHELF_TOPS = [38, 54, 70] as const
const CRATE_TOPS = [32, 48, 64] as const

interface ScannerView {
  readings: number[]
  boxes: number
  reached: number
}

const RESTING: ScannerView = { readings: [], boxes: 0, reached: 0 }

function drawWall(context: CanvasRenderingContext2D): void {
  gradient(context, 0, 0, WIDTH, 96, '#111722', '#1d2636', 7)
  dither(context, 0, 0, WIDTH, 96, alpha(COLORS.ink, 0.18), 3)
  for (let x = 0; x < WIDTH; x += 14) {
    rect(context, x, 0, 1, 96, '#0c111a')
    rect(context, x + 1, 0, 1, 96, alpha('#5a6b85', 0.06))
  }
  rect(context, 0, 20, WIDTH, 1, '#0c111a')
  rect(context, 0, 21, WIDTH, 1, alpha('#5a6b85', 0.06))
}

function drawFloor(context: CanvasRenderingContext2D, view: ScannerView): void {
  groundTexture(context, 0, 76, WIDTH, 20, '#1d2533', '#334055', '#111722', 811)
  rect(context, 0, 76, WIDTH, 1, '#0b0f17')
  SCANNER_AISLES.forEach((aisle, index) => {
    const x = RACK_X(index)
    const read = view.readings.includes(aisle)
    const empty = EMPTY_AISLES.includes(aisle)
    const count = AISLE_BOXES[aisle] ?? 0
    rect(context, x + 1, 76, 26, 1, alpha(COLORS.ink, 0.5))
    rect(context, x + 2, 83, 24, 9, '#151d29')
    rect(context, x + 2, 83, 24, 1, '#2c3546')
    label(
      context,
      read ? `P${aisle} ·${count}` : `P${aisle}`,
      x + 14,
      90,
      5,
      read ? COLORS.lime : empty ? '#8f9bb8' : '#8794ab',
      'center',
    )
  })
}

function drawCrate(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  lit: boolean,
): void {
  rect(context, x, y, 8, 6, lit ? '#a8742a' : '#4f4530')
  rect(context, x, y, 8, 1, lit ? '#d9a441' : '#6b5c40')
  rect(context, x, y, 1, 6, lit ? '#c08a33' : '#5c5138')
  rect(context, x + 3, y + 1, 1, 5, lit ? '#6b4a18' : '#332c1f')
  rect(context, x, y + 5, 8, 1, lit ? '#6b4a18' : '#2a2418')
  if (lit) rect(context, x + 1, y + 1, 2, 1, '#ffe08a')
}

function drawRack(
  context: CanvasRenderingContext2D,
  index: number,
  view: ScannerView,
): void {
  const x = RACK_X(index)
  const aisle = SCANNER_AISLES[index]
  const read = view.readings.includes(aisle)
  const empty = EMPTY_AISLES.includes(aisle)
  const passed = empty && view.reached > aisle && view.readings.length > 0
  const center = x + RACK_W / 2

  rect(context, x, 26, 28, 48, '#0f1622')
  rect(context, x + 2, 27, 24, 46, '#121a27')
  rect(context, x, 24, 2, 52, '#39445c')
  rect(context, x, 24, 1, 52, '#4a5570')
  rect(context, x + 26, 24, 2, 52, '#2c3546')
  rect(context, x, 24, 28, 3, '#4a5470')
  rect(context, x, 24, 28, 1, '#6b7690')
  rect(context, x, 74, 28, 2, '#242c3c')

  for (const y of SHELF_TOPS) {
    rect(context, x + 2, y, 24, 2, '#39445c')
    rect(context, x + 2, y, 24, 1, '#55627a')
    rect(context, x + 2, y + 2, 24, 1, alpha(COLORS.ink, 0.5))
  }

  const count = AISLE_BOXES[aisle] ?? 0
  for (let box = 0; box < count; box += 1) {
    const shelf = Math.floor(box / 2)
    const slot = box % 2
    drawCrate(context, x + 3 + slot * 11, CRATE_TOPS[shelf], read)
  }

  if (empty) {
    line(context, center, 27, center, 31, passed ? '#5ad1ff' : '#55627a')
    rect(context, center - 9, 31, 18, 9, '#28313f')
    rect(context, center - 9, 31, 18, 1, passed ? '#2fb3a0' : '#4a5570')
    rect(context, center - 1, 33, 2, 1, passed ? '#5ad1ff' : '#1a2130')
    label(context, 'VACÍO', center, 38, 5, passed ? '#8fe6d8' : '#b9c2d4', 'center')
  }
}

function drawBeam(
  context: CanvasRenderingContext2D,
  view: ScannerView,
  time: number,
  reduced: boolean,
): void {
  if (view.readings.length === 0 || view.boxes >= CARGO_LIMIT) return
  const index = SCANNER_AISLES.indexOf(view.reached)
  if (index < 0) return
  const headX = RACK_X(index) + RACK_W / 2
  const top = 21
  const bottom = 73
  const widthAt = (y: number): number => 3 + ((y - top) / (bottom - top)) * 11
  for (let y = top; y <= bottom; y += 1) {
    const half = widthAt(y)
    rect(context, headX - half, y, half * 2, 1, alpha(COLORS.cyan, 0.08))
  }
  for (const side of [-1, 1]) {
    line(
      context,
      headX + side * 3,
      top,
      headX + side * 14,
      bottom,
      alpha(COLORS.cyan, 0.22),
    )
  }
  const sweep = reduced ? 46 : 26 + ((time / 20) % 46)
  const half = widthAt(sweep)
  rect(context, headX - half, sweep, half * 2, 1, alpha(COLORS.cyan, 0.3))
  rect(context, headX - half / 2, sweep, half, 1, alpha('#d8f6ff', 0.45))
}

function drawScanner(
  context: CanvasRenderingContext2D,
  view: ScannerView,
  time: number,
  reduced: boolean,
): void {
  const index =
    view.readings.length > 0
      ? Math.max(0, SCANNER_AISLES.indexOf(view.reached))
      : 0
  const headX = RACK_X(index) + RACK_W / 2
  const full = view.boxes >= CARGO_LIMIT
  const scanning = view.readings.length > 0 && !full

  rect(context, 2, 8, 220, 2, '#2c3546')
  rect(context, 2, 8, 220, 1, '#4a5470')
  for (const x of [4, 214]) {
    rect(context, x, 3, 2, 7, '#232b3a')
    rect(context, x, 3, 2, 1, '#3a4457')
  }
  rect(context, headX - 9, 5, 18, 4, '#39445c')
  rect(context, headX - 9, 5, 18, 1, '#5a647e')
  rect(context, headX - 7, 6, 2, 2, '#1a2130')
  rect(context, headX + 5, 6, 2, 2, '#1a2130')
  rect(context, headX - 1, 9, 2, 3, '#1a2130')

  rect(context, headX - 7, 12, 14, 8, '#111827')
  rect(context, headX - 6, 13, 12, 6, '#4a5470')
  rect(context, headX - 6, 13, 12, 1, '#6b7690')
  rect(context, headX - 5, 14, 3, 1, alpha(COLORS.cream, 0.25))
  rect(context, headX - 3, 15, 6, 2, full ? '#ff7f6b' : scanning ? '#5ad1ff' : '#2a4a5a')
  if (scanning) {
    const pulse = reduced ? 0.09 : 0.07 + 0.04 * Math.sin(time / 180)
    glow(context, headX, 16, 8, COLORS.cyan, pulse)
    if (!reduced && Math.floor(time / 500) % 2 === 0) {
      rect(context, headX - 1, 15, 2, 1, '#c8f0ff')
    }
  }
  if (full) {
    const pulse = reduced ? 0.09 : 0.07 + 0.04 * Math.sin(time / 220)
    glow(context, headX, 16, 8, COLORS.red, pulse)
  }
  rect(context, headX + 8, 9, 1, 4, '#55627a')
  rect(context, headX + 8, 8, 1, 1, full ? '#ff7f6b' : '#7ccf75')
}

function drawContainer(
  context: CanvasRenderingContext2D,
  view: ScannerView,
  time: number,
  reduced: boolean,
  since: number,
): void {
  const boxes = view.boxes
  const full = boxes >= CARGO_LIMIT
  const complete = boxes === SCANNER_TOTAL && view.readings.length > 0

  rect(context, 4, 124, 216, 4, '#0a0e16')
  rect(context, 6, 96, 212, 30, '#1c2830')
  rect(context, 6, 96, 212, 2, '#3d5560')
  rect(context, 6, 96, 1, 30, '#0d151a')
  rect(context, 217, 96, 1, 30, '#0d151a')
  for (let x = 12; x < 216; x += 8) {
    rect(context, x, 99, 1, 23, alpha(COLORS.ink, 0.22))
    rect(context, x + 1, 99, 1, 23, alpha('#ffffff', 0.025))
  }

  label(context, 'CAJA TRANSPORTADORA', 13, 104, 5, '#93a3b5')
  const status = full
    ? 'LLENA'
    : view.readings.length > 0
      ? `P${view.reached} EN CURSO`
      : 'EN ESPERA'
  label(
    context,
    status,
    205,
    104,
    5,
    full ? '#ff9a8a' : view.readings.length > 0 ? '#8fd3ff' : '#7f8ba3',
    'right',
  )
  rect(
    context,
    208,
    100,
    3,
    3,
    full ? '#ff7f6b' : view.readings.length > 0 ? '#5ad1ff' : '#3a4457',
  )
  if (full) {
    const pulse = reduced ? 0.14 : 0.1 + 0.06 * Math.sin(time / 200)
    glow(context, 209, 101, 6, COLORS.red, pulse)
  }

  // Puerta del contenedor.
  rect(context, 198, 99, 1, 24, alpha(COLORS.ink, 0.35))
  rect(context, 199, 99, 1, 24, alpha('#ffffff', 0.05))

  for (let slot = 0; slot < CARGO_LIMIT; slot += 1) {
    const x = 13 + slot * 11
    const filled = slot < boxes
    rect(context, x, 107, 8, 7, filled ? '#a8742a' : '#202a36')
    rect(context, x, 107, 8, 1, filled ? '#d9a441' : '#2c3648')
    if (filled) {
      rect(context, x + 3, 108, 1, 6, '#6b4a18')
      rect(context, x, 113, 8, 1, '#6b4a18')
      if (!reduced && since < 500 && slot === boxes - 1) {
        glow(context, x + 4, 110, 7, COLORS.gold, 0.16)
      }
    } else {
      rect(context, x + 1, 109, 6, 1, '#2a3446')
    }
  }
  if (boxes > CARGO_LIMIT) {
    label(context, `+${boxes - CARGO_LIMIT}`, 125, 113, 5, COLORS.coral)
  }

  label(
    context,
    `Cajas cargadas: ${boxes}`,
    13,
    122,
    7,
    complete ? COLORS.lime : boxes > 0 ? COLORS.cream : '#9fb0c4',
  )
  if (full) label(context, 'break · STOP', 211, 122, 5, '#ff9a8a', 'right')
}

/** Lienzo del almacén: el escáner salta los pasillos vacíos y llena el contenedor. */
export function ScannerScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<ScannerView>(RESTING)
  const changedAtRef = useRef(0)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawWall(context)
      drawFloor(context, view)
      SCANNER_AISLES.forEach((_, index) => drawRack(context, index, view))
      drawBeam(context, view, time, reduced)
      drawScanner(context, view, time, reduced)
      drawContainer(
        context,
        view,
        time,
        reduced,
        Math.max(0, time - changedAtRef.current),
      )
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'scanner') continue
      changedAtRef.current = performance.now()
      setView({
        readings: step.readings,
        boxes: step.boxes,
        reached: step.reached,
      })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 460)
      })
    }
  }, [])

  const reset = useCallback(() => {
    changedAtRef.current = 0
    setView(RESTING)
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.readings.length === 0
      ? 'El almacén espera: seis pasillos impares, dos de ellos vacíos, y una caja transportadora de diez plazas.'
      : `Pasillos revisados: ${view.readings.join(', ')}. Cajas cargadas: ${view.boxes}, ${
          view.boxes >= CARGO_LIMIT ? 'la caja está llena y el escáner se ha detenido' : 'el escáner sigue revisando'
        }.`

  return <PixelCanvas label={description} draw={draw} />
}
