/**
 * El pixel art tiene su propio color: no hereda los tokens de la interfaz.
 * Una paleta común mantiene cohesionados los cuarenta minijuegos; cada mundo
 * elige su subconjunto y su luz.
 */
export const COLORS = {
  ink: '#10121f',
  inkSoft: '#181c2e',
  inkBlue: '#1b2440',
  midnight: '#0e1730',
  slate: '#2a3147',
  steel: '#4a5568',
  stone: '#6b7280',
  silver: '#a8b0c0',
  cloud: '#ffffff',
  paper: '#f4f6fb',
  cream: '#ffe8b8',
  sand: '#d9b878',
  wood: '#8a5a2b',
  woodDark: '#5c3a1c',
  woodLight: '#b07a3f',
  brick: '#b04a3a',
  brickDark: '#7d2f26',
  red: '#e05263',
  coral: '#ff7f6b',
  pink: '#ff9ec7',
  orange: '#e88a3a',
  gold: '#ffc857',
  yellow: '#ffe08a',
  lime: '#b8e986',
  green: '#4caf50',
  forest: '#2f6b3a',
  deepGreen: '#1e4a2a',
  moss: '#7ccf75',
  teal: '#2fb3a0',
  cyan: '#5ad1ff',
  sky: '#8fd3ff',
  skyDeep: '#5fb8f0',
  blue: '#4a7fd4',
  navy: '#1b2a4a',
  indigo: '#2b2150',
  purple: '#7a5bd6',
  violet: '#b085f5',
  magenta: '#e05aa8',
  skin: '#e8c39e',
  skinShade: '#b98a63',
  skinDark: '#8a5f3f',
  water: '#4aa8ff',
  waterDeep: '#2b6cb0',
  ice: '#cfefff',
} as const

export type Colour = (typeof COLORS)[keyof typeof COLORS]

/** Compatibilidad con el campo del dron del mundo 1. */
export const PALETTE = {
  sky: COLORS.sky,
  cloud: COLORS.cloud,
  night: COLORS.ink,
  drone: '#25304a',
  glass: COLORS.cyan,
  metal: COLORS.silver,
  sun: COLORS.gold,
  stem: COLORS.wood,
  soil: '#6b4423',
  soilDark: COLORS.woodDark,
  soilSpeck: '#593a1d',
  pad: '#596275',
  grass: COLORS.green,
  leaf: '#3fb34f',
  fruit: COLORS.coral,
  water: COLORS.water,
} as const

export interface Theme {
  /** Cielo o fondo lejano, de arriba abajo. */
  skyTop: string
  skyBottom: string
  /** Silueta lejana. */
  silhouette: string
  /** Suelo y sus luces. */
  ground: string
  groundLight: string
  groundDark: string
  /** Luz propia del mundo: lámparas, motores, magia. */
  glow: string
  /** Acento de la interfaz dentro del lienzo. */
  accent: string
  accentDark: string
  /** Paneles de datos. */
  panel: string
  panelLine: string
  text: string
  muted: string
}

/** Ocho mundos, ocho luces. El pixel art no cambia de estilo, sí de hora. */
export const THEMES: Record<number, Theme> = {
  1: {
    skyTop: COLORS.sky,
    skyBottom: COLORS.ice,
    silhouette: '#7fb86a',
    ground: '#6b4423',
    groundLight: '#8a5f2e',
    groundDark: '#4a2f18',
    glow: COLORS.yellow,
    accent: COLORS.green,
    accentDark: COLORS.forest,
    panel: 'rgba(16,18,31,0.82)',
    panelLine: COLORS.steel,
    text: COLORS.paper,
    muted: '#9fb0cc',
  },
  2: {
    skyTop: COLORS.midnight,
    skyBottom: COLORS.indigo,
    silhouette: '#28305a',
    ground: '#2b2f45',
    groundLight: '#3d4568',
    groundDark: '#1a1d30',
    glow: COLORS.gold,
    accent: COLORS.coral,
    accentDark: COLORS.brickDark,
    panel: 'rgba(14,23,48,0.86)',
    panelLine: '#3a4a7a',
    text: COLORS.paper,
    muted: '#7f8db8',
  },
  3: {
    skyTop: '#1a1a22',
    skyBottom: '#24242e',
    silhouette: '#2c2c38',
    ground: '#2c2420',
    groundLight: '#4a3a2c',
    groundDark: '#1b1612',
    glow: COLORS.gold,
    accent: COLORS.orange,
    accentDark: COLORS.woodDark,
    panel: 'rgba(12,12,18,0.86)',
    panelLine: '#3f3f4b',
    text: COLORS.paper,
    muted: '#9a9aa8',
  },
  4: {
    skyTop: '#3a2b5e',
    skyBottom: '#c96a4a',
    silhouette: '#4a3a68',
    ground: '#2b2438',
    groundLight: '#443a54',
    groundDark: '#1a1626',
    glow: COLORS.gold,
    accent: COLORS.coral,
    accentDark: COLORS.brickDark,
    panel: 'rgba(24,20,40,0.86)',
    panelLine: '#5a4a78',
    text: COLORS.paper,
    muted: '#a99cc4',
  },
  5: {
    skyTop: '#2a2f4a',
    skyBottom: '#d98a5a',
    silhouette: '#4a4050',
    ground: '#6b4423',
    groundLight: '#8a5f2e',
    groundDark: '#4a2f18',
    glow: COLORS.yellow,
    accent: COLORS.red,
    accentDark: COLORS.brickDark,
    panel: 'rgba(26,22,30,0.86)',
    panelLine: '#6a5548',
    text: COLORS.paper,
    muted: '#c4b09a',
  },
  6: {
    skyTop: '#070b1c',
    skyBottom: '#1b2a4a',
    silhouette: '#12203c',
    ground: '#1a2238',
    groundLight: '#2c3a5c',
    groundDark: '#0e1424',
    glow: COLORS.cyan,
    accent: COLORS.cyan,
    accentDark: COLORS.waterDeep,
    panel: 'rgba(7,11,28,0.86)',
    panelLine: '#2b3d66',
    text: COLORS.paper,
    muted: '#8fa3cc',
  },
  7: {
    skyTop: '#241a3a',
    skyBottom: '#4a3a6a',
    silhouette: '#2e2148',
    ground: '#2a2438',
    groundLight: '#3f3652',
    groundDark: '#191424',
    glow: COLORS.violet,
    accent: COLORS.violet,
    accentDark: COLORS.purple,
    panel: 'rgba(20,15,34,0.86)',
    panelLine: '#4a3a6a',
    text: COLORS.paper,
    muted: '#a08fbe',
  },
  8: {
    skyTop: '#14283a',
    skyBottom: '#2fb3a0',
    silhouette: '#1e4a4a',
    ground: '#2f4a3a',
    groundLight: '#42684f',
    groundDark: '#1b2f24',
    glow: COLORS.lime,
    accent: COLORS.teal,
    accentDark: '#1e6b60',
    panel: 'rgba(12,26,30,0.86)',
    panelLine: '#2f5a54',
    text: COLORS.paper,
    muted: '#8fbcb4',
  },
}

export function themeFor(world: number): Theme {
  return THEMES[world] ?? THEMES[1]
}
