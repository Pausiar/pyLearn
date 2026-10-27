import { useEffect, useMemo, useRef } from 'react'
import { currentLevel, starsFor, type Progress } from '../app/progress'
import { LEVELS, worldById, type LevelSummary } from '../levels/catalog'
import { hexPoints, layoutPath } from './hex'

interface HexMapProps {
  progress: Progress
  onPick(level: LevelSummary): void
}

export function HexMap({ progress, onPick }: HexMapProps) {
  const { nodes, width, height } = useMemo(() => layoutPath(LEVELS.length), [])
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
      <polyline
        className="hexmap__path"
        points={nodes.map((node) => `${node.x},${node.y}`).join(' ')}
      />

      {LEVELS.map((level, index) => {
        const node = nodes[index]
        if (!node) return null

        const stars = starsFor(progress, level.id)
        const isCurrent = level.id === current
        const state = stars > 0 ? 'done' : isCurrent ? 'current' : 'locked'
        const radius = level.boss ? 36 : 26
        const world = worldById(level.world)

        return (
          <g key={level.id}>
            {index % 5 === 0 && world ? (
              <text className="hexmap__world" x={16} y={node.y - 52}>
                {`Mundo ${world.id}: ${world.title}`}
              </text>
            ) : null}

            <g
              ref={level.id === current ? currentRef : undefined}
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
                <polygon
                  className="node__ring"
                  points={hexPoints(node.x, node.y, radius + 7)}
                />
              ) : null}
              <polygon className="node__shape" points={hexPoints(node.x, node.y, radius)} />
              <text className="node__number" x={node.x} y={node.y + 7} textAnchor="middle">
                {level.id}
              </text>
              {stars > 0 ? (
                <text
                  className="node__stars"
                  x={node.x}
                  y={node.y + radius + 16}
                  textAnchor="middle"
                >
                  {'★'.repeat(stars)}
                </text>
              ) : isCurrent ? (
                <text
                  className="node__here"
                  x={node.x}
                  y={node.y + radius + 16}
                  textAnchor="middle"
                >
                  Aquí
                </text>
              ) : null}
            </g>
          </g>
        )
      })}
    </svg>
  )
}
