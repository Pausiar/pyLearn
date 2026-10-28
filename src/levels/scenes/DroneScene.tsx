import { useCallback, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { describeField } from '../../engine/drone'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { drawField, type SceneView } from '../../pixel/render'

const STEP_MS = 420
const DROP_MS = 360

/** Lienzo del dron. La lógica vive en engine/drone; aquí solo se reproduce la traza. */
export function DroneScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const viewRef = useRef<SceneView>({
    x: 0,
    targetX: 0,
    watered: new Set<number>(),
    dropStart: null,
    time: 0,
  })
  const [label, setLabel] = useState(() => describeField({ x: 0, watered: new Set<number>() }))

  const draw = useCallback((context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
    const view = viewRef.current
    view.time = time
    view.x = reduced ? view.targetX : view.x + (view.targetX - view.x) * 0.2
    drawField(context, view, reduced)
  }, [])

  const play = useCallback(async (steps: SceneStep[]) => {
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.setTimeout(resolve, reduced ? 0 : ms)
      })

    for (const step of steps) {
      if (step.kind !== 'drone') continue
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

  return <PixelCanvas label={label} draw={draw} smooth={false} />
}
