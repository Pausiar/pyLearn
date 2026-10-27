import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { GRID_CELLS, GRID_COLUMNS, GRID_ROWS } from '../../engine/grid'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

const CELL_WIDTH = 30
const CELL_HEIGHT = 26
const ORIGIN_X = 8
const ORIGIN_Y = 22

interface GridView {
  watered: number[]
  cell: number
}

function drawGrid(context: CanvasRenderingContext2D, view: GridView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#15251a')
  rect(context, 0, 14, WIDTH, 3, '#1f3a28')

  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let column = 0; column < GRID_COLUMNS; column += 1) {
      const cell = row * GRID_COLUMNS + column
      const x = ORIGIN_X + column * CELL_WIDTH
      const y = ORIGIN_Y + row * CELL_HEIGHT
      const regada = view.watered.includes(cell)

      rect(context, x, y, CELL_WIDTH - 3, CELL_HEIGHT - 3, regada ? '#2f6f3a' : '#4a3a2a')
      if (regada) {
        rect(context, x + 8, y + 6, 10, 10, '#3fb34f')
        rect(context, x + 11, y + 12, 4, 6, '#7a4b2a')
      } else {
        rect(context, x + 10, y + 9, 6, 6, '#5a4a38')
      }

      if (cell === view.cell) {
        rect(context, x, y, CELL_WIDTH - 3, 2, '#4aa8ff')
        rect(context, x, y + CELL_HEIGHT - 5, CELL_WIDTH - 3, 2, '#4aa8ff')
      }
    }
  }

  const panelX = ORIGIN_X + GRID_COLUMNS * CELL_WIDTH + 6
  label(context, 'AVISOS', panelX, 30, 8, '#9fd7a8')

  for (let row = 0; row < GRID_ROWS; row += 1) {
    const completa = Array.from({ length: GRID_COLUMNS }, (_, column) => row * GRID_COLUMNS + column)
      .every((cell) => view.watered.includes(cell))

    label(
      context,
      `Fila ${row + 1}${completa ? ' ✓' : ''}`,
      panelX,
      46 + row * 14,
      8,
      completa ? '#8de08f' : '#6b7592',
    )
  }

  label(context, 'EL CAMPO DEL JEFE', 8, 124, 8, '#7fa88a')
  label(context, `Casillas: ${view.watered.length} / ${GRID_CELLS}`, WIDTH - 8, 124, 8, '#7fa88a', 'right')
}

/** Lienzo de la huerta del jefe: las doce casillas y las filas ya avisadas. */
export function GridScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<GridView>({ watered: [], cell: 0 })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawGrid(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'grid') continue
      if (!aliveRef.current) return
      setView({ watered: step.watered, cell: step.cell })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 220)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ watered: [], cell: 0 })
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
