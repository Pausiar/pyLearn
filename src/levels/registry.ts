import { PLAYABLE_01 } from './level01'
import { PLAYABLE_02 } from './level02'
import { PLAYABLE_03 } from './level03'
import { PLAYABLE_04 } from './level04'
import { PLAYABLE_05 } from './level05'
import { PLAYABLE_06 } from './level06'
import { PLAYABLE_07 } from './level07'
import { PLAYABLE_08 } from './level08'
import { PLAYABLE_09 } from './level09'
import { PLAYABLE_10 } from './level10'
import type { PlayableLevel } from './types'

/** Los niveles que se pueden jugar hoy, en orden. */
export const PLAYABLE_LEVELS: readonly PlayableLevel[] = [
  PLAYABLE_01,
  PLAYABLE_02,
  PLAYABLE_03,
  PLAYABLE_04,
  PLAYABLE_05,
  PLAYABLE_06,
  PLAYABLE_07,
  PLAYABLE_08,
  PLAYABLE_09,
  PLAYABLE_10,
]

const BY_ID = new Map<number, PlayableLevel>(PLAYABLE_LEVELS.map((level) => [level.id, level]))

export function playableLevel(id: number): PlayableLevel | undefined {
  return BY_ID.get(id)
}

export function isPlayable(id: number): boolean {
  return BY_ID.has(id)
}
