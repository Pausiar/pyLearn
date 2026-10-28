import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { GRID_CELLS, GRID_COLUMNS, GRID_ROWS } from '../../engine/grid'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { COLORS } from '../../pixel/palette'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import {
  alpha,
  disc,
  dither,
  glow,
  gradient,
  groundTexture,
  label,
  line,
  rand,
  rect,
  speckle,
  starfield,
} from '../../pixel/shapes'

const WIDTH = 224
const BED_W = 38
const BED_H = 12
const BED_X = (column: number): number => 30 + column * 42
const BED_TOPS = [32, 56, 80] as const

interface GridView {
  watered: number[]
  cell: number
}

const RESTING: GridView = { watered: [], cell: 0 }

function rowDone(row: number, watered: readonly number[]): boolean {
  for (let column = 0; column < GRID_COLUMNS; column += 1) {
    if (!watered.includes(row * GRID_COLUMNS + column)) return false
  }
  return true
}

function drawRoof(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
): void {
  gradient(context, 0, 0, WIDTH, 12, '#0a1322', '#1b3040', 5)
  starfield(context, 0, 0, WIDTH, 11, '#aebbd4', 503, 18, time, reduced)

  glow(context, 196, 5, 8, COLORS.cream, 0.1)
  disc(context, 196, 5, 3, COLORS.cream)
  rect(context, 195, 4, 1, 1, '#e8cfa0')
  rect(context, 197, 6, 1, 1, '#f0d9ac')

  line(context, 22, 0, 8, 12, alpha(COLORS.cream, 0.06))
  line(context, 124, 0, 110, 12, alpha(COLORS.cream, 0.05))

  for (let x = 0; x < WIDTH; x += 42) {
    rect(context, x, 0, 2, 12, '#203441')
    rect(context, x, 0, 1, 12, '#2c4654')
  }

  // Viga de carga y raíl de las lámparas de cultivo.
  rect(context, 0, 12, WIDTH, 4, '#2a3f49')
  rect(context, 0, 12, WIDTH, 1, '#45606a')
  rect(context, 0, 15, WIDTH, 1, '#16232a')
  rect(context, 8, 16, 208, 2, '#39445c')
  rect(context, 8, 16, 208, 1, '#55627a')

  for (let x = 18; x < 204; x += 24) {
    rect(context, x, 18, 10, 2, '#ffe0a0')
    rect(context, x + 1, 18, 8, 1, '#fff6d8')
    glow(context, x + 5, 20, 6, '#ffd27a', 0.04)
  }
}

function drawWall(context: CanvasRenderingContext2D): void {
  gradient(context, 0, 18, WIDTH, 70, '#1e332c', '#101a17', 7)
  dither(context, 0, 18, WIDTH, 70, alpha(COLORS.ink, 0.16), 3)
  rect(context, 0, 18, WIDTH, 5, alpha('#ffe0a0', 0.045))
  rect(context, 0, 23, WIDTH, 9, alpha('#ffd27a', 0.02))

  for (const x of [24, 66, 108, 150, 192]) {
    rect(context, x, 18, 2, 70, '#152420')
    rect(context, x + 1, 18, 1, 70, alpha('#5a7a68', 0.1))
  }

  line(context, 10, 22, 40, 88, alpha(COLORS.cream, 0.025))
  line(context, 214, 24, 186, 88, alpha(COLORS.cream, 0.02))
}

function drawFloor(context: CanvasRenderingContext2D): void {
  groundTexture(context, 0, 88, WIDTH, 8, '#1a2620', '#31453a', '#0e1713', 907)
  rect(context, 0, 88, WIDTH, 1, '#0b1310')
  for (let x = 0; x < WIDTH; x += 28) rect(context, x, 89, 1, 7, '#152119')
}

function drawSprout(
  context: CanvasRenderingContext2D,
  cx: number,
  base: number,
  wet: boolean,
  seed: number,
): void {
  if (!wet) {
    rect(context, cx, base - 2, 1, 2, '#55703f')
    rect(context, cx - 2, base - 3, 2, 1, '#4a6238')
    rect(context, cx + 1, base - 2, 2, 1, '#405635')
    if (rand(seed + 7) > 0.6) rect(context, cx - 3, base - 3, 1, 1, '#5a7a42')
    return
  }

  const stem = 3 + (rand(seed + 13) > 0.5 ? 1 : 0)
  rect(context, cx, base - stem, 1, stem, '#7fc95a')
  rect(context, cx - 2, base - stem - 1, 2, 1, '#8fdd5f')
  rect(context, cx - 3, base - stem, 1, 1, '#a7e56f')
  rect(context, cx + 1, base - stem - 2, 2, 1, '#a7e56f')
  rect(context, cx + 2, base - stem - 1, 1, 1, '#8fdd5f')
  if (rand(seed + 29) > 0.55) {
    rect(context, cx, base - stem - 2, 1, 1, '#ffe08a')
  }
}

