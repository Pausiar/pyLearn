export interface NodePosition {
  x: number
  y: number
}

const WIDTH = 360
const CENTER_X = 180
const AMPLITUDE = 95
const WAVE = 0.85
const STEP = 78
const WORLD_STEP = 112
const WORLD_SIZE = 5
const TAIL = 70

export function hexPoints(cx: number, cy: number, radius: number): string {
  return [0, 1, 2, 3, 4, 5]
    .map((corner) => {
      const angle = (Math.PI / 3) * corner - Math.PI / 6
      const x = (cx + radius * Math.cos(angle)).toFixed(1)
      const y = (cy + radius * Math.sin(angle)).toFixed(1)
      return `${x},${y}`
    })
    .join(' ')
}

/** Posiciones en zigzag del camino. Cada mundo empieza con más aire para su rótulo. */
export function layoutPath(count: number): { nodes: NodePosition[]; width: number; height: number } {
  const nodes: NodePosition[] = []
  let y = 0

  for (let index = 0; index < count; index += 1) {
    y += index % WORLD_SIZE === 0 ? WORLD_STEP : STEP
    nodes.push({
      x: Number((CENTER_X + AMPLITUDE * Math.sin(index * WAVE)).toFixed(1)),
      y,
    })
  }

  return { nodes, width: WIDTH, height: y + TAIL }
}
