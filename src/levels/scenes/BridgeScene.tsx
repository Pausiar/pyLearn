import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface BridgeAction {
  puente: string
  action: 'cruzado' | 'desvio' | 'cortado'
}

interface BridgeView {
  actions: BridgeAction[]
}

const BRIDGE_NAMES = ['norte', 'sur', 'este'] as const

function stateOf(view: BridgeView, puente: string): BridgeAction['action'] | 'pendiente' {
  const events = view.actions.filter((event) => event.puente === puente)
  const last = events[events.length - 1]
  return last === undefined ? 'pendiente' : last.action
}

function drawBridge(context: CanvasRenderingContext2D, view: BridgeView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#101b2b')
  rect(context, 0, 0, WIDTH, 18, '#1b2b42')
  label(context, 'LA CARAVANA Y LOS PUENTES', 8, 6, 9, '#8fb7ff')
  label(context, `${view.actions.length} pasos`, 216, 6, 9, '#9aa8c2', 'right')

  rect(context, 0, 96, WIDTH, 32, '#123a5c')
  rect(context, 0, 96, WIDTH, 3, '#2f6f9c')

  BRIDGE_NAMES.forEach((puente, index) => {
    const x = 26 + index * 68
    const state = stateOf(view, puente)
    const plank =
      state === 'cruzado'
        ? '#4aa86a'
        : state === 'desvio'
          ? '#e7a44a'
          : state === 'cortado'
            ? '#e7777b'
            : '#5a6a86'

    label(context, puente.toUpperCase(), x + 20, 34, 10, '#cfe0ff', 'center')

    rect(context, x, 62, 6, 38, '#3a4a63')
    rect(context, x + 34, 62, 6, 38, '#3a4a63')

    if (state === 'cortado') {
      rect(context, x, 92, 16, 8, plank)
      rect(context, x + 24, 92, 16, 8, plank)
      label(context, 'roto', x + 20, 54, 9, '#ff8f92', 'center')
    } else {
      rect(context, x, 92, 40, 8, plank)
      if (state === 'cruzado') label(context, 'cruzado', x + 20, 54, 9, '#8fd3a6', 'center')
      else if (state === 'desvio') label(context, 'desvío', x + 20, 54, 9, '#ffd479', 'center')
      else label(context, 'sin pasar', x + 20, 54, 9, '#5a6a86', 'center')
    }
  })

  const crossed = view.actions.filter((event) => event.action === 'cruzado').length
  const cartX = 12 + crossed * 68
  rect(context, cartX, 112, 20, 11, '#c98d4a')
  rect(context, cartX + 4, 105, 12, 7, '#e8f1ff')
  rect(context, cartX + 2, 123, 4, 4, '#8a9ab8')
  rect(context, cartX + 14, 123, 4, 4, '#8a9ab8')
}

/** Lienzo del puente: cada puente con su estado y la caravana que va avanzando. */
export function BridgeScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<BridgeView>({ actions: [] })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawBridge(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'bridge') continue
      if (!aliveRef.current) return
      setView({ actions: step.actions })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ actions: [] })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const story = BRIDGE_NAMES.map((puente) => {
    const state = stateOf(view, puente)
    return `${puente}: ${state === 'pendiente' ? 'sin pasar' : state}`
  }).join(', ')
  const description =
    view.actions.length === 0
      ? 'La caravana espera en la orilla.'
      : `La caravana lleva ${view.actions.length} pasos. Estado de los puentes: ${story}.`

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
