import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { GRID_CELLS, GRID_COLUMNS, GRID_MESSAGES, GRID_ROWS } from '../../engine/grid'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface GridView {
  watered: number[]
  cell: number
}

const RESTING: GridView = { watered: [], cell: 0 }

function rowDone(row: number, watered: number[]): boolean {
  for (let column = 0; column < GRID_COLUMNS; column += 1) {
    if (!watered.includes(row * GRID_COLUMNS + column)) return false
  }
  return true
}

function drawGrid(context: CanvasRenderingContext2D, view: GridView, elapsed: number, reduced: boolean): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  // Cielo y tierra en planos; las filas se alejan con perspectiva.
  rect(context, 0, 0, WIDTH, 30, '#1a2c44')
  rect(context, 0, 30, WIDTH, 98, '#4a3a22')
  rect(context, 0, 30, WIDTH, 3, '#5e4c2e')

  for (let row = 0; row < GRID_ROWS; row += 1) {
    const top = 46 + row * 22
    const scale = 1 + row * 0.12
    const done = rowDone(row, view.watered)
    rect(context, 16, top + 14, 150 * scale, 2, '#3a2a18')

    for (let column = 0; column < GRID_COLUMNS; column += 1) {
      const cell = row * GRID_COLUMNS + column
      const x = 22 + column * 42 * scale
      const watered = view.watered.includes(cell)
      rect(context, x, top + 6, 6, 4, '#2c2010')
      rect(context, x + 1, top + 2, 5 * scale, 4 * scale, watered ? (done ? '#4ce07a' : '#3fb34f') : '#6a5a40')
      if (cell === view.cell) rect(context, x - 2, top - 2, 9 * scale, 2, '#4aa8ff')
    }
    label(context, `fila ${row + 1}`, 4, top + 10, 7, done ? '#a3ffc4' : '#9a8a6a')

    if (done) {
      rect(context, 164, top - 6, 56, 12, 'rgba(10,18,38,0.85)')
      label(context, GRID_MESSAGES[row] ?? '', 167, top + 3, 6, '#e8f1ff')
    }
  }

  // Dron: sigue la casilla que se riega.
  const column = view.cell % GRID_COLUMNS
  const row = Math.floor(view.cell / GRID_COLUMNS)
  const scale = 1 + row * 0.12
  const dx = 22 + column * 42 * scale + 3
  const dy = 46 + row * 22 - 6 + (reduced ? 0 : Math.sin(elapsed / 200) * 1)
  rect(context, dx - 4, dy, 8, 3, '#8ad0ff')
  rect(context, dx - 1, dy + 3, 2, 2, '#8ad0ff')

  rect(context, 4, 100, 150, 22, 'rgba(10,18,38,0.85)')
  label(context, `casillas: ${view.watered.length} / ${GRID_CELLS}`, 10, 115, 8, '#e8f1ff')
  if (view.watered.length === GRID_CELLS) label(context, '¡Campo entero!', 214, 115, 8, '#ffe08a', 'right')
}

/** Lienzo del campo del jefe: tres filas en perspectiva y un cartel por fila completada. */
export function GridScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const bornRef = useRef(0)
  const [view, setView] = useState<GridView>(RESTING)

  useEffect(() => {
    aliveRef.current = true
    bornRef.current = performance.now()
    const context = canvasRef.current?.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    if (context) {
      const tick = (now: number) => {
        drawGrid(context, view, now - bornRef.current, reduced)
        if (!reduced) frame = window.requestAnimationFrame(tick)
      }
      tick(performance.now())
    }

    return () => {
      aliveRef.current = false
      window.cancelAnimationFrame(frame)
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'grid') continue
      if (!aliveRef.current) return
      setView({ watered: step.watered, cell: step.cell })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 260)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView(RESTING)
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = `Casillas regadas: ${view.watered.length} de ${GRID_CELLS}. El dron está en la casilla ${view.cell + 1}.`

  return (
    <div className="field">
      <canvas
        ref={canvasRef}
        className="field__canvas field__canvas--smooth"
        width={WIDTH * SCALE}
        height={HEIGHT * SCALE}
        role="img"
        aria-label={description}
      />
      <p className="field__caption" aria-hidden="true">
        {description}
      </p>
    </div>
  )
}
