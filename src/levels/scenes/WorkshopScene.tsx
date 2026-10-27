import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface WorkshopView {
  name: string
  pieces: string[]
  ready: boolean | null
}

function drawWorkshop(context: CanvasRenderingContext2D, view: WorkshopView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#151d2a')
  rect(context, 0, 0, WIDTH, 18, '#1f2c3f')
  label(context, 'EL TALLER', 8, 6, 10, '#8fb7ff')
  label(
    context,
    view.ready === true ? 'robot listo' : view.ready === false ? 'faltan piezas' : 'sin parte',
    216,
    6,
    9,
    view.ready === true ? '#8fd3a6' : '#ffb648',
    'right',
  )

  // El robot: cabeza, antena, cuerpo y brazos.
  const has = (piece: string) => view.pieces.includes(piece)
  rect(context, 40, 34, 46, 32, '#9aa8c2')
  rect(context, 46, 46, 10, 8, '#2a2340')
  rect(context, 70, 46, 10, 8, '#2a2340')
  rect(context, 56, 60, 14, 4, '#2a2340')
  rect(context, 34, 70, 58, 40, '#7f8ba3')
  rect(context, 24, 76, 10, 26, '#9aa8c2')
  rect(context, 92, 76, 10, 26, '#9aa8c2')

  if (has('antena')) {
    rect(context, 61, 22, 4, 12, '#ffd479')
    rect(context, 59, 16, 8, 8, '#e7777b')
  }

  if (has('rueda')) {
    rect(context, 40, 110, 14, 12, '#2a2340')
    rect(context, 72, 110, 14, 12, '#2a2340')
  }

  label(context, (view.name || 'sin nombre').toUpperCase(), 40, 126, 10, '#e8f1ff')

  rect(context, 120, 30, 92, 78, '#1f2c3f')
  label(context, 'PIEZAS', 128, 42, 9, '#8fb7ff')

  const catalogue = ['rueda', 'antena', 'pinza', 'sensor']
  catalogue.forEach((piece, index) => {
    const y = 54 + index * 14
    const mounted = has(piece)
    rect(context, 128, y, 76, 11, mounted ? '#1c3324' : '#182338')
    label(context, piece, 134, y + 9, 9, mounted ? '#9fe7b4' : '#5f7595')
    if (mounted) label(context, 'montada', 198, y + 9, 8, '#8fd3a6', 'right')
  })

  label(context, `${view.pieces.length} de 4 piezas`, 128, 118, 9, '#9aa8c2')
}

/** Lienzo del taller: el robot con sus piezas montadas y el catálogo. */
export function WorkshopScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<WorkshopView>({ name: 'Bruno', pieces: [], ready: null })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawWorkshop(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'workshop') continue
      if (!aliveRef.current) return
      setView({ name: step.name, pieces: step.pieces, ready: step.ready })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ name: 'Bruno', pieces: [], ready: null })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.pieces.length === 0
      ? 'El robot está sin montar.'
      : `El robot ${view.name} lleva ${view.pieces.join(' y ')}.${
          view.ready === true ? ' Está listo.' : ''
        }`

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