function drawBed(
  context: CanvasRenderingContext2D,
  row: number,
  column: number,
  time: number,
  view: GridView,
): void {
  const x = BED_X(column)
  const top = BED_TOPS[row]
  const cell = row * GRID_COLUMNS + column
  const wet = view.watered.includes(cell)
  const active = view.watered.length > 0 && view.cell === cell

  rect(context, x + 3, top + 12, 4, 2, '#0d1512')
  rect(context, x + BED_W - 7, top + 12, 4, 2, '#0d1512')
  rect(context, x + 1, top + 13, BED_W - 2, 2, alpha(COLORS.ink, 0.3))

  rect(context, x, top, BED_W, BED_H, '#34453c')
  rect(context, x, top, BED_W, 3, '#677c6e')
  rect(context, x, top, BED_W, 1, '#8ba091')
  rect(context, x, top + 2, BED_W, 1, '#4d6054')
  rect(context, x, top + 3, 1, 7, '#52665a')
  rect(context, x + BED_W - 1, top + 3, 1, 7, '#28362f')
  rect(context, x, top + 10, BED_W, 2, '#485a50')
  rect(context, x, top + 11, BED_W, 1, '#22302a')
  rect(context, x + 2, top + 2, 1, 1, '#9bad9e')
  rect(context, x + BED_W - 3, top + 2, 1, 1, '#84988a')

  rect(context, x + 2, top + 3, BED_W - 4, 7, wet ? '#2b2118' : '#4b3826')
  rect(context, x + 2, top + 3, BED_W - 4, 1, wet ? '#1c1510' : '#5c4530')
  speckle(
    context,
    x + 2,
    top + 4,
    BED_W - 4,
    6,
    wet ? '#1d1610' : '#5d4730',
    173 + cell * 37,
    10,
  )

  if (wet) {
    rect(context, x + 6, top + 5, 5, 1, alpha('#7fe0ff', 0.22))
    rect(context, x + 24, top + 8, 6, 1, alpha('#7fe0ff', 0.16))
    const gleam = 0.5 + 0.3 * Math.sin(time / 420 + cell)
    rect(context, x + 15, top + 8, 1, 1, alpha(COLORS.ice, gleam))
    rect(context, x + 31, top + 5, 1, 1, alpha(COLORS.ice, gleam * 0.8))
  }

  for (let plant = 0; plant < 3; plant += 1) {
    drawSprout(context, x + 9 + plant * 10, top + 9, wet, cell * 57 + plant * 11)
  }

  if (active) {
    const edge = view.watered.length === GRID_CELLS ? alpha(COLORS.lime, 0.65) : alpha(COLORS.cyan, 0.75)
    rect(context, x - 1, top - 1, BED_W + 2, 1, edge)
    rect(context, x - 1, top + BED_H, BED_W + 2, 1, edge)
    rect(context, x - 1, top, 1, BED_H, edge)
    rect(context, x + BED_W, top, 1, BED_H, edge)
  }
}

function drawSign(
  context: CanvasRenderingContext2D,
  row: number,
  view: GridView,
): void {
  const top = BED_TOPS[row]
  const done = rowDone(row, view.watered)
  const active =
    view.watered.length > 0 && Math.floor(view.cell / GRID_COLUMNS) === row

  rect(context, 6, top + 2, 18, 10, '#101c17')
  rect(context, 6, top + 2, 18, 1, done ? '#4fae62' : active ? '#2f7a86' : '#33473d')
  rect(context, 6, top + 2, 1, 10, done ? '#3d8a4e' : active ? '#2a6a74' : '#25362d')
  rect(context, 7, top + 4, 2, 2, done ? '#b8e986' : active ? '#5ad1ff' : '#2a3a33')
  label(
    context,
    `F${row + 1}`,
    16,
    top + 10,
    7,
    done ? '#a7e56f' : active ? '#9fe0f5' : '#8fa396',
    'center',
  )
}

