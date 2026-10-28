import { useCallback, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { VAULT_SECRET, VAULT_TRIES } from '../../engine/vault'
import { COLORS } from '../../pixel/palette'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import {
  alpha,
  bevel,
  disc,
  dither,
  glow,
  gradient,
  groundTexture,
  label,
  line,
  panel,
  rect,
  ring,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

const WIDTH = 224

const VAULT_X = 152
const VAULT_Y = 48
const DOOR_R = 28
const HINGE_X = VAULT_X - DOOR_R

const LAMP_X = 115
const LAMP_Y = 82
const LAMP_STEP = 13

interface VaultView {
  tried: number[]
  opened: boolean
}

const RESTING: VaultView = { tried: [], opened: false }

function drawWall(context: CanvasRenderingContext2D): void {
  gradient(context, 0, 0, WIDTH, 98, '#1b2234', '#262f45', 7)
  dither(context, 0, 0, WIDTH, 98, alpha(COLORS.ink, 0.16), 3)

  // Juntas de chapa remachadas.
  for (const x of [24, 62]) {
    rect(context, x, 10, 1, 86, '#161c2b')
    rect(context, x + 1, 10, 1, 86, alpha('#5a647e', 0.12))
  }
  rect(context, 0, 42, 88, 1, '#161c2b')
  rect(context, 0, 43, 88, 1, alpha('#5a647e', 0.1))
  for (let index = 0; index < 5; index += 1) {
    rect(context, 8 + index * 18, 39, 1, 1, '#3c445c')
    rect(context, 8 + index * 18, 45, 1, 1, '#3c445c')
  }

  // Tuberías del techo.
  rect(context, 0, 0, WIDTH, 8, '#141a28')
  rect(context, 0, 2, WIDTH, 3, '#39445c')
  rect(context, 0, 2, WIDTH, 1, '#5a6684')
  rect(context, 0, 7, WIDTH, 1, '#0c101a')
  for (let index = 0; index < 5; index += 1) {
    const x = 6 + index * 52
    rect(context, x, 1, 4, 7, '#2a3346')
    rect(context, x, 2, 1, 5, '#4a5570')
  }

  // Cartel de la sala.
  panel(context, 6, 16, 46, 14, 'rgba(13,17,27,0.9)', '#3c465e')
  label(context, 'CAJA FUERTE', 13, 25, 5, '#8f9ab2')
  rect(context, 13, 29, 32, 1, '#3c465e')

  rect(context, 0, 96, WIDTH, 2, '#121722')
}

function drawFloor(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
): void {
  groundTexture(context, 0, 98, WIDTH, 30, '#232a3a', '#3d4659', '#141924', 371)
  rect(context, 14, 98, 30, 2, alpha('#7ccf75', 0.07))

  // Franja de peligro frente a la caja.
  rect(context, 96, 98, 112, 3, '#1a1f2c')
  for (let index = 0; index < 13; index += 1) {
    rect(context, 97 + index * 9, 98, 4, 3, '#b8862f')
  }

  // Cable del terminal a la caja, con un pulso que lo recorre.
  line(context, 52, 102, 148, 102, '#0c0f17')
  line(context, 52, 103, 148, 103, '#2c3448')
  for (let dot = 0; dot < 16; dot += 1) {
    rect(context, 56 + dot * 6, 103, 2, 1, '#3a455c')
  }
  const pulse = reduced ? 0.45 : (time % 2200) / 2200
  const pulseX = 52 + pulse * 94
  rect(context, pulseX, 101, 2, 1, '#5ad1ff')
  rect(context, pulseX + 2, 102, 1, 1, alpha('#5ad1ff', 0.4))
}

function drawWorkstation(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
): void {
  // Resplandor del monitor sobre la pared.
  glow(context, 28, 58, 26, '#7ccf75', 0.07)

  // Mesa.
  rect(context, 4, 78, 52, 4, '#3a4358')
  rect(context, 4, 78, 52, 1, '#5d6880')
  rect(context, 4, 81, 52, 1, '#202636')
  rect(context, 8, 82, 4, 18, '#2c3346')
  rect(context, 48, 82, 4, 18, '#2c3346')
  rect(context, 8, 92, 44, 2, '#2c3346')
  rect(context, 8, 82, 1, 18, '#3e4760')

  // Monitor de tubo con el bucle en pantalla.
  rect(context, 7, 44, 42, 32, '#161b28')
  rect(context, 8, 45, 40, 30, '#4a5368')
  rect(context, 8, 45, 40, 1, '#6b7690')
  rect(context, 8, 74, 40, 1, '#2a3142')
  rect(context, 9, 46, 38, 24, '#0e2a1f')
  rect(context, 9, 46, 38, 1, '#07140f')
  label(context, 'for n in', 12, 55, 5, '#7ccf75')
  label(context, 'range(1, 7)', 12, 62, 5, '#7ccf75')
  label(context, 'probar(n)', 12, 69, 5, '#ffe08a')
  if (!reduced && Math.floor(time / 480) % 2 === 0) {
    rect(context, 40, 65, 2, 4, '#ffe08a')
  }
  const scan = 47 + Math.round((time / 90) % 22)
  rect(context, 10, scan, 36, 1, alpha('#7ccf75', 0.08))
  drawScreenGlare(context)
  rect(context, 12, 71, 10, 1, '#202636')
  rect(context, 12, 73, 14, 1, '#202636')
  rect(context, 44, 72, 2, 2, '#7ccf75')
  rect(context, 23, 74, 8, 4, '#3a4358')
  rect(context, 21, 77, 12, 1, '#202636')

  // Teclado y taza.
  rect(context, 10, 75, 24, 3, '#2a3142')
  rect(context, 10, 75, 24, 1, '#4a5368')
  for (let key = 0; key < 8; key += 1) {
    rect(context, 12 + key * 3, 77, 1, 1, '#6b7690')
  }
  rect(context, 50, 73, 4, 5, COLORS.coral)
  rect(context, 50, 73, 4, 1, '#ffa48f')
  rect(context, 54, 74, 1, 2, COLORS.coral)

  // Técnico frente a la caja, con contorno para separarlo del muro.
  rect(context, 57, 97, 27, 2, alpha(COLORS.ink, 0.4))
  drawSprite(context, SPRITES.worker, 58, 66, {
    scale: 2,
    flip: true,
    outline: COLORS.ink,
  })
}

function drawScreenGlare(context: CanvasRenderingContext2D): void {
  line(context, 42, 48, 30, 68, alpha('#ffffff', 0.05))
  rect(context, 10, 47, 4, 1, alpha('#ffffff', 0.12))
}

function drawInterior(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  disc(context, VAULT_X, VAULT_Y, 27, '#2a180d')
  disc(context, VAULT_X, VAULT_Y, 24, '#382112')
  disc(context, VAULT_X, VAULT_Y, 19, '#432917')
  glow(context, VAULT_X, VAULT_Y - 2, 21, COLORS.gold, 0.09)

  // Estante alto con lingotes.
  rect(context, VAULT_X - 18, 32, 36, 2, '#5a4128')
  rect(context, VAULT_X - 18, 32, 36, 1, '#7c5a34')
  for (let bar = 0; bar < 4; bar += 1) {
    const x = VAULT_X - 16 + bar * 9
    rect(context, x, 29, 7, 3, COLORS.gold)
    rect(context, x, 29, 7, 1, COLORS.yellow)
    rect(context, x + 5, 30, 2, 2, '#c9972f')
  }
  rect(context, VAULT_X - 7, 26, 7, 3, COLORS.gold)
  rect(context, VAULT_X - 7, 26, 7, 1, COLORS.yellow)
  rect(context, VAULT_X - 2, 27, 2, 2, '#c9972f')

  // Estante medio con monedas.
  rect(context, VAULT_X - 18, 48, 36, 2, '#5a4128')
  rect(context, VAULT_X - 18, 48, 36, 1, '#7c5a34')
  for (const [x, y, r] of [
    [VAULT_X - 13, 46, 2],
    [VAULT_X - 9, 45, 2],
    [VAULT_X - 11, 42, 2],
    [VAULT_X + 12, 46, 2],
    [VAULT_X + 15, 45, 1],
  ] as const) {
    disc(context, x, y, r + 1, '#8a5a1c')
    disc(context, x, y, r, COLORS.gold)
    rect(context, x - 1, y - r, 2, 1, COLORS.yellow)
  }

  // Cofre sobre el suelo de la cámara.
  drawSprite(context, SPRITES.chest, VAULT_X - 7, 58, {
    scale: 1,
    outline: '#1a0f08',
  })
  rect(context, VAULT_X + 9, 69, 2, 1, COLORS.gold)
  rect(context, VAULT_X - 12, 68, 2, 1, '#ffe08a')

  // Destellos dentro del oro.
  const sparkles = [
    [VAULT_X - 16, VAULT_Y - 18],
    [VAULT_X + 14, VAULT_Y - 14],
    [VAULT_X - 4, VAULT_Y + 2],
    [VAULT_X + 18, VAULT_Y - 2],
    [VAULT_X - 18, VAULT_Y + 10],
    [VAULT_X + 4, VAULT_Y + 16],
  ] as const
  sparkles.forEach(([x, y], index) => {
    const twinkle = reduced ? 1 : Math.sin(time / 320 + index * 1.7)
    if (twinkle < 0.2) return
    rect(context, x, y, 1, 1, COLORS.yellow)
    if (twinkle > 0.85) {
      rect(context, x - 1, y, 3, 1, alpha(COLORS.yellow, 0.6))
      rect(context, x, y - 1, 1, 3, alpha(COLORS.yellow, 0.6))
    }
  })
}

function drawDoor(context: CanvasRenderingContext2D, squeeze: number, tried: number[]): void {
  const last = tried.at(-1)
  for (let offset = -DOOR_R; offset <= DOOR_R; offset += 1) {
    const half = Math.sqrt(DOOR_R * DOOR_R - offset * offset)
    const top = VAULT_Y + offset
    const left = HINGE_X + (DOOR_R - half) * squeeze
    const right = HINGE_X + (DOOR_R + half) * squeeze
    const projected = right - left

    if (projected < 7) {
      // Canto de la puerta vista de lado: un slab con su brillo y su sombra.
      if (Math.abs(offset) > DOOR_R - 4) continue
      rect(context, HINGE_X - 1, top, 7, 1, '#2f3648')
      rect(context, HINGE_X, top, 5, 1, '#4c5670')
      rect(context, HINGE_X, top, 1, 1, '#93a0b6')
      continue
    }

    rect(context, left, top, projected, 1, '#6e7890')
    if (projected >= 12) {
      const band = (radius: number, colour: string) => {
        if (Math.abs(offset) > radius) return
        const inner = Math.sqrt(radius * radius - offset * offset)
        rect(
          context,
          HINGE_X + (DOOR_R - inner) * squeeze,
          top,
          inner * 2 * squeeze,
          1,
          colour,
        )
      }
      band(24, '#4c5670')
      band(20, '#3d475f')
      band(14, '#333c52')
      band(7, '#4a5470')
    }
    rect(context, left, top, 1, 1, '#93a0b6')
    rect(context, right - 1, top, 1, 1, '#2a3042')
  }

  if (squeeze < 0.55) {
    for (const y of [32, 44, 56, 68]) {
      rect(context, HINGE_X + 2, y, 2, 1, '#98a1b4')
    }
    // Bisagras y tirador de la puerta abierta de canto.
    rect(context, HINGE_X - 2, 25, 2, 3, '#5a647e')
    rect(context, HINGE_X - 2, 68, 2, 3, '#5a647e')
    rect(context, HINGE_X + 6, 43, 3, 7, '#202636')
    rect(context, HINGE_X + 7, 44, 3, 6, '#8b94a8')
    rect(context, HINGE_X + 7, 44, 1, 6, '#b9c2d4')
  } else {
    // Marcas de las seis contraseñas en el dial.
    for (let number = 1; number <= VAULT_TRIES; number += 1) {
      const angle = -Math.PI / 2 + (number / VAULT_TRIES) * Math.PI * 2
      const x1 = VAULT_X + Math.cos(angle) * 21
      const y1 = VAULT_Y + Math.sin(angle) * 21
      const x2 = VAULT_X + Math.cos(angle) * 23.5
      const y2 = VAULT_Y + Math.sin(angle) * 23.5
      const colour = !tried.includes(number)
        ? '#7c8599'
        : number === VAULT_SECRET && last === VAULT_SECRET
          ? COLORS.green
          : COLORS.gold
      line(
        context,
        HINGE_X + (x1 - HINGE_X) * squeeze,
        y1,
        HINGE_X + (x2 - HINGE_X) * squeeze,
        y2,
        colour,
      )
    }

    // Bulones del borde.
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2 + Math.PI / 8
      const bx = VAULT_X + Math.cos(angle) * 26
      const by = VAULT_Y + Math.sin(angle) * 26
      const px = HINGE_X + (bx - HINGE_X) * squeeze
      rect(context, px - 1, by - 1, 2, 2, '#98a1b4')
      rect(context, px - 1, by - 1, 1, 1, '#c6cddb')
    }
  }

  if (squeeze > 0.7) {
    context.globalAlpha = Math.min(1, (squeeze - 0.7) / 0.08)
    const cx = HINGE_X + (VAULT_X - HINGE_X) * squeeze
    disc(context, cx, VAULT_Y, 11, '#2c3448')
    ring(context, cx, VAULT_Y, 11, '#aab3c6')
    ring(context, cx, VAULT_Y, 10, '#4c5670')
    for (let spoke = 0; spoke < 4; spoke += 1) {
      const angle = Math.PI / 4 + (spoke / 4) * Math.PI * 2
      line(
        context,
        cx,
        VAULT_Y,
        cx + Math.cos(angle) * 9,
        VAULT_Y + Math.sin(angle) * 9,
        '#aab3c6',
      )
    }
    disc(context, cx, VAULT_Y, 4, COLORS.gold)
    ring(context, cx, VAULT_Y, 4, '#c9972f')
    rect(context, cx - 1, VAULT_Y - 2, 2, 1, COLORS.yellow)
    if (last !== undefined) {
      const angle = -Math.PI / 2 + (last / VAULT_TRIES) * Math.PI * 2
      line(
        context,
        cx,
        VAULT_Y,
        cx + Math.cos(angle) * 16,
        VAULT_Y + Math.sin(angle) * 16,
        '#ffe08a',
      )
    }
    context.globalAlpha = 1
  }
}

function drawLamps(
  context: CanvasRenderingContext2D,
  view: VaultView,
  reduced: boolean,
  since: number,
): void {
  rect(context, 113, 80, 78, 13, '#1c2332')
  rect(context, 113, 80, 78, 1, '#2f3a4e')
  rect(context, 113, 92, 78, 1, '#10141f')

  for (let number = 1; number <= VAULT_TRIES; number += 1) {
    const x = LAMP_X + (number - 1) * LAMP_STEP
    const tried = view.tried.includes(number)
    const secret = tried && number === VAULT_SECRET && view.opened
    if (secret) glow(context, x + 4, LAMP_Y + 4, 8, COLORS.green, 0.16)
    if (!reduced && since < 1400 && view.tried.at(-1) === number && !secret) {
      const pulse = 0.5 + 0.5 * Math.sin(since / 110)
      glow(context, x + 4, LAMP_Y + 4, 7, COLORS.red, 0.08 + pulse * 0.1)
    }
    const fill = secret ? '#4caf50' : tried ? '#b8434f' : '#232a3a'
    rect(context, x, LAMP_Y, 9, 9, '#10151f')
    rect(context, x + 1, LAMP_Y + 1, 7, 7, fill)
    rect(context, x + 1, LAMP_Y + 1, 7, 1, alpha('#ffffff', 0.16))
    label(
      context,
      String(number),
      x + 4.5,
      LAMP_Y + 7,
      5,
      secret ? '#0d1a10' : tried ? '#ffffff' : '#8491a8',
      'center',
    )
  }
}

function drawVault(
  context: CanvasRenderingContext2D,
  view: VaultView,
  time: number,
  reduced: boolean,
  openedAt: number,
  changedAt: number,
): void {
  const last = view.tried.at(-1)
  const failing = last !== undefined && last !== VAULT_SECRET && !view.opened
  const since = Math.max(0, time - changedAt)
  const shake = failing && !reduced && since < 320 ? Math.sin(since / 26) * 1.4 : 0
  const swing = view.opened
    ? reduced
      ? 1
      : Math.min(Math.max((time - openedAt) / 700, 0), 1)
    : 0
  const eased = 1 - Math.pow(1 - swing, 3)
  const squeeze = 1 - eased * 0.88

  context.save()
  context.translate(Math.round(shake), 0)

  rect(context, 88, 96, 128, 2, '#0b0e17')
  bevel(context, 90, 8, 124, 86, '#39425a', '#5a647e', '#222a3c', '#0a0c14')
  for (const [x, y] of [
    [95, 13],
    [209, 13],
    [95, 91],
    [209, 91],
    [95, 51],
    [209, 51],
  ] as const) {
    rect(context, x, y, 2, 2, '#6b7690')
    rect(context, x, y, 1, 1, '#8b94a8')
  }

  // Estado de la puerta sobre el marco.
  const flash = failing && !reduced && since < 480 ? 0.55 + 0.45 * Math.sin(since / 60) : 1
  panel(context, VAULT_X - 28, 9, 56, 8, 'rgba(9,12,20,0.92)', '#39445c')
  const lamp = view.opened
    ? '#7ccf75'
    : failing
      ? alpha('#ff7f6b', flash)
      : '#5a2d36'
  rect(context, VAULT_X - 25, 11, 4, 4, lamp)
  if (view.opened) glow(context, VAULT_X - 23, 13, 7, '#7ccf75', 0.2)
  label(
    context,
    view.opened ? 'ABIERTA' : failing ? 'RECHAZADA' : 'CERRADA',
    VAULT_X - 18,
    15,
    5,
    view.opened ? '#b8e986' : failing ? '#ff9a8a' : '#7f8ba3',
  )

  // Hueco de la cámara y su contenido.
  disc(context, VAULT_X, VAULT_Y, 30, '#11161f')
  ring(context, VAULT_X, VAULT_Y, 30, '#5a647e')
  ring(context, VAULT_X, VAULT_Y, 29, '#0a0c14')
  drawInterior(context, time, reduced)

  drawDoor(context, squeeze, view.tried)

  // Luz que se derrama al abrirse.
  if (view.opened) {
    rect(context, VAULT_X - 26, 98, 52, 2, alpha(COLORS.gold, 0.16 * eased))
    rect(context, VAULT_X - 32, 100, 64, 2, alpha(COLORS.gold, 0.1 * eased))
    rect(context, VAULT_X - 38, 102, 76, 2, alpha(COLORS.gold, 0.06 * eased))
    glow(context, VAULT_X + 6, VAULT_Y, 22, COLORS.gold, 0.1 * eased)
  }

  drawLamps(context, view, reduced, since)

  context.restore()
}

function drawPanel(context: CanvasRenderingContext2D, view: VaultView): void {
  const complete = view.opened && view.tried.length <= VAULT_SECRET
  const last = view.tried.at(-1)
  panel(
    context,
    6,
    106,
    212,
    17,
    'rgba(12,15,24,0.95)',
    complete ? COLORS.green : '#39445c',
  )

  if (view.tried.length === 0) {
    label(context, 'La caja fuerte está cerrada.', 12, 114, 6, COLORS.cream)
    label(context, 'Prueba del 1 al 6 con probar().', 12, 121, 5, '#9aa7c4')
  } else if (view.opened) {
    label(
      context,
      `numero = ${last} · probar() → True`,
      12,
      114,
      6,
      COLORS.paper,
    )
    label(
      context,
      `Abierta con la contraseña ${VAULT_SECRET}`,
      12,
      121,
      5,
      complete ? COLORS.lime : COLORS.coral,
    )
  } else {
    label(
      context,
      `numero = ${last} · probar() → False`,
      12,
      114,
      6,
      COLORS.paper,
    )
    label(context, 'La caja no cede: sigue probando.', 12, 121, 5, '#9aa7c4')
  }

  label(
    context,
    `INTENTOS ${view.tried.length}/${VAULT_TRIES}`,
    212,
    121,
    5,
    view.tried.length === 0 ? '#6f7a90' : '#9aa7c4',
    'right',
  )
}

/** Lienzo de la caja fuerte: un técnico prueba contraseñas mientras el dial gira. */
export function VaultScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<VaultView>(RESTING)
  const viewRef = useRef<VaultView>(RESTING)
  const openedAtRef = useRef(0)
  const changedAtRef = useRef(0)

  const apply = useCallback((next: VaultView) => {
    const now = performance.now()
    if (next.opened && !viewRef.current.opened) openedAtRef.current = now
    viewRef.current = next
    changedAtRef.current = now
    setView(next)
  }, [])

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawWall(context)
      drawFloor(context, time, reduced)
      drawWorkstation(context, time, reduced)
      drawVault(
        context,
        view,
        time,
        reduced,
        openedAtRef.current,
        changedAtRef.current,
      )
      drawPanel(context, view)
    },
    [view],
  )

  const play = useCallback(
    async (steps: SceneStep[]) => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      for (const step of steps) {
        if (step.kind !== 'vault') continue
        apply({ tried: step.tried, opened: step.opened })
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, reduced ? 0 : 500)
        })
      }
    },
    [apply],
  )

  const reset = useCallback(() => {
    viewRef.current = RESTING
    openedAtRef.current = 0
    changedAtRef.current = 0
    setView(RESTING)
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.tried.length === 0
      ? 'La caja fuerte está cerrada en la sala de seguridad; seis contraseñas esperan prueba.'
      : view.opened
        ? `La caja fuerte está abierta con la contraseña ${VAULT_SECRET}, tras ${view.tried.length} intentos.`
        : `La caja fuerte sigue cerrada. Contraseñas probadas: ${view.tried.join(', ')}.`

  return <PixelCanvas label={description} draw={draw} />
}
