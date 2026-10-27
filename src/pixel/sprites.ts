/**
 * Sprites como cuadrículas de texto: cada carácter es un píxel de 4 px.
 * Se dibujan en tiempo de ejecución, sin imágenes externas.
 *
 * k cuerpo oscuro · c cristal · w luz · g metal · y flor seca · n tallo
 * s tierra · G hoja · r fruto
 */
export const SPRITES = {
  drone: ['gg....gg', '.kkkkkk.', 'kkcwwckk', '.kkkkkk.', '..k..k..'],
  dryPlant: [
    '........',
    '.y....y.',
    '..y..y..',
    '...yy...',
    '....n...',
    '....n...',
    '.ssnnss.',
    '........',
  ],
  wetPlant: [
    '...rr...',
    '..rrrr..',
    '...rr...',
    '.GG.n.GG',
    '..GGnGG.',
    '....n...',
    '.ssnnss.',
    '........',
  ],
} as const