function drawPipe(context: CanvasRenderingContext2D): void {
  rect(context, 205, 18, 3, 70, '#2f4438')
  rect(context, 205, 18, 1, 70, '#58705f')
  rect(context, 207, 18, 1, 70, '#1e2c25')

  for (const y of [26, 50, 74]) {
    rect(context, 203, y, 7, 3, '#48604f')
    rect(context, 203, y, 7, 1, '#6b8372')
  }

  line(context, 207, 38, 210, 38, '#58705f')
  line(context, 210, 38, 210, 41, '#435a4b')
  disc(context, 212, 38, 3, '#6f8b74')
  disc(context, 212, 38, 2, '#26382e')
  rect(context, 212, 38, 1, 1, '#b8ccb8')

  rect(context, 201, 56, 14, 8, '#16221c')
  rect(context, 201, 56, 14, 1, '#31483a')
  line(context, 208, 63, 210, 59, '#ff9a8a')
  rect(context, 203, 58, 1, 1, '#7ccf75')

  rect(context, 203, 84, 8, 3, '#3d5445')
  rect(context, 203, 84, 8, 1, '#5d7663')

  // Cubo de agua junto a la bajante.
  rect(context, 197, 89, 11, 6, '#3a564a')
  rect(context, 197, 89, 11, 1, '#5d7a68')
  rect(context, 197, 94, 11, 1, '#22332b')
  rect(context, 198, 89, 9, 1, '#4aa8ff')
  line(context, 199, 89, 200, 86, '#5d7a68')
  line(context, 200, 86, 205, 86, '#5d7a68')
  line(context, 205, 86, 206, 89, '#5d7a68')
}

function drawDrone(
  context: CanvasRenderingContext2D,
  view: GridView,
  time: number,
  reduced: boolean,
): void {
  const row = Math.floor(view.cell / GRID_COLUMNS)
  const column = view.cell % GRID_COLUMNS
  const cx = BED_X(column) + BED_W / 2
  const complete = view.watered.length === GRID_CELLS
  const watering = view.watered.length > 0 && !complete
  const cy =
    BED_TOPS[row] -
    7 -
    (reduced ? 0 : Math.round(Math.abs(Math.sin(time / 260))))

  disc(context, cx, BED_TOPS[row] + 5, 4, alpha(COLORS.ink, 0.16))
  rect(context, cx - 8, BED_TOPS[row] + 5, 16, 1, alpha(COLORS.ink, 0.12))

  const blade = reduced ? 5 : 4 + (Math.floor(time / 70) % 2) * 2
  rect(context, cx - 9, cy - 4, blade, 1, alpha('#c8d4e0', 0.55))
  rect(context, cx + 9 - blade, cy - 4, blade, 1, alpha('#c8d4e0', 0.55))
  rect(context, cx - 9, cy - 4, 1, 1, '#55627a')
  rect(context, cx + 8, cy - 4, 1, 1, '#55627a')
  line(context, cx - 7, cy - 2, cx - 3, cy - 2, '#39445c')
  line(context, cx + 3, cy - 2, cx + 7, cy - 2, '#39445c')

  rect(context, cx - 4, cy - 3, 9, 4, '#4a5570')
  rect(context, cx - 4, cy - 3, 9, 1, '#7f8ba3')
  rect(context, cx - 4, cy + 1, 9, 1, '#222a3a')
  rect(context, cx - 1, cy - 1, 2, 2, complete ? '#b8e986' : watering ? '#5ad1ff' : '#2a4a5a')

  rect(context, cx + 2, cy - 5, 1, 2, '#55627a')
  rect(context, cx + 2, cy - 6, 1, 1, complete ? '#b8e986' : '#7ccf75')

  rect(context, cx - 3, cy + 1, 7, 3, '#274b52')
  rect(context, cx - 3, cy + 1, 7, 1, '#3f7a7a')
  rect(context, cx - 2, cy + 3, 5, 1, '#5ad1ff')
  rect(context, cx - 3, cy + 4, 7, 1, '#1a2a2e')
  rect(context, cx, cy + 5, 1, 2, '#8fa396')

  if (watering) glow(context, cx, cy + 2, 6, COLORS.cyan, 0.07)
  if (complete) glow(context, cx, cy, 7, COLORS.lime, 0.06)
}

function drawDrops(
  context: CanvasRenderingContext2D,
  view: GridView,
  time: number,
  reduced: boolean,
): void {
  if (reduced || view.watered.length === 0 || view.watered.length === GRID_CELLS) return
  const row = Math.floor(view.cell / GRID_COLUMNS)
  const column = view.cell % GRID_COLUMNS
  const cx = BED_X(column) + BED_W / 2
  const start = BED_TOPS[row] - 1
  const end = BED_TOPS[row] + 5

  for (const offset of [0, 0.5]) {
    const phase = (time / 380 + offset) % 1
    const y = start + phase * (end - start)
    rect(context, cx + (offset > 0 ? 1 : -1), y, 1, 2, alpha(COLORS.cyan, 0.7))
  }
  const splash = Math.floor(time / 220) % 2
  rect(context, cx - 2 + splash * 3, end, 1, 1, alpha(COLORS.ice, 0.55))
  rect(context, cx + 1, end + 1, 1, 1, alpha(COLORS.ice, 0.4))
}

