import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface DiceView {
  rolls: number[]
  average: number
  shown: boolean
}

/** Los puntos de cada cara, en columna y fila dentro del dado. */
const PIPS: Record<number, readonly (readonly [number, number])[]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [2, 0],
    [0, 2],
    [2, 2],
  ],
  5: [
    [0, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [2, 2],
  ],
  6: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
  ],
}

function drawDice(context: CanvasRenderingContext2D, view: DiceView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#161226')
  rect(context, 0, 0, WIDTH, 18, '#231b3a')
  label(context, 'LA MESA DE DADOS', 8, 6, 10, '#c9a7ff')
  label(context, 'semilla 7', 216, 6, 9, '#9aa8c2', 'right')

  view.rolls.forEach((roll, index) => {
    const x = 32 + index * 56
    const y = 32

    rect(context, x, y, 40, 40, '#f4ecd8')
    rect(context, x, y, 40, 3, '#c9bda0')
    rect(context, x, y + 37, 40, 3, '#c9bda0')

    for (const [column, row] of PIPS[roll] ?? []) {
      rect(context, x + 8 + column * 12, y + 8 + row * 12, 6, 6, '#2a2340')
    }

    label(context, String(roll), x + 20, 88, 10, '#cfe0ff', 'center')
  })

  rect(context, 0, 100, WIDTH, 28, '#231b3a')
  label(
    context,
    view.shown ? `MEDIA: ${view.average}` : 'MEDIA: por calcular',
    8,
    112,
    10,
    view.shown ? '#8fd3a6' : '#9aa8c2',
  )
  label(context, `${view.rolls.length} tiradas`, 216, 112, 9, '#9aa8c2', 'right')
}

/** Lienzo de los dados: las tiradas que van saliendo y su media entera. */
export function DiceScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<DiceView>({ rolls: [], average: 0, shown: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawDice(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'dice') continue
      if (!aliveRef.current) return
      setView({ rolls: step.rolls, average: step.average, shown: step.shown })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ rolls: [], average: 0, shown: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.rolls.length === 0
      ? 'La mesa está sin tirar.'
      : `Han salido ${view.rolls.join(', ')}.${view.shown ? ` La media entera es ${view.average}.` : ''}`

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
