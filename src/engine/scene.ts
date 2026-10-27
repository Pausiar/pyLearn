/** Un paso visual de un minijuego. Cada escena consume los suyos y dibuja ese estado. */
export type SceneStep =
  | { kind: 'drone'; x: number; watered: number[] }
  | { kind: 'lighthouse'; lines: string[] }
  | { kind: 'backpack'; ropes: number; canteens: number; placed: boolean }
  | { kind: 'sign'; text: string; lit: boolean }
  | { kind: 'rocket'; fuel: number; sent: boolean }
  | { kind: 'shop'; questions: string[]; message: string }
  | { kind: 'locks'; open: (boolean | null)[] }
  | {
      kind: 'crossing'
      redCrossed: boolean
      redWaited: boolean
      greenCrossed: boolean
      greenWaited: boolean
    }
  | { kind: 'gate'; visitors: { pass: string; door: string }[] }
  | { kind: 'irrigation'; watered: number[]; position: number }
  | { kind: 'mine'; rocks: number; picadas: number }
  | { kind: 'vault'; tried: number[]; opened: boolean }
  | { kind: 'scanner'; readings: number[]; boxes: number; reached: number }
  | { kind: 'grid'; watered: number[]; cell: number }
  | { kind: 'train'; loads: string[]; sent: boolean }
  | { kind: 'route'; delivered: string[] }
  | { kind: 'pizzeria'; queue: string[]; served: string | null }
  | { kind: 'convoy'; full: string[]; convoy: string[]; formed: boolean }
  | { kind: 'adventure'; items: string[]; weights: number[]; light: string[]; done: boolean }
  | { kind: 'robot'; position: number; jumps: number; taught: boolean; run: boolean }
  | { kind: 'oven'; baked: { sabor: string; cantidad: number }[]; done: boolean }
  | {
      kind: 'vending'
      sales: { producto: string; precio: number; pago: number; cambio: number }[]
      done: boolean
    }
  | { kind: 'lab'; readings: { room: string; value: number }[] }
  | {
      kind: 'restaurant'
      trace: { action: string; ingrediente: string }[]
      served: string[]
      done: boolean
    }

/** Lo que el lienzo expone al nivel: reproducir una traza y volver al estado inicial. */
export interface SceneHandle {
  play(steps: SceneStep[]): Promise<void>
  reset(): void
}
