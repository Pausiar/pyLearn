export interface NodePosition {
  x: number
  y: number
}

export interface CurveSegment {
  from: NodePosition
  to: NodePosition
  /** Trazo de Bézier que une los dos nodos pasando por las tangentes vecinas. */
  d: string
}

const WIDTH = 360
const CENTER_X = 180
const AMPLITUDE = 95
const WAVE = 0.85
const STEP = 78
const WORLD_STEP = 136
const WORLD_SIZE = 5
const TAIL = 80

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

function round(value: number): number {
  return Number(value.toFixed(1))
}

/**
 * Curva cada tramo con una Catmull-Rom convertida a Bézier: el camino entra y
 * sale de cada nodo siguiendo la dirección de sus vecinos, no en zigzag recto.
 */
export function curveSegments(nodes: NodePosition[]): CurveSegment[] {
  const segments: CurveSegment[] = []

  for (let index = 0; index < nodes.length - 1; index += 1) {
    const start = nodes[index]
    const end = nodes[index + 1]
    if (!start || !end) continue

    const previous = nodes[index - 1] ?? start
    const next = nodes[index + 2] ?? end

    const c1x = round(start.x + (end.x - previous.x) / 6)
    const c1y = round(start.y + (end.y - previous.y) / 6)
    const c2x = round(end.x - (next.x - start.x) / 6)
    const c2y = round(end.y - (next.y - start.y) / 6)

    segments.push({
      from: start,
      to: end,
      d: `M${start.x} ${start.y} C${c1x} ${c1y} ${c2x} ${c2y} ${end.x} ${end.y}`,
    })
  }

  return segments
}
