import type { StorageLike } from './storage'

export type ThemePreference = 'system' | 'light' | 'dark'

export const THEME_KEY = 'pylearn:theme'

const OPTIONS = ['system', 'light', 'dark'] as const

export const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'Sistema',
  light: 'Claro',
  dark: 'Oscuro',
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (OPTIONS as readonly string[]).includes(value)
}

export function readTheme(storage: StorageLike | null): ThemePreference {
  if (!storage) return 'system'
  try {
    const saved = storage.getItem(THEME_KEY)
    return isThemePreference(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}

export function saveTheme(storage: StorageLike | null, preference: ThemePreference): void {
  if (!storage) return
  try {
    storage.setItem(THEME_KEY, preference)
  } catch {
    // Sin persistencia: el tema sigue funcionando en esta pestaña.
  }
}

export function applyTheme(preference: ThemePreference, root: HTMLElement): void {
  if (preference === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', preference)
}
