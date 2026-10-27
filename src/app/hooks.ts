import { useCallback, useEffect, useState } from 'react'
import { parseHash, type Route } from './router'
import { browserStorage } from './storage'
import {
  applyTheme,
  readTheme,
  saveTheme,
  type ThemePreference,
} from './theme'

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

export function useTheme(): [ThemePreference, (preference: ThemePreference) => void] {
  const [preference, setPreference] = useState<ThemePreference>(() => readTheme(browserStorage()))

  useEffect(() => {
    applyTheme(preference, document.documentElement)
    saveTheme(browserStorage(), preference)
  }, [preference])

  const change = useCallback((next: ThemePreference) => setPreference(next), [])

  return [preference, change]
}
