interface IconProps {
  size?: number
}

function frame(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    focusable: 'false' as const,
  }
}

export function HexagonIcon({ size = 22 }: IconProps) {
  return (
    <svg {...frame(size)} className="icon" aria-hidden="true">
      <polygon points="12,1.5 21.5,7 21.5,17 12,22.5 2.5,17 2.5,7" fill="currentColor" />
    </svg>
  )
}

export function HeartIcon({ size = 16 }: IconProps) {
  return (
    <svg {...frame(size)} className="icon" aria-hidden="true">
      <path
        d="M12 20.7 4.1 13a4.9 4.9 0 0 1 6.9-7 4.9 4.9 0 0 1 6.9 7Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function StarIcon({ size = 16 }: IconProps) {
  return (
    <svg {...frame(size)} className="icon" aria-hidden="true">
      <path
        d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.1-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function SlidersIcon({ size = 20 }: IconProps) {
  return (
    <svg {...frame(size)} className="icon" aria-hidden="true">
      <path
        d="M4 7h6M14 7h6M4 17h10M18 17h2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7" r="2.3" fill="currentColor" />
      <circle cx="16" cy="17" r="2.3" fill="currentColor" />
    </svg>
  )
}

export function ChevronLeftIcon({ size = 18 }: IconProps) {
  return (
    <svg {...frame(size)} className="icon" aria-hidden="true">
      <path
        d="M14.5 5 7.5 12l7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CloseIcon({ size = 18 }: IconProps) {
  return (
    <svg {...frame(size)} className="icon" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
