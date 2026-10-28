import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { PET_NAME, PET_START_ENERGY } from '../../engine/pet'
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
  rand,
  rect,
  ring,
  starfield,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface PetView {
  name: string
  energy: number
  recorded: boolean
}

const RESTING: PetView = { name: PET_NAME, energy: PET_START_ENERGY, recorded: false }
const MAX_ENERGY = PET_START_ENERGY

function drawWindow(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
): void {
  rect(context, 6, 62, 48, 3, '#4a5568')
  rect(context, 8, 65, 44, 2, '#2a3147')
  bevel(context, 8, 26, 44, 36, '#2a3147', '#4a5568', '#131a26', COLORS.ink)
  gradient(context, 11, 29, 38, 30, '#081428', '#1b2a4a', 6)
  starfield(context, 11, 29, 38, 30, COLORS.paper, 43, 16, time, reduced)
  glow(context, 30, 37, 10, COLORS.ice, reduced ? 0.16 : 0.12 + 0.04 * Math.sin(time / 600))
  disc(context, 30, 37, 5, '#e8f0f8')
  rect(context, 27, 34, 1, 1, '#cfdbe9')
  rect(context, 32, 39, 2, 1, '#cfdbe9')
  rect(context, 29, 29, 1, 30, '#2a3147')
  rect(context, 11, 43, 30, 1, '#2a3147')
  rect(context, 12, 30, 1, 12, alpha(COLORS.paper, 0.12))

  rect(context, 46, 26, 6, 30, '#6a3340')
  rect(context, 47, 26, 2, 30, '#8a4652')
  rect(context, 50, 26, 2, 30, '#4a2029')
  rect(context, 45, 41, 8, 3, '#c9a227')
  rect(context, 46, 40, 6, 1, '#e8c34a')

  rect(context, 5, 23, 50, 2, '#5c3a1c')
  rect(context, 5, 23, 50, 1, '#8a5a2b')
  rect(context, 3, 22, 3, 5, '#3a2412')
  rect(context, 54, 22, 3, 5, '#3a2412')
  disc(context, 4, 22, 1, '#c9a227')
  disc(context, 56, 22, 1, '#c9a227')
}

function drawSign(context: CanvasRenderingContext2D, name: string): void {
  bevel(context, 58, 26, 74, 20, '#5a3a2a', '#8a5a2b', '#3a2412', COLORS.ink)
  rect(context, 58, 26, 74, 2, '#b07a3f')
  label(context, name.toUpperCase(), 95, 41, 9, COLORS.cream, 'center')
  disc(context, 62, 30, 1, '#d9b878')
  disc(context, 128, 30, 1, '#d9b878')

  disc(context, 65, 37, 2, alpha(COLORS.cream, 0.35))
  rect(context, 63, 39, 1, 1, alpha(COLORS.cream, 0.35))
  rect(context, 65, 39, 1, 1, alpha(COLORS.cream, 0.35))
  rect(context, 67, 39, 1, 1, alpha(COLORS.cream, 0.35))
  line(context, 95, 22, 95, 26, alpha(COLORS.silver, 0.5))
  line(context, 71, 22, 95, 26, alpha(COLORS.silver, 0.25))
  line(context, 119, 22, 95, 26, alpha(COLORS.silver, 0.25))
}

