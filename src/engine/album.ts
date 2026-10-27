import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** Los cromos que han salido en los sobres, con repes y en este orden. */
export const ALBUM_REPES: readonly string[] = ['gol', 'gol', 'mate', 'rey', 'mate', 'gol']

/** La ficha que hay que guardar: nombre y número. */
export const ALBUM_FICHA: readonly [string, number] = ['gol', 1]

/** Lo que tiene que salir por la consola, en orden. */
export const ALBUM_LINES: readonly string[] = ['Únicos: 3', 'Ficha: gol, 1']

export interface AlbumState {
  album: string[] | null
  ficha: [string, number] | null
}

export function createAlbum(): AlbumState {
  return { album: null, ficha: null }
}

/** API del nivel: el álbum llega como conjunto y la ficha como tupla. */
export function createAlbumApi(state: AlbumState): Api {
  return {
    entregar(album, ficha) {
      if (!Array.isArray(album)) {
        throw new ApiError('entregar() espera el álbum sin repes: un conjunto de cromos')
      }
      if (
        !Array.isArray(ficha) ||
        ficha.length !== 2 ||
        typeof ficha[0] !== 'string' ||
        typeof ficha[1] !== 'number'
      ) {
        throw new ApiError('entregar() espera la ficha como una tupla: ("gol", 1)')
      }

      state.album = album.map((card) => String(card))
      state.ficha = [String(ficha[0]), Number(ficha[1])]
    },
  }
}

/** Los cromos distintos que hay en los sobres, sin repetir. */
function uniqueCards(): string[] {
  return [...new Set(ALBUM_REPES)]
}

export function judgeAlbum(
  state: AlbumState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  const announced = ALBUM_LINES.findIndex((expected, index) => output[index] !== expected)
  if (announced !== -1) {
    return {
      complete: false,
      missing: `La línea ${announced + 1} no es la esperada: con print() tiene que salir «${ALBUM_LINES[announced]}».`,
    }
  }

  if (output.length < ALBUM_LINES.length) {
    return {
      complete: false,
      missing: `Faltan anuncios: el siguiente tiene que ser «${ALBUM_LINES[output.length]}».`,
    }
  }

  if (state.album === null || state.ficha === null) {
    return {
      complete: false,
      missing: 'El álbum y la ficha no han llegado: entrégalos con entregar(album, ficha).',
    }
  }

  const unique = [...new Set(state.album)]
  if (state.album.length !== unique.length) {
    return {
      complete: false,
      missing: `El álbum ha llegado con ${state.album.length} cromos y solo hay ${unique.length} distintos: pásalos por un conjunto para quitar los repes.`,
    }
  }

  const expected = uniqueCards().sort()
  const delivered = [...state.album].sort()
  if (expected.join('|') !== delivered.join('|')) {
    return {
      complete: false,
      missing: `Los cromos del álbum tienen que ser ${expected.join(', ')} y han llegado ${delivered.join(', ')}.`,
    }
  }

  if (state.ficha[0] !== ALBUM_FICHA[0] || state.ficha[1] !== ALBUM_FICHA[1]) {
    return {
      complete: false,
      missing: `La ficha tiene que ser la tupla ("${ALBUM_FICHA[0]}", ${ALBUM_FICHA[1]}).`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: el álbum sin repes y la ficha guardada. */
export function albumSteps(state: AlbumState): SceneStep[] {
  const cards = [...ALBUM_REPES]
  const steps: SceneStep[] = [{ kind: 'album', cards, unique: [], ficha: null, delivered: false }]
  const album = state.album
  if (album === null) return steps

  album.forEach((_, index) => {
    steps.push({
      kind: 'album',
      cards,
      unique: album.slice(0, index + 1),
      ficha: state.ficha,
      delivered: index === album.length - 1,
    })
  })

  return steps
}
