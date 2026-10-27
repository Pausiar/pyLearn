import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { MINE_ROCKS } from '../../engine/mine'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface MineView {
  rocks: number
  picadas: number
}

const RESTING: MineView = { rocks: MINE_ROCKS, picadas: 0 }
const ROCKS = Array.from({ length: MINE_ROCKS }, (_, index) => ({
  x: 60 + (index % 3) * 36,
  y: 60 + Math.floor(index / 3) * 26,
}))
const UP = -1.2
const DOWN = 0.9

function drawRock(context: CanvasRenderingContext2D, x: number, y: number): void {
  rect(context, x - 10, y - 8, 22, 18, '#0c0c12')
  rect(context, x - 12, y - 10, 22, 18, '#5b5b6b')
  rect(context, x - 12, y - 10, 22, 3, '#7a7a8c')
  rect(context, x - 4, y - 4, 4, 2, '#3f3f4b')
}

function drawDebris(context: CanvasRenderingContext2D, x: number, y: number): void {
  rect(context, x - 2, y + 14, 4, 2, '#6a6a78')
  rect(context, x + 4, y + 16, 3, 2, '#55555f')
}

/** Pico con mango de madera y cabeza de hierro curvada. El mango se alarga en el impacto. */
function drawPickaxe(context: CanvasRenderingContext2D, shoulderX: number, shoulderY: number, angle: number, reach: number): void {
  const hx = shoulderX + Math.cos(angle) * reach
  const hy = shoulderY + Math.sin(angle) * reach

  context.strokeStyle = '#8a5a2b'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(shoulderX, shoulderY)
  context.lineTo(hx, hy)
  context.stroke()
  context.strokeStyle = '#5c3a1c'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(shoulderX - 1, shoulderY - 1)
  context.lineTo(hx - 1, hy - 1)
  context.stroke()

  const nx = -Math.sin(angle)
  const ny = Math.cos(angle)
  const tipX = hx + Math.cos(angle) * 4
  const tipY = hy + Math.sin(angle) * 4
  context.strokeStyle = '#8a8f9c'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(hx + nx * 6, hy + ny * 6)
  context.quadraticCurveTo(tipX + Math.cos(angle) * 4, tipY + Math.sin(angle) * 4, hx - nx * 6, hy - ny * 6)
  context.stroke()
  context.strokeStyle = '#c9cfdd'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(hx + nx * 4, hy + ny * 4)
  context.quadraticCurveTo(tipX + Math.cos(angle) * 3, tipY + Math.sin(angle) * 3, hx - nx * 4, hy - ny * 4)
  context.stroke()
}

function drawMine(context: CanvasRenderingContext2D, view: MineView, elapsed: number, reduced: boolean): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  // Galería: pared de roca, vigas y suelo en planos.
  rect(context, 0, 0, WIDTH, HEIGHT, '#1a1a22')
  rect(context, 0, 0, WIDTH, 14, '#24242e')
  rect(context, 0, 110, WIDTH, 18, '#2c2420')
  rect(context, 0, 110, WIDTH, 2, '#3a302a')
  rect(context, 8, 14, 6, 96, '#5a3e2b')
  rect(context, 210, 14, 6, 96, '#5a3e2b')
  rect(context, 8, 14, 208, 4, '#6b4a32')

  ROCKS.forEach((rock, index) => {
    if (index < view.picadas) drawDebris(context, rock.x, rock.y)
    else drawRock(context, rock.x, rock.y)
  })

  // Minero: el pico sube por detrás, cae sobre la piedra y el mango se alarga al impactar.
  const shoulderX = 30
  const shoulderY = 66
  rect(context, shoulderX - 4, shoulderY, 10, 26, '#3b6b8f')
  rect(context, shoulderX - 3, shoulderY - 6, 8, 8, '#e8c39e')
  rect(context, shoulderX - 4, shoulderY - 9, 10, 3, '#ffe08a')

  const cycle = reduced ? 0.5 : (elapsed % 900) / 900
  const angle = cycle < 0.6
    ? DOWN + (UP - DOWN) * (cycle / 0.6)
    : cycle < 0.8
      ? UP + (DOWN - UP) * ((cycle - 0.6) / 0.2)
      : DOWN
  const reach = 14 + (cycle >= 0.6 && cycle < 0.8 ? 8 * Math.sin(((cycle - 0.6) / 0.2) * Math.PI) : 0)
  drawPickaxe(context, shoulderX + 6, shoulderY + 2, angle, reach)

  // Astillas en el impacto contra la siguiente piedra.
  const next = ROCKS[view.picadas]
  if (next && view.rocks > 0 && cycle > 0.74 && cycle < 0.86 && !reduced) {
    for (let k = 0; k < 4; k += 1) {
      const p = ((cycle - 0.74) / 0.12 + k * 0.25) % 1
      rect(context, next.x - 14 + p * 18, next.y - 4 - p * 10, 2, 2, '#ffe08a')
    }
  }

  rect(context, 4, 4, 96, 18, 'rgba(10,18,38,0.85)')
  label(context, `picadas = ${view.picadas}`, 10, 16, 9, '#e8f1ff')

  if (view.rocks === 0) {
    rect(context, 122, 16, 96, 16, '#ffffff')
    label(context, 'He picado 6 piedras', 126, 27, 7, '#1d1d1f')
  }
}

/** Lienzo de la mina: el minero pica la veta piedra a piedra. */
export function MineScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const bornRef = useRef(0)
  const [view, setView] = useState<MineView>(RESTING)

  useEffect(() => {
    aliveRef.current = true
    bornRef.current = performance.now()
    const context = canvasRef.current?.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    if (context) {
      const tick = (now: number) => {
        drawMine(context, view, now - bornRef.current, reduced)
        if (!reduced) frame = window.requestAnimationFrame(tick)
      }
      tick(performance.now())
    }

    return () => {
      aliveRef.current = false
      window.cancelAnimationFrame(frame)
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'mine') continue
      if (!aliveRef.current) return
      setView({ rocks: step.rocks, picadas: step.picadas })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 480)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView(RESTING)
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.rocks === 0
      ? `La veta está agotada: ${view.picadas} piedras picadas.`
      : `${view.picadas} piedras picadas y ${view.rocks} en la veta.`

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