function drawPet(
  context: CanvasRenderingContext2D,
  view: PetView,
  time: number,
  reduced: boolean,
): void {
  const bob = reduced ? 0 : Math.sin(time / 420) > 0.4 ? -1 : 0
  const wag = reduced ? 0 : Math.round(Math.sin(time / 170) * 2)

  disc(context, 46, 100, 18, alpha(COLORS.ink, 0.24))
  disc(context, 44, 108, 20, '#3a5a54')
  disc(context, 44, 108, 16, '#2f4a45')
  ring(context, 44, 108, 20, alpha(COLORS.teal, 0.35))

  rect(context, 62, 90 + wag, 8, 4, '#e7a44a')
  rect(context, 68, 88 + wag, 6, 4, '#e7a44a')
  rect(context, 72, 84 + wag, 4, 6, '#c98d4a')

  drawSprite(context, SPRITES.pet, 20, 54 + bob, { scale: 4, outline: COLORS.ink })
  rect(context, 28, 85 + bob, 32, 3, '#3a5a8a')
  rect(context, 28, 85 + bob, 32, 1, '#6a8ab8')
  disc(context, 44, 89 + bob, 3, '#ffc857')
  rect(context, 43, 88 + bob, 2, 2, '#ffe9a8')

  if (view.recorded && !reduced) {
    for (let index = 0; index < 3; index += 1) {
      const lift = (time / 420 + index * 0.33) % 1
      context.globalAlpha = 0.65 * (1 - lift)
      drawSprite(context, SPRITES.heart, 69 + index * 4, 82 - Math.round(lift * 10) - index * 4, {
        scale: 1,
        palette: { r: COLORS.coral },
      })
      context.globalAlpha = 1
    }
  }

  rect(context, 64, 116, 14, 2, '#e8d9b0')
  rect(context, 64, 116, 14, 1, '#fffbe8')
  disc(context, 63, 115, 2, '#e8d9b0')
  disc(context, 63, 118, 2, '#d9b878')
  disc(context, 79, 115, 2, '#e8d9b0')
  disc(context, 79, 118, 2, '#d9b878')
  rect(context, 82, 112, 16, 2, '#8a9098')
  rect(context, 83, 114, 14, 3, '#4a5568')
  rect(context, 84, 114, 12, 2, '#8a5a2b')
  rect(context, 85, 114, 10, 1, '#a8773f')
  disc(context, 106, 119, 5, COLORS.coral)
  rect(context, 104, 116, 2, 2, '#ff9e7a')
  rect(context, 106, 120, 4, 1, '#d9554a')
}

function drawFicha(
  context: CanvasRenderingContext2D,
  view: PetView,
  time: number,
  reduced: boolean,
): void {
  bevel(context, 136, 26, 82, 84, '#3a4a48', '#5a7470', '#1e2a28', COLORS.ink)
  rect(context, 140, 30, 74, 76, '#f4ecd8')
  rect(context, 140, 30, 74, 1, '#fffbe8')
  rect(context, 146, 46, 62, 1, alpha('#8a7a58', 0.4))

  rect(context, 170, 22, 14, 8, '#8a9098')
  rect(context, 173, 24, 8, 3, '#3a4a48')
  rect(context, 170, 22, 14, 1, '#b8c0c8')

  label(context, 'FICHA DEL REFUGIO', 146, 42, 4, '#5c3a2a')
  label(context, 'NOMBRE', 146, 52, 3, '#8a7a58')
  label(context, view.recorded ? view.name : '—', 146, 62, 6, view.recorded ? '#3a3226' : alpha('#3a3226', 0.4))
  label(context, 'ENERGÍA', 146, 72, 3, '#8a7a58')
  label(
    context,
    view.recorded ? `${view.energy} / ${MAX_ENERGY}` : '—',
    146,
    82,
    6,
    view.recorded ? '#3a3226' : alpha('#3a3226', 0.4),
  )
  label(context, 'ESTADO', 146, 92, 3, '#8a7a58')
  label(
    context,
    view.recorded ? 'APUNTADA' : 'PENDIENTE',
    146,
    101,
    4,
    view.recorded ? '#2f6b3a' : '#b04a3a',
  )

  if (view.recorded) {
    const stamp = reduced ? 0.8 : 0.62 + 0.2 * Math.sin(time / 460)
    context.globalAlpha = stamp
    disc(context, 199, 95, 3, COLORS.coral)
    disc(context, 193, 90, 1, COLORS.coral)
    disc(context, 197, 88, 1, COLORS.coral)
    disc(context, 201, 88, 1, COLORS.coral)
    disc(context, 205, 90, 1, COLORS.coral)
    ring(context, 199, 93, 9, alpha(COLORS.coral, 0.55))
    context.globalAlpha = 1
  } else {
    ring(context, 199, 93, 8, alpha('#b04a3a', 0.3))
    label(context, 'SIN SELLO', 199, 101, 3, alpha('#b04a3a', 0.7), 'center')
  }
}

