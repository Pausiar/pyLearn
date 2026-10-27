import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { describeField, type DroneAction } from '../engine/drone'
import {
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  drawField,
  type SceneView,
} from '../pixel/render'

export interface DroneFieldHandle {
  play(actions: DroneAction[]): Promise<void>
  reset(): void
}

const STEP_MS = 450
const DROP_MS = 380

/** Lienzo del nivel 1. La lógica vive en engine/drone; aquí solo se reproduce la traza. */
export const DroneField = forwardRef<DroneFieldHandle>(function DroneField(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewRef = useRef<SceneView>({
    x: 0,
    targetX: 0,
    watered: new Set<number>(),
    dropStart: null,
    time: 0,
  })
  const reducedRef = useRef(false)
  const aliveRef = useRef(true)
  const [label, setLabel] = useState(() => describeField({ x: 0, watered: new Set<number>() }))

  useEffect(() => {
    aliveRef.current = true
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedRef.current = media.matches
    const onChange = (event: MediaQueryListEvent) => {
      reducedRef.current = event.matches
    }
    media.addEventListener('change', onChange)

    let frame = 0
    const tick = (time: number) => {
      const view = viewRef.current
      view.time = time
      view.x = reducedRef.current ? view.targetX : view.x + (view.targetX - view.x) * 0.18
      const context = canvasRef.current?.getContext('2d')
      if (context) drawField(context, view, reducedRef.current)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      aliveRef.current = false
      cancelAnimationFrame(frame)
      media.removeEventListener('change', onChange)
    }
  }, [])

  const play = useCallback(async (actions: DroneAction[]) => {
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, reducedRef.current ? 0 : ms)
      })

    for (const action of actions) {
      if (!aliveRef.current) return
      const view = viewRef.current

      if (action.type === 'move') {
        view.targetX += 1
        await wait(STEP_MS)
        continue
      }

      view.dropStart = performance.now()
      await wait(DROP_MS)
      view.watered.add(view.targetX)
      view.dropStart = null
      setLabel(describeField({ x: view.targetX, watered: view.watered }))
      await wait(70)
    }
  }, [])

  const reset = useCallback(() => {
    const view = viewRef.current
    view.x = 0
    view.targetX = 0
    view.watered = new Set<number>()
    view.dropStart = null
    setLabel(describeField({ x: 0, watered: new Set<number>() }))
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  return (
    <div className="field">
      <canvas
        ref={canvasRef}
        className="field__canvas"
        width={LOGICAL_WIDTH}
        height={LOGICAL_HEIGHT}
        role="img"
        aria-label={label}
      />
      <p className="field__caption" aria-hidden="true">
        {label}
      </p>
    </div>
  )
})
