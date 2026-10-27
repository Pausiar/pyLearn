import { useEffect, useState } from 'react'
import { LevelScreen } from '../levels/LevelScreen'
import { levelById } from '../levels/catalog'
import { MapScreen } from '../map/MapScreen'
import { useRoute, useTheme } from './hooks'
import {
  emptyProgress,
  loadProgress,
  saveProgress,
  type Progress,
} from './progress'
import { SettingsDialog } from './SettingsDialog'
import { browserStorage } from './storage'
import { TopBar } from './TopBar'

export function App() {
  const route = useRoute()
  const [theme, changeTheme] = useTheme()
  const [progress, setProgress] = useState<Progress>(() => loadProgress(browserStorage()))
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    saveProgress(browserStorage(), progress)
  }, [progress])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title =
      route.name === 'level'
        ? `Nivel ${route.id}: ${levelById(route.id)?.title ?? ''} | PyLearn`
        : 'PyLearn: aprende Python jugando'
  }, [route])

  return (
    <>
      <TopBar
        route={route}
        progress={progress}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {route.name === 'level' ? (
        <LevelScreen
          key={route.id}
          levelId={route.id}
          progress={progress}
          onChange={setProgress}
        />
      ) : (
        <MapScreen progress={progress} />
      )}

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onThemeChange={changeTheme}
        progress={progress}
        onImport={setProgress}
        onReset={() => setProgress(emptyProgress())}
      />
    </>
  )
}
