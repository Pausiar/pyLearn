import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface ConvoyView {
  full: string[]
  convoy: string[]
  formed: boolean
}

function drawConvoy(context: CanvasRenderingContext2D, view: ConvoyView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#141c26')
  rect(context, 0, 70, WIDTH, 4, '#3a4a5e')
  rect(context, 0, 74, WIDTH, 54, '#1b2431')

  view.full.forEach((load, index) => {
    const x = 6 + index * 24
    const dentro = view.formed && view.convoy.includes(load) && index >= 1 && index <= 4
    const especial = index === 0 || load === 'furgón'
    const body = dentro ? '#2f6f3a' : especial ? '#3b4761' : '#8a5a2b'

    rect(context, x, 32, 21, 38, body)
    rect(context, x, 32, 21, 5, dentro ? '#3f8a4c' : '#22303f')

    const short = load.length > 8 ? `${load.slice(0, 7)}.` : load
    label(context, short, x + 10, 52, 6, dentro ? '#eaf7ee' : '#c9d4e4', 'center')
    label(context, String(index), x + 10, 64, 6, '#7f8db8', 'center')
  })

  label(context, 'TREN LARGO: 9 vagones, del 0 al 8', 10, 18, 8, '#8f9bb8')

  if (view.formed) {
    label(context, `convoy: ${view.convoy.join(', ')}`, 10, 96, 8, '#bdf0c4')
    label(context, `vagones en el convoy: ${view.convoy.length}`, 10, 110, 8, '#8de08f')
    label(
      context,
      `furgón dentro: ${view.convoy.includes('furgón') ? 'True' : 'False'}`,
      10,
      124,
      8,
      '#9aa7c4',
    )
  } else {
    label(context, 'El convoy todavía no se ha formado.', 10, 96, 8, '#8f9bb8')
    label(context, 'Recorta los vagones 1 a 4 con una rebanada.', 10, 110, 8, '#6b7592')
  }
}

/** Lienzo del tren largo: qué vagones acaban dentro del convoy. */
export function ConvoyScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<ConvoyView>({ full: [], convoy: [], formed: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawConvoy(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'convoy') continue
      if (!aliveRef.current) return
      setView({ full: step.full, convoy: step.convoy, formed: step.formed })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 420)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ full: [], convoy: [], formed: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = view.formed
    ? `El convoy lleva ${view.convoy.length} vagones: ${view.convoy.join(', ')}.`
    : 'El convoy todavía no se ha formado.'

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
