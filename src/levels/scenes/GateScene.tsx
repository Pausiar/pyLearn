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

function drawGate(context: CanvasRenderingContext2D, visitors: Visitor[], elapsed: number, reduced: boolean): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  // Cielo y muralla en planos: almenas y suelo.
  rect(context, 0, 0, WIDTH, HEIGHT, '#14142a')
  for (let index = 0; index < 8; index += 1) rect(context, index * 30, 40, 10, 8, '#2a2f3d')
  rect(context, 0, 48, WIDTH, 56, '#3b3f52')
  rect(context, 0, 48, WIDTH, 3, '#4a5268')
  rect(context, 0, 104, WIDTH, 24, '#2e2a33')

  // Puerta grande (izquierda) y pequeña (derecha): se abren si algún visitante entra por ellas.
  const bigOpen = visitors.some((visitor) => visitor.door === 'grande')
  const smallOpen = visitors.some((visitor) => visitor.door === 'pequeña')
  const openTime = reduced ? 1 : Math.min(elapsed / 500, 1)

  rect(context, 16, 60, 60, 44, '#0a0f1c')
  rect(context, 18, 62, 56, bigOpen ? 40 * (1 - openTime * 0.85) : 40, '#5a3e2b')
  rect(context, 140, 76, 40, 28, '#0a0f1c')
  rect(context, 142, 78, 36, smallOpen ? 26 * (1 - openTime * 0.85) : 26, '#5a3e2b')
  label(context, 'grande', 46, 56, 7, '#9aa8c2', 'center')
  label(context, 'pequeña', 160, 70, 7, '#9aa8c2', 'center')

  // Visitantes: su pase, y hacia dónde van.
  visitors.slice(0, 3).forEach((visitor, index) => {
    const y = 12 + index * 22
    rect(context, 6, y, 20, 18, '#e8ecf5')
    label(context, visitor.pass, 16, y + 14, 11, '#1d1d1f', 'center')
    label(context, `→ ${visitor.door}`, 30, y + 14, 9, '#e8f1ff')
  })

  // Guardián con la mano levantada si alguien se queda fuera.
  const denied = visitors.some((visitor) => visitor.door === 'sin entrada')
  rect(context, 182, 86, 10, 16, '#7a5a3a')
  rect(context, 181, 102, 12, 14, '#4a4a58')
  if (denied) {
    rect(context, 186, 76, 3, 10, '#ffb3bb')
    rect(context, 184, 72, 7, 6, '#ffb3bb')
    rect(context, 10, 110, 196, 12, '#2a1d24')
    label(context, 'denegar(): el pase C se queda fuera', 108, 119, 7, '#ffb3bb', 'center')
  }

  if (visitors.length === 0) {
    label(context, 'El guardián espera a los visitantes.', 12, 24, 9, '#8f9bb8')
  }
}

/** Lienzo del castillo: qué puerta recibe cada pase. */
export function GateScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const bornRef = useRef(0)
  const [visitors, setVisitors] = useState<Visitor[]>([])

  useEffect(() => {
    aliveRef.current = true
    bornRef.current = performance.now()
    const context = canvasRef.current?.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    if (context) {
      const tick = (now: number) => {
        drawGate(context, visitors, now - bornRef.current, reduced)
        if (!reduced) frame = window.requestAnimationFrame(tick)
      }
      tick(performance.now())
    }

    return () => {
      aliveRef.current = false
      window.cancelAnimationFrame(frame)
    }
  }, [visitors])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'gate') continue
      if (!aliveRef.current) return
      setVisitors(step.visitors)
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 480)
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
