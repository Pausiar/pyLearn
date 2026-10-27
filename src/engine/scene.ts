/** Un paso visual de un minijuego. Cada escena consume los suyos y dibuja ese estado. */
export type SceneStep =
  | { kind: 'drone'; x: number; watered: number[] }
  | { kind: 'lighthouse'; lines: string[] }
  | { kind: 'backpack'; ropes: number; canteens: number; placed: boolean }
  | { kind: 'sign'; text: string; lit: boolean }

/** Lo que el lienzo expone al nivel: reproducir una traza y volver al estado inicial. */
export interface SceneHandle {
  play(steps: SceneStep[]): Promise<void>
  reset(): void
}
