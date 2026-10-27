import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface RocketView {
  fuel: number
  sent: boolean
}

function drawRocket(context: CanvasRenderingContext2D, view: RocketView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#0b1024')
  for (let index = 0; index < 16; index += 1) {
    rect(context, ((index * 27) % 210) + 6, ((index * 19) % 36) + 6, 2, 2, '#2f3a63')
  }

  rect(context, 0, 104, WIDTH, 24, '#232a44')
  rect(context, 0, 104, WIDTH, 2, '#39405f')

  rect(context, 84, 84, 8, 20, '#e05263')
  rect(context, 128, 84, 8, 20, '#e05263')
  rect(context, 92, 44, 36, 60, '#e8ecf5')
  rect(context, 92, 44, 36, 8, '#c9cfdd')
  rect(context, 104, 58, 12, 12, '#5ad1ff')

  context.fillStyle = '#e05263'
  context.beginPath()
  context.moveTo(92, 44)
  context.lineTo(110, 20)
  context.lineTo(128, 44)
  context.closePath()
  context.fill()

  if (view.sent) {
    context.fillStyle = '#ffb04a'
    context.beginPath()
    context.moveTo(98, 104)
    context.lineTo(110, 124)
    context.lineTo(122, 104)
    context.closePath()
    context.fill()
  }

  rect(context, 152, 26, 62, 74, '#0a1226')
  context.strokeStyle = '#2b3550'
  context.lineWidth = 2
  context.strokeRect(153, 27, 60, 72)
  label(context, 'TONELADAS', 183, 44, 8, '#7f8db8', 'center')
  label(context, view.sent ? String(view.fuel) : '—', 183, 78, 24, '#e8f1ff', 'center')
  label(context, view.sent ? 'en la torre' : 'sin datos', 183, 94, 8, '#7f8db8', 'center')
}

/** Lienzo del cohete: muestra las toneladas que recibe la torre. */
export function RocketScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<RocketView>({ fuel: 0, sent: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawRocket(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'rocket') continue
      if (!aliveRef.current) return
      setView({ fuel: step.fuel, sent: step.sent })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ fuel: 0, sent: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = view.sent
    ? `La torre ha recibido ${view.fuel} toneladas.`
    : 'La torre sigue esperando.'

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
