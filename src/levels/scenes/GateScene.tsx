import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface Visitor {
  pass: string
  door: string
}

function drawGate(context: CanvasRenderingContext2D, visitors: Visitor[]): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#1a1a2b')
  rect(context, 0, 78, WIDTH, 50, '#3b3f52')
  for (let index = 0; index < 7; index += 1) {
    rect(context, index * 32, 70, 16, 8, '#3b3f52')
  }
  rect(context, 92, 52, 44, 76, '#20233a')
  context.fillStyle = '#20233a'
  context.beginPath()
  context.moveTo(88, 56)
  context.lineTo(114, 30)
  context.lineTo(140, 56)
  context.closePath()
  context.fill()
  rect(context, 110, 96, 8, 8, '#d9b44a')

  visitors.slice(0, 3).forEach((visitor, index) => {
    const y = 12 + index * 22
    rect(context, 10, y, 20, 18, '#e8ecf5')
    label(context, visitor.pass, 20, y + 14, 11, '#1d1d1f', 'center')
    label(context, `→ ${visitor.door}`, 36, y + 14, 9, '#e8f1ff')
  })

  if (visitors.length === 0) {
    label(context, 'El guardián espera a los visitantes.', 12, 24, 9, '#8f9bb8')
  }
}

/** Lienzo del castillo: qué puerta recibe cada pase. */
export function GateScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [visitors, setVisitors] = useState<Visitor[]>([])

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawGate(context, visitors)

    return () => {
      aliveRef.current = false
    }
  }, [visitors])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'gate') continue
      if (!aliveRef.current) return
      setVisitors(step.visitors)
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 400)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setVisitors([])
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    visitors.length === 0
      ? 'El guardián espera a los visitantes.'
      : `El guardián ha atendido: ${visitors.map((visitor) => `pase ${visitor.pass}, ${visitor.door}`).join('; ')}.`

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
