'use client'

interface SparklineProps {
  points: number[]
  trend: 'up' | 'down' | 'flat'
  width?: number
  height?: number
}

export default function Sparkline({ points, trend, width = 64, height = 18 }: SparklineProps) {
  if (points.length < 2) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const pad = 1.5
  const coords = points
    .map((p, i) => {
      const x = pad + (i / (points.length - 1)) * (width - pad * 2)
      const y = pad + (1 - (p - min) / range) * (height - pad * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const color =
    trend === 'up' ? '#10b981' :
    trend === 'down' ? '#ef4444' :
    'var(--muted, #888)'

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden
    >
      <polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  )
}