function drawMotes(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
): void {
  for (let index = 0; index < 4; index += 1) {
    const baseX = 36 + rand(901 + index * 13) * 150
    const baseY = 24 + rand(902 + index * 29) * 54
    const x = baseX + (reduced ? 0 : Math.sin(time / 1800 + index) * 2)
    const y = baseY + (reduced ? 0 : Math.cos(time / 2300 + index * 2) * 2)
    rect(context, x, y, 1, 1, alpha(COLORS.cream, 0.35))
  }
}

function drawPanel(
  context: CanvasRenderingContext2D,
  view: GridView,
  time: number,
  reduced: boolean,
): void {
  const complete = view.watered.length === GRID_CELLS
  const running = view.watered.length > 0 && !complete
  const rows = [0, 1, 2].map((row) => rowDone(row, view.watered))

  rect(context, 4, 124, 216, 4, '#0a0e16')
  rect(context, 6, 96, 212, 30, '#18251f')
  rect(context, 6, 96, 212, 1, '#3c5a49')
  rect(context, 6, 96, 1, 30, '#0e1713')
  rect(context, 217, 96, 1, 30, '#0e1713')
  rect(context, 6, 125, 212, 1, '#0e1713')

  label(context, 'PANEL DE RIEGO', 13, 103, 5, '#8fa396')
  const status = complete ? 'CAMPO LISTO' : running ? 'REGANDO' : 'EN ESPERA'
  const statusColour = complete ? COLORS.lime : running ? '#8fd3ff' : '#7f8ba3'
  label(context, status, 205, 103, 5, statusColour, 'right')
  rect(context, 210, 100, 3, 3, complete ? '#b8e986' : running ? '#5ad1ff' : '#3a4a42')
  if (complete) {
    const pulse = reduced ? 0.12 : 0.1 + 0.05 * Math.sin(time / 220)
    glow(context, 211, 101, 6, COLORS.lime, pulse)
  }

  for (let index = 0; index < GRID_CELLS; index += 1) {
    const x = 13 + index * 8 + Math.floor(index / GRID_COLUMNS) * 3
    const wet = view.watered.includes(index)
    rect(context, x, 107, 5, 6, wet ? '#2b6b7a' : '#1d2b25')
    rect(context, x, 107, 5, 1, wet ? '#8fe6d8' : '#263831')
    if (wet) rect(context, x + 1, 111, 3, 1, '#2b6cb0')
  }

  label(
    context,
    `Casillas: ${view.watered.length}/${GRID_CELLS}`,
    13,
    122,
    7,
    complete ? COLORS.lime : '#d7e3d9',
  )

  rect(context, 126, 105, 84, 18, '#0e1712')
  rect(context, 126, 105, 84, 1, '#22352c')
  for (let row = 0; row < GRID_ROWS; row += 1) {
    const done = rows[row]
    label(
      context,
      done ? `> Fila ${row + 1} regada` : `> Fila ${row + 1}`,
      129,
      110 + row * 6,
      5,
      done ? '#a7e56f' : '#4f6157',
    )
  }
}

/** Lienzo del invernadero: el dron riega los doce bancales fila a fila. */
export function GridScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<GridView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawRoof(context, time, reduced)
      drawWall(context)
      drawFloor(context)
      for (let row = 0; row < GRID_ROWS; row += 1) drawSign(context, row, view)
      for (let row = 0; row < GRID_ROWS; row += 1) {
        for (let column = 0; column < GRID_COLUMNS; column += 1) {
          drawBed(context, row, column, time, view)
        }
      }
      drawPipe(context)
      drawMotes(context, time, reduced)
      drawDrone(context, view, time, reduced)
      drawDrops(context, view, time, reduced)
      drawPanel(context, view, time, reduced)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'grid') continue
      setView({ watered: step.watered, cell: step.cell })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 430)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView(RESTING)
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const healed = [0, 1, 2].filter((row) => rowDone(row, view.watered)).length
  const description =
    view.watered.length === 0
      ? 'Invernadero de noche: tres filas de cuatro bancales de cultivo esperan el riego del dron.'
      : `Bancales regados: ${view.watered.length} de ${GRID_CELLS}. Filas anunciadas: ${healed} de ${GRID_ROWS}. ${
          view.watered.length === GRID_CELLS
            ? `El campo está regado entero: el dron descansa sobre la fila ${
                Math.floor(view.cell / GRID_COLUMNS) + 1
              }, columna ${(view.cell % GRID_COLUMNS) + 1}.`
            : `El dron riega la fila ${Math.floor(view.cell / GRID_COLUMNS) + 1}, columna ${
                (view.cell % GRID_COLUMNS) + 1
              }.`
        }`

  return <PixelCanvas label={description} draw={draw} />
}
