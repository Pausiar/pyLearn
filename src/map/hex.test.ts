import { describe, expect, it } from 'vitest'
import { curveSegments, layoutPath } from './hex'

describe('curveSegments', () => {
  it('produce un tramo por cada pareja de nodos', () => {
    const { nodes } = layoutPath(6)
    expect(curveSegments(nodes)).toHaveLength(5)
  })

  it('empieza y acaba en los nodos que une', () => {
    const { nodes } = layoutPath(3)
    const segments = curveSegments(nodes)
    const first = segments[0]
    const second = segments[1]

    expect(first?.d.startsWith(`M${nodes[0]!.x} ${nodes[0]!.y}`)).toBe(true)
    expect(second?.d.endsWith(`${nodes[2]!.x} ${nodes[2]!.y}`)).toBe(true)
    expect(first?.to).toEqual(nodes[1])
  })

  it('usa una curva cúbica por tramo', () => {
    const { nodes } = layoutPath(2)
    expect(curveSegments(nodes)[0]?.d).toContain('C')
  })

  it('no inventa tramos con menos de dos nodos', () => {
    expect(curveSegments([])).toEqual([])
    expect(curveSegments([{ x: 1, y: 2 }])).toEqual([])
  })
})

describe('layoutPath', () => {
  it('abre más espacio al empezar cada mundo', () => {
    const { nodes } = layoutPath(6)
    const regular = (nodes[1]?.y ?? 0) - (nodes[0]?.y ?? 0)
    const world = (nodes[5]?.y ?? 0) - (nodes[4]?.y ?? 0)

    expect(world).toBeGreaterThan(regular)
  })

  it('devuelve un nodo por nivel', () => {
    expect(layoutPath(40).nodes).toHaveLength(40)
  })
})
