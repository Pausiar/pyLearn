import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128

interface SignView {
  text: string
  lit: boolean
}

function drawSign(context: CanvasRenderingContext2D, view: SignView): void {
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#0a0f24')
  for (let index = 0; index < 14; index += 1) {
    rect(context, ((index * 31) % 210) + 6, ((index * 17) % 34) + 6, 2, 2, '#2b3555')
  }

  rect(context, 176, 18, 10, 10, '#f2f0d8')
  rect(context, 20, 76, 40, 52, '#111830')
  rect(context, 70, 62, 34, 66, '#141c38')
  rect(context, 156, 70, 44, 58, '#111830')

  for (let index = 0; index < 6; index += 1) {
    rect(context, 26 + (index % 2) * 14, 84 + Math.floor(index / 2) * 12, 6, 6, '#2a3555')
    rect(context, 162 + (index % 2) * 14, 78 + Math.floor(index / 2) * 12, 6, 6, '#2a3555')
  }

  rect(context, 18, 26, 188, 58, '#0f1730')

  context.save()
  context.strokeStyle = view.lit ? '#ff5d73' : '#39405a'
  context.lineWidth = 3
  if (view.lit) {
    context.shadowColor = 'rgba(255, 93, 115, 0.85)'
    context.shadowBlur = 14
  }
  context.strokeRect(20, 28, 184, 54)
  context.restore()

  const value = view.text === '' ? '···' : view.text
  let size = 20
  context.font = `700 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`
  while (size > 8 && context.measureText(value).width > 164) {
    size -= 1
    context.font = `700 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`
  }

  context.save()
  if (view.lit) {
    context.shadowColor = 'rgba(255, 215, 106, 0.9)'
    context.shadowBlur = 12
  }
  label(context, value, 112, 62, size, view.lit ? '#ffd76a' : '#4a5270', 'center')
  context.restore()

  label(context, 'CIUDAD DE NEÓN', 112, 104, 8, '#4a5575', 'center')
}

/** Lienzo del letrero: se enciende con el texto que le pasa el programa. */
export function SignsScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<SignView>({ text: '', lit: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawSign(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'sign') continue
      if (!aliveRef.current) return
      setView({ text: step.text, lit: step.lit })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 360)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ text: '', lit: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = view.lit ? `El letrero dice: ${view.text}.` : 'El letrero está apagado.'

  return (
    <div className="field">
      <canvas
        ref={canvasRef}
        className="field__canvas"
        width={WIDTH}
        height={HEIGHT}
        role="img"
        aria-label={description}
      />
      <p className="field__caption" aria-hidden="true">
        {description}
      </p>
    </div>
  )
}
