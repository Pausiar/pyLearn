import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bevel,
  disc,
  dither,
  glow,
  gradient,
  label,
  line,
  panel,
  rect,
  ring,
} from '../../pixel/shapes'

type LockState = boolean | null

const RESTING: LockState[] = [null, null, null]
const LOCKS_X = [52, 112, 172]

const RULES: readonly (readonly string[])[] = [
  ['EDAD > 12'],
  ['ALTURA >= 130'],
  ['EDAD > 12', 'AND ALTURA >= 130'],
]

function drawWall(context: CanvasRenderingContext2D): void {
  gradient(context, 0, 0, 224, 110, '#0d1526', '#1c2740', 8)
  for (let x = 0; x < 224; x += 32) {
    rect(context, x, 0, 1, 110, alpha(COLORS.steel, 0.18))
    for (let y = 8; y < 104; y += 24) disc(context, x, y, 1, '#2c3a58')
  }
  rect(context, 0, 92, 224, 1, alpha(COLORS.steel, 0.2))

  // Tuberías laterales con válvulas.
  for (const x of [8, 210]) {
    rect(context, x, 0, 5, 108, '#232f48')
    rect(context, x, 0, 1, 108, '#3a4a6a')
    rect(context, x + 4, 0, 1, 108, '#101828')
    rect(context, x - 1, 34, 7, 4, '#3a4a6a')
    disc(context, x + 2, 36, 2, COLORS.coral)
  }

  // Baliza de alarma.
  glow(context, 204, 22, 12, COLORS.red, 0.1)
  rect(context, 201, 26, 7, 3, '#3a2a30')
  disc(context, 204, 22, 3, '#5a2630')
}

function drawDoor(
  context: CanvasRenderingContext2D,
  complete: boolean,
  time: number,
  reduced: boolean,
): void {
  const cx = 112
  const cy = 62

  if (complete) {
    glow(context, cx, cy, 54, COLORS.gold, 0.16)
    for (let index = 0; index < 10; index += 1) {
      const angle = (index / 10) * Math.PI * 2
      line(
        context,
        cx + Math.cos(angle) * 34,
        cy + Math.sin(angle) * 34,
        cx + Math.cos(angle) * 48,
        cy + Math.sin(angle) * 48,
        alpha(COLORS.gold, 0.5),
      )
    }
  }

  disc(context, cx, cy, 50, '#141d30')
  ring(context, cx, cy, 50, '#3a4a66')
  ring(context, cx, cy, 48, '#54668c')
  disc(context, cx, cy, 46, '#222e46')
  dither(context, cx - 44, cy - 44, 88, 88, alpha('#0a0f1c', 0.35), 3)
  ring(context, cx, cy, 32, alpha('#3a4a66', 0.55))

  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2
    disc(context, cx + Math.cos(angle) * 44, cy + Math.sin(angle) * 44, 1, COLORS.silver)
  }

  if (complete) {
    disc(context, cx, cy, 36, '#3a2a12')
    disc(context, cx, cy, 33, '#b07a2a')
    disc(context, cx, cy, 29, '#ffe8b8')
    rect(context, cx - 22, cy + 8, 44, 22, alpha('#fff3c4', 0.85))
    rect(context, cx - 12, cy - 14, 24, 30, alpha('#fff3c4', 0.9))
    glow(context, cx, cy, 20, COLORS.gold, 0.18)
  }

  const hubY = cy + 30
  disc(context, cx, hubY, 10, '#2c3a58')
  ring(context, cx, hubY, 10, '#54668c')
  const spin = complete ? (reduced ? 0.4 : time / 900) : reduced ? 0.4 : time / 1600
  for (let index = 0; index < 3; index += 1) {
    const angle = spin + (index / 3) * Math.PI * 2
    line(
      context,
      cx + Math.cos(angle) * 4,
      hubY + Math.sin(angle) * 4,
      cx + Math.cos(angle) * 9,
      hubY + Math.sin(angle) * 9,
      complete ? COLORS.cream : COLORS.silver,
    )
  }
  disc(context, cx, hubY, 2, complete ? COLORS.gold : COLORS.steel)
}

function drawPlate(
  context: CanvasRenderingContext2D,
  index: number,
  state: LockState,
): void {
  const x = 24 + index * 60
  const border = state === true ? COLORS.green : state === false ? COLORS.coral : '#3a4a66'

  bevel(context, x, 18, 56, 26, '#111a2a', '#2c3a58', '#0a0f1c', COLORS.ink)
  rect(context, x, 18, 56, 1, border)
  label(context, `CANDADO ${index + 1}`, x + 28, 26, 4, state === true ? COLORS.lime : state === false ? COLORS.coral : '#7f8db8', 'center')
  rect(context, x + 8, 29, 40, 1, alpha(COLORS.steel, 0.3))

  const lines = RULES[index] ?? []
  lines.forEach((text, row) => {
    label(
      context,
      text,
      x + 28,
      lines.length === 1 ? 39 : 35 + row * 7,
      lines.length === 1 ? 5 : 4,
      state === true ? COLORS.cream : state === false ? '#ffc4c9' : COLORS.ice,
      'center',
    )
  })
}

