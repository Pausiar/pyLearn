import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { describeField } from '../../engine/drone'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH, drawField, type SceneView } from '../../pixel/render'

const STEP_MS = 420
const DROP_MS = 360

/** Lienzo del dron. La lógica vive en engine/drone; aquí solo se reproduce la traza. */
export function DroneScene({ ref }: { ref?: Ref<SceneHandle> }) {
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

  const play = useCallback(async (steps: SceneStep[]) => {
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, reducedRef.current ? 0 : ms)
      })

    for (const step of steps) {
      if (step.kind !== 'drone') continue
      if (!aliveRef.current) return

      const view = viewRef.current

      if (step.x !== view.targetX) {
        view.targetX = step.x
        await wait(STEP_MS)
      }

      if (step.watered.length > view.watered.size) {
        view.dropStart = performance.now()
        await wait(DROP_MS)
        view.watered = new Set(step.watered)
        view.dropStart = null
      }

      setLabel(describeField({ x: view.targetX, watered: view.watered }))
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
}
