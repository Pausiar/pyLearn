import { LEVEL_COUNT } from '../levels/catalog'

export type Route = { name: 'map' } | { name: 'level'; id: number }

export const MAP_HASH = '#/'

const LEVEL_HASH = /^#?\/nivel\/(\d{1,2})\/?$/

export function parseHash(hash: string): Route {
  const match = LEVEL_HASH.exec(hash.trim())
  if (!match) return { name: 'map' }

  const id = Number(match[1])
  if (!Number.isInteger(id) || id < 1 || id > LEVEL_COUNT) return { name: 'map' }

  return { name: 'level', id }
}

export function toHash(route: Route): string {
  return route.name === 'map' ? MAP_HASH : `#/nivel/${route.id}`
}

export function navigate(route: Route): void {
  window.location.hash = toHash(route)
}
