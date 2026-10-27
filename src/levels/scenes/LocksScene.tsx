import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

function drawLocks(context: CanvasRenderingContext2D, open: (boolean | null)[]): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#1b2030')
  rect(context, 30, 12, 164, 100, '#39405a')
  rect(context, 36, 18, 152, 88, '#2f3550')
  for (let index = 0; index < 5; index += 1) {
    rect(context, 42, 24 + index * 18, 4, 4, '#59627f')
    rect(context, 178, 24 + index * 18, 4, 4, '#59627f')
  }

  open.forEach((state, index) => {
    const x = 62 + index * 50
    rect(context, x - 8, 42, 16, 8, '#232a44')
    rect(context, x - 16, 50, 32, 26, state === true ? '#248a3d' : state === false ? '#5a6273' : '#3a4152')

    if (state === true) {
      context.strokeStyle = '#ffffff'
      context.lineWidth = 3
      context.lineCap = 'round'
      context.beginPath()
      context.moveTo(x - 7, 63)
      context.lineTo(x - 1, 69)
      context.lineTo(x + 8, 57)
      context.stroke()
    } else {
      rect(context, x - 3, 60, 6, 9, '#232a44')
    }

    label(context, String(index + 1), x, 90, 10, '#c9d0e4', 'center')
  })
}

/** Lienzo de la cerradura: los tres candados de la puerta. */
export function LocksScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [open, setOpen] = useState<(boolean | null)[]>([null, null, null])

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawLocks(context, open)

    return () => {
      aliveRef.current = false
    }
  }, [open])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'locks') continue
      if (!aliveRef.current) return
      setOpen(step.open)
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setOpen([null, null, null])
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const abiertos = open.filter((state) => state === true).length
  const description = `Candados abiertos: ${abiertos} de 3.`

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