/** Lienzo de la mascota: la ventana, Rex en su cama y la ficha del refugio. */
export function PetScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<PetView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      gradient(context, 0, 0, 224, 88, '#172b2a', '#2f4a44', 8)
      for (let x = 0; x < 224; x += 14) {
        rect(context, x, 0, 1, 88, alpha(COLORS.ink, 0.12))
      }
      dither(context, 0, 0, 224, 88, alpha(COLORS.ink, 0.1), 4)
      rect(context, 0, 76, 224, 12, '#213b37')
      for (let x = 4; x < 224; x += 24) {
        rect(context, x, 76, 1, 12, alpha(COLORS.ink, 0.4))
        rect(context, x + 1, 76, 1, 12, alpha('#5a7470', 0.18))
      }
      rect(context, 0, 75, 224, 1, '#42684f')

      panel(context, 4, 4, 216, 18, 'rgba(12,26,26,0.92)', '#2f5a54')
      rect(context, 4, 4, 216, 1, alpha(COLORS.teal, 0.4))
      label(context, 'EL REFUGIO', 12, 17, 7, '#ffd479')
      label(
        context,
        view.recorded ? 'FICHA APUNTADA' : 'SIN FICHA',
        212,
        17,
        4,
        view.recorded ? COLORS.lime : '#ffb648',
        'right',
      )

      drawWindow(context, time, reduced)
      drawSign(context, view.name)

      gradient(context, 0, 88, 224, 40, '#4a3a2c', '#241a16', 6)
      rect(context, 0, 88, 224, 1, '#6a5440')
      for (let index = 0; index < 10; index += 1) {
        const x = Math.round(rand(index + 11) * 210)
        rect(context, x, 92 + Math.round(rand(index + 37) * 32), 10 + Math.round(rand(index + 7) * 14), 1, alpha('#1a1220', 0.35))
      }

      label(context, 'ENERGÍA', 84, 57, 4, '#8fbcb4')
      for (let index = 0; index < MAX_ENERGY; index += 1) {
        const filled = index < view.energy
        drawSprite(context, SPRITES.heart, 84 + index * 16, 61, {
          scale: 2,
          outline: alpha(COLORS.ink, 0.5),
          palette: { r: filled ? COLORS.coral : '#33413e' },
        })
      }
      label(context, `${view.energy} / ${MAX_ENERGY}`, 84, 88, 7, view.energy > 1 ? COLORS.gold : COLORS.coral)
      label(context, view.energy > 1 ? 'CON GANAS' : 'CANSADA', 84, 96, 4, '#d7e4df')

      drawPet(context, view, time, reduced)
      drawFicha(context, view, time, reduced)

      if (!reduced) {
        for (let index = 0; index < 6; index += 1) {
          const y = 90 - ((time / 80 + index * 7) % 22)
          const x = 80 + Math.round(rand(index + 51) * 50)
          context.globalAlpha = 0.16 + 0.14 * rand(index + 3)
          rect(context, x, Math.round(y), 1, 1, COLORS.cream)
        }
        context.globalAlpha = 1
      }
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'pet') continue
      setView({ name: step.name, energy: step.energy, recorded: step.recorded })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = `La mascota ${view.name} tiene ${view.energy} de ${MAX_ENERGY} de energía.${
    view.recorded ? ' Su ficha está apuntada en el refugio.' : ' La ficha del refugio está sin apuntar.'
  }`

  return <PixelCanvas label={description} draw={draw} />
}
