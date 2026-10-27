import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface PlagueView {
  lines: { text: string; ok: boolean }[]
}

function drawPlague(context: CanvasRenderingContext2D, view: PlagueView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#14201a')
  rect(context, 0, 0, WIDTH, 18, '#1c2c22')
  label(context, 'INFORME DE LA PLAGA', 8, 6, 10, '#9fe7b4')
  label(context, 'puesto de control', 216, 6, 9, '#9aa8c2', 'right')

  view.lines.forEach((line, index) => {
    const y = 28 + index * 30
    rect(context, 12, y, 200, 24, line.ok ? '#1c3324' : '#3a1f22')
    rect(context, 12, y, 4, 24, line.ok ? '#8fd3a6' : '#e7777b')
    label(context, line.text, 24, y + 15, 9, line.ok ? '#d9ffe6' : '#ffd9da')

    if (line.ok) {
      label(context, 'OK', 204, y + 15, 10, '#8fd3a6', 'right')
    } else {
      // Un bicho que se ha colado en la línea.
      rect(context, 188, y + 9, 8, 6, '#e7777b')
      rect(context, 186, y + 6, 4, 3, '#e7777b')
      rect(context, 194, y + 6, 4, 3, '#e7777b')
      rect(context, 186, y + 16, 4, 3, '#e7777b')
      rect(context, 194, y + 16, 4, 3, '#e7777b')
    }
  })

  const fixed = view.lines.filter((line) => line.ok).length
  label(context, `${fixed} de ${view.lines.length} líneas en su sitio`, 12, 122, 9, '#9aa8c2')
}

/** Lienzo del informe: las tres líneas con su visto bueno o su bicho escondido. */
export function PlagueScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<PlagueView>({ lines: [] })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawPlague(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'plague') continue
      if (!aliveRef.current) return
      setView({ lines: step.lines })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ lines: [] })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const fixed = view.lines.filter((line) => line.ok).length
  const broken = view.lines.filter((line) => !line.ok)
  const description =
    view.lines.length === 0
      ? 'El informe está sin comprobar.'
      : broken.length === 0
        ? 'Las tres líneas del informe están en su sitio.'
        : `${fixed} de ${view.lines.length} líneas en su sitio; falla ${broken
            .map((line) => `«${line.text}»`)
            .join(', ')}.`

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
