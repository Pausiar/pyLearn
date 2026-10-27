import { albumSteps, createAlbum, createAlbumApi, judgeAlbum } from '../engine/album'
import { AlbumScene } from './scenes/AlbumScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_28: PlayableLevel = {
  id: 28,
  title: 'Cromos únicos',
  concept: 'Tuplas y sets',
  story:
    'En los sobres han salido seis cromos con repes, en este orden: repes = ["gol", "gol", "mate", "rey", "mate", "gol"]. Solo hay tres distintos. Pásalos por un conjunto con album = set(repes) y anuncia cuántos únicos hay: «Únicos: 3». Después guarda la ficha del primer cromo como tupla, ficha = ("gol", 1), y anúnciala leyendo sus posiciones: «Ficha: gol, 1». Entrega el conjunto y la tupla con entregar(album, ficha).',
  hint:
    'set(repes) crea un conjunto: quita los repetidos y no guarda orden. Una tupla se escribe con paréntesis, como las listas, pero no se puede cambiar; sus posiciones se leen igual: ficha[0] y ficha[1]. Consigue 3 estrellas con 8 líneas o menos.',
  starter: [
    'repes = ["gol", "gol", "mate", "rey", "mate", "gol"]',
    '# Quita los cromos repetidos, anuncia cuántos únicos hay y guarda',
    '# la ficha como tupla. Después entrega el álbum y la ficha.',
  ].join('\n'),
  solution: [
    'repes = ["gol", "gol", "mate", "rey", "mate", "gol"]',
    'album = set(repes)',
    'print("Únicos: " + str(len(album)))',
    'ficha = ("gol", 1)',
    'print("Ficha: " + ficha[0] + ", " + str(ficha[1]))',
    'entregar(album, ficha)',
  ].join('\n'),
  par: 8,
  sceneTitle: 'El álbum de cromos',
  success: 'Álbum sin repes y ficha guardada.',
  Scene: AlbumScene,
  start() {
    const album = createAlbum()

    return {
      api: createAlbumApi(album),
      finish(result) {
        return { ...judgeAlbum(album, result.output), steps: albumSteps(album) }
      },
    }
  },
}