function drawLock(
  context: CanvasRenderingContext2D,
  cx: number,
  state: LockState,
  time: number,
  reduced: boolean,
): void {
  const top = 62
  const shake = state === false && !reduced ? Math.round(Math.sin(time / 45)) : 0
  const x = cx - 10 + shake
  const body = state === true ? '#8a7238' : state === false ? '#6a4650' : '#5a6480'
  const light = state === true ? '#c9a84e' : state === false ? '#9a6a72' : '#8a94a8'
  const dark = state === true ? '#5a4620' : state === false ? '#402a30' : '#2a3350'
  const shackle = state === true ? COLORS.gold : state === false ? COLORS.red : '#3a4560'

  // Arco: cerrado o levantado.
  if (state === true) {
    rect(context, x + 4, top - 17, 13, 3, shackle)
    rect(context, x + 15, top - 14, 3, 14, shackle)
    rect(context, x + 4, top - 14, 3, 4, shackle)
    rect(context, x + 4, top - 18, 8, 1, COLORS.cream)
  } else {
    rect(context, x - 1, top - 12, 22, 3, shackle)
    rect(context, x - 3, top - 9, 3, 9, shackle)
    rect(context, x + 20, top - 9, 3, 9, shackle)
    rect(context, x - 2, top - 8, 2, 8, dark)
    rect(context, x + 20, top - 8, 2, 8, dark)
  }

  bevel(context, x - 1, top - 1, 22, 21, body, light, dark, COLORS.ink)
  rect(context, x + 1, top + 1, 3, 17, alpha('#ffffff', 0.18))
  rect(context, x + 18, top + 1, 2, 17, alpha('#000000', 0.25))
  disc(context, cx + shake, top + 8, 2, '#0a0f1c')
  rect(context, cx - 1 + shake, top + 9, 3, 5, '#0a0f1c')

  const lamp = state === true ? COLORS.lime : state === false ? COLORS.coral : '#2c3a58'
  disc(context, cx + shake, top + 16, 1, lamp)
  if (state !== null) glow(context, cx + shake, top + 16, 6, lamp, 0.18)
}

function drawProtocol(
  context: CanvasRenderingContext2D,
  open: LockState[],
): void {
  const complete = open.every((state) => state === true)
  const closed = open
    .map((state, index) => (state === true ? 0 : index + 1))
    .filter((number) => number > 0)
  const untouched = open.every((state) => state === null)

  panel(context, 6, 110, 212, 15, 'rgba(8,12,24,0.94)', complete ? COLORS.green : '#3a4a66')
  const status = complete
    ? '¡LOS TRES CANDADOS HAN CEDIDO! La puerta se abre.'
    : untouched
      ? 'Prueba los candados con candado(numero, condición).'
      : `Sigue cerrado el candado ${closed.join(' y ')}.`
  label(
    context,
    status,
    12,
    120,
    6,
    complete ? COLORS.lime : untouched ? COLORS.ice : COLORS.coral,
  )
  disc(context, 207, 117, 3, complete ? COLORS.lime : '#40547a')
  if (complete) glow(context, 207, 117, 7, COLORS.lime, 0.2)
}

/** Lienzo de la cerradura: tres candados lógicos sobre la puerta blindada del cohete. */
export function LocksScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [open, setOpen] = useState<LockState[]>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      const complete = open.every((state) => state === true)
      const failed = open.some((state) => state === false)

      drawWall(context)
      const blink = failed && !reduced ? 0.4 + 0.6 * Math.abs(Math.sin(time / 220)) : 0.35
      context.globalAlpha = blink
      disc(context, 204, 22, 3, COLORS.red)
      context.globalAlpha = 1
      if (failed) glow(context, 204, 22, 10, COLORS.red, 0.18)

      drawDoor(context, complete, time, reduced)
      rect(context, 20, 46, 184, 5, '#2c3a58')
      rect(context, 20, 46, 184, 1, '#54668c')
      rect(context, 20, 50, 184, 1, '#101828')
      for (const cx of LOCKS_X) {
        rect(context, cx - 3, 50, 6, 4, '#4a5a80')
      }

      open.forEach((state, index) => {
        drawPlate(context, index, state)
        drawLock(context, LOCKS_X[index] ?? 0, state, time, reduced)
      })

      drawProtocol(context, open)
    },
    [open],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'locks') continue
      setOpen(step.open)
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 520)
      })
    }
  }, [])

  const reset = useCallback(() => setOpen(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const abiertos = open.filter((state) => state === true).length
  const description =
    abiertos === 3
      ? 'Los tres candados están abiertos y la puerta blindada se ha abierto.'
      : `Candados abiertos: ${abiertos} de 3. La puerta blindada sigue cerrada.`

  return <PixelCanvas label={description} draw={draw} />
}
