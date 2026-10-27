import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect, truncate } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

function drawLighthouse(context: CanvasRenderingContext2D, lines: string[]): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#0e1730')
  for (let index = 0; index < 16; index += 1) {
    rect(context, ((index * 29) % 216) + 4, ((index * 13) % 40) + 6, 2, 2, '#3a4a7a')
  }

  rect(context, 0, 94, WIDTH, 34, '#13305a')
  rect(context, 0, 94, WIDTH, 2, '#1f4a7f')
  rect(context, 12, 106, 40, 2, '#1f4a7f')
  rect(context, 120, 114, 60, 2, '#1f4a7f')

  if (lines.length > 0) {
    context.fillStyle = 'rgba(255, 216, 106, 0.18)'
    context.beginPath()
    context.moveTo(44, 34)
    context.lineTo(WIDTH, 4)
    context.lineTo(WIDTH, 70)
    context.closePath()
    context.fill()
  }

  rect(context, 4, 86, 92, 12, '#242b46')
  rect(context, 26, 44, 36, 44, '#f2f2f5')
  rect(context, 26, 54, 36, 8, '#e05263')
  rect(context, 26, 70, 36, 8, '#e05263')
  rect(context, 20, 40, 48, 5, '#2a3350')
  rect(context, 30, 28, 28, 12, '#2a3350')
  rect(context, 33, 30, 22, 7, lines.length > 0 ? '#ffe08a' : '#4a5575')

  context.fillStyle = '#e05263'
  context.beginPath()
  context.moveTo(26, 28)
  context.lineTo(44, 16)
  context.lineTo(62, 28)
  context.closePath()
  context.fill()

  rect(context, 104, 14, 112, 76, '#0a1226')
  context.strokeStyle = '#2b3550'
  context.lineWidth = 2
  context.strokeRect(105, 15, 110, 74)
  label(context, 'MENSAJES', 112, 30, 8, '#7f8db8')

  if (lines.length === 0) {
    label(context, 'sin señal', 112, 52, 9, '#7f8db8')
    return
  }

  lines.slice(-3).forEach((line, index) => {
    label(context, truncate(line, 16), 112, 50 + index * 14, 9, '#e8f1ff')
  })
}

/** Lienzo del faro: cada mensaje impreso enciende la lámpara y aparece en el panel. */
export function LighthouseScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [lines, setLines] = useState<string[]>([])

  const draw = useCallback((value: string[]) => {
    const context = canvasRef.current?.getContext('2d')
    if (context) drawLighthouse(context, value)
  }, [])

  useEffect(() => {
    aliveRef.current = true
    draw(lines)
    return () => {
      aliveRef.current = false
    }
  }, [lines, draw])

  const play = useCallback(
    async (steps: SceneStep[]) => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const wait = (ms: number) =>
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, reduced ? 0 : ms)
        })

      for (const step of steps) {
        if (step.kind !== 'lighthouse') continue
        if (!aliveRef.current) return
        setLines(step.lines)
        await wait(460)
      }
    },
    [],
  )

  const reset = useCallback(() => {
    setLines([])
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    lines.length === 0 ? 'El faro está apagado.' : `El faro ha enviado: ${lines.join(', ')}.`

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
