import { ChevronLeftIcon, HeartIcon, HexagonIcon, SlidersIcon, StarIcon } from './icons'
import { totalStars, type Progress } from './progress'
import type { Route } from './router'

interface TopBarProps {
  route: Route
  progress: Progress
  onOpenSettings(): void
}

export function TopBar({ route, progress, onOpenSettings }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        {route.name === 'level' ? (
          <a className="topbar__back" href="#/">
            <ChevronLeftIcon />
            <span>Mapa</span>
          </a>
        ) : (
          <a className="brand" href="#/">
            <span className="brand__mark">
              <HexagonIcon />
            </span>
            <span>PyLearn</span>
          </a>
        )}

        <div className="hud">
          <span className="hud__item">
            <HeartIcon />
            <span className="visually-hidden">Vidas: </span>
            {progress.lives}
          </span>
          <span className="hud__item">
            <StarIcon />
            <span className="visually-hidden">Estrellas: </span>
            {totalStars(progress)}
          </span>
        </div>

        <button type="button" className="icon-button" onClick={onOpenSettings}>
          <SlidersIcon />
          <span className="visually-hidden">Ajustes</span>
        </button>
      </div>
    </header>
  )
}
