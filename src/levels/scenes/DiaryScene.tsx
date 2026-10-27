import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface DiaryView {
  lines: string[]
  counted: boolean
}

function drawDiary(context: CanvasRenderingContext2D, view: DiaryView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#1c1a24')
  rect(context, 0, 0, WIDTH, 18, '#2a2634')
  label(context, 'DIARIO DE A BORDO', 8, 6, 10, '#ffd479')
  label(context, 'diario.txt', 216, 6, 9, '#9aa8c2', 'right')

  rect(context, 20, 24, 184, 90, '#5a3a2a')
  rect(context, 26, 28, 172, 82, '#f4ecd8')
  rect(context, 26, 28, 172, 4, '#c9bda0')
  rect(context, 96, 28, 4, 82, '#e2d7bd')

  view.lines.forEach((line, index) => {
    label(context, line, 36, 48 + index * 18, 10, '#3a3226')
  })

  rect(context, 0, 118, WIDTH, 10, '#2a2634')
  label(
    context,
    view.counted ? `LÍNEAS: ${view.lines.length}` : 'Escribiendo…',
    8,
    126,
    9,
    view.counted ? '#8fd3a6' : '#9aa8c2',
  )
}

/** Lienzo del diario: las líneas que van entrando en el archivo y su recuento. */
export function DiaryScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<DiaryView>({ lines: [], counted: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawDiary(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'diary') continue
      if (!aliveRef.current) return
      setView({ lines: step.lines, counted: step.counted })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ lines: [], counted: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const written = view.lines.filter((line) => line !== '')
  const description =
    written.length === 0
      ? 'El diario está en blanco.'
      : `El diario lleva ${written.length} líneas: ${written.join('; ')}.`

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
