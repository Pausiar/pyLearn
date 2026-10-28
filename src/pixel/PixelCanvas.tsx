import { useEffect, useRef } from 'react'
import { CANVAS_HEIGHT, CANVAS_SCALE, CANVAS_WIDTH } from './size'

export type SceneDraw = (
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
) => void

interface PixelCanvasProps {
  /** Descripción textual del estado del lienzo. */
  label: string
  draw: SceneDraw
  /** El lienzo se redibuja con requestAnimationFrame mientras no haya movimiento reducido. */
  animate?: boolean
  /** Suaviza el escalado en pantallas pequeñas; el dibujo ya es nítido a 2×. */
  smooth?: boolean
}

/**
 * Lienzo compartido: fija la escala, respeta `prefers-reduced-motion`, redibuja
 * cuando cambia el estado y mantiene el pie accesible en un solo sitio.
 */
export function PixelCanvas(props: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef(props.draw)
  drawRef.current = props.draw

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!context) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = media.matches
    let frame = 0

    const render = (time: number) => {
      context.setTransform(CANVAS_SCALE, 0, 0, CANVAS_SCALE, 0, 0)
      context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      drawRef.current(context, time, reduced)
    }

    const loop = (time: number) => {
      render(time)
      frame = window.requestAnimationFrame(loop)
    }

    const sync = () => {
      reduced = media.matches
      window.cancelAnimationFrame(frame)
      if (props.animate !== false && !reduced) {
        frame = window.requestAnimationFrame(loop)
      } else {
        render(performance.now())
      }
    }

    sync()
    media.addEventListener('change', sync)

    return () => {
      window.cancelAnimationFrame(frame)
      media.removeEventListener('change', sync)
    }
  }, [props.animate])

  // Cada cambio de estado se pinta aunque el bucle esté detenido.
  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!context) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    context.setTransform(CANVAS_SCALE, 0, 0, CANVAS_SCALE, 0, 0)
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    drawRef.current(context, performance.now(), reduced)
  })

  return (
    <div className="field">
      <canvas
        ref={canvasRef}
        className={props.smooth === false ? 'field__canvas' : 'field__canvas field__canvas--smooth'}
        width={CANVAS_WIDTH * CANVAS_SCALE}
        height={CANVAS_HEIGHT * CANVAS_SCALE}
        role="img"
        aria-label={props.label}
      />
      <p className="field__caption" aria-hidden="true">
        {props.label}
      </p>
    </div>
  )
}
