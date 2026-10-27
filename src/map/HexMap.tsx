import { useEffect, useMemo, useRef } from 'react'
import { currentLevel, starsFor, type Progress } from '../app/progress'
import { LEVELS, worldById, type LevelSummary } from '../levels/catalog'
import { curveSegments, hexPoints, layoutPath } from './hex'

interface HexMapProps {
  progress: Progress
  onPick(level: LevelSummary): void
}

/** Grosor del canto que da volumen a cada hexágono. */
const SIDE = 6
const BADGE_WIDTH = 88
const BADGE_HEIGHT = 26

function checkPath(x: number, y: number, radius: number): string {
  const start = (x - radius * 0.4).toFixed(1)
  const step = (radius * 0.3).toFixed(1)
  const long = (radius * 0.5).toFixed(1)
  const rise = (radius * 0.58).toFixed(1)
  return `M${start} ${y} l${step} ${step} l${long} -${rise}`
}

function playPath(x: number, y: number, radius: number): string {
  const left = (x - radius * 0.2).toFixed(1)
  const top = (y - radius * 0.34).toFixed(1)
  const right = (x + radius * 0.38).toFixed(1)
  const bottom = (y + radius * 0.34).toFixed(1)
  return `M${left} ${top} L${right} ${y} L${left} ${bottom} Z`
}

export function HexMap({ progress, onPick }: HexMapProps) {
  const { nodes, width, height } = useMemo(() => layoutPath(LEVELS.length), [])
  const segments = useMemo(() => curveSegments(nodes), [nodes])
  const current = currentLevel(progress)
  const currentRef = useRef<SVGGElement>(null)

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' })
  }, [current])

  return (
    <svg
      className="hexmap"
      viewBox={`0 0 ${width} ${height}`}
      role="group"
      aria-label="Mapa de cuarenta niveles repartidos en ocho mundos"
    >
      <g aria-hidden="true">
        {segments.map((segment, index) => {
          const from = LEVELS[index]
          const done = from !== undefined && starsFor(progress, from.id) > 0

          return (
            <g
              key={`${segment.from.x}-${segment.from.y}`}
              className={done ? 'hexmap__segment hexmap__segment--done' : 'hexmap__segment'}
            >
              <path className="hexmap__casing" d={segment.d} />
              <path className="hexmap__lane" d={segment.d} />
            </g>
          )
        })}
      </g>

      {LEVELS.map((level, index) => {
        const node = nodes[index]
        if (!node) return null

        const stars = starsFor(progress, level.id)
        const isCurrent = level.id === current
        const state = stars > 0 ? 'done' : isCurrent ? 'current' : 'locked'
        const radius = level.boss ? 36 : 27
        const world = worldById(level.world)
        const badgeY = node.y - radius - 44

        return (
          <g key={level.id}>
            {index % 5 === 0 && world ? (
              <text className="hexmap__world" x={20} y={node.y - 80}>
                {`Mundo ${world.id}: ${world.title}`}
              </text>
            ) : null}

            <g
              ref={isCurrent ? currentRef : undefined}
              className={`node node--${state}`}
              role="button"
              tabIndex={0}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Nivel ${level.id}: ${level.title}${stars > 0 ? `, ${stars} estrellas` : ''}${isCurrent ? ', tu siguiente nivel' : ''}`}
              onClick={() => onPick(level)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                onPick(level)
              }}
            >
              {level.boss ? (
                <polygon className="node__ring" points={hexPoints(node.x, node.y, radius + 10)} />
              ) : null}

              <polygon className="node__side" points={hexPoints(node.x, node.y + SIDE, radius)} />
              <polygon className="node__shape" points={hexPoints(node.x, node.y, radius)} />
              <polygon
                className="node__plate"
                points={hexPoints(node.x, node.y - 1, radius - 8)}
              />

              {state === 'done' ? (
                <path className="node__check" d={checkPath(node.x, node.y, radius)} />
              ) : null}

              {state === 'current' ? (
                <path className="node__play" d={playPath(node.x, node.y, radius)} />
              ) : null}

              {state === 'locked' ? (
                <text
                  className="node__number"
                  x={node.x}
                  y={node.y + 7}
                  textAnchor="middle"
                  aria-hidden="true"
                >
                  {level.id}
                </text>
              ) : null}

              {isCurrent ? (
                <g className="node__badge" aria-hidden="true">
                  <rect
                    x={node.x - BADGE_WIDTH / 2}
                    y={badgeY}
                    width={BADGE_WIDTH}
                    height={BADGE_HEIGHT}
                    rx={8}
                  />
                  <path
                    d={`M${node.x - 5} ${badgeY + BADGE_HEIGHT} L${node.x} ${badgeY + BADGE_HEIGHT + 7} L${node.x + 5} ${badgeY + BADGE_HEIGHT} Z`}
                  />
                  <text x={node.x} y={badgeY + 18} textAnchor="middle">
                    Empieza
                  </text>
                </g>
              ) : null}
            </g>
          </g>
        )
      })}
    </svg>
  )
}
