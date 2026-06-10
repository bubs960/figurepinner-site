'use client'

// Client component — onError handler requires hydration to fire.
// Imported by /figure/[figure_id]/page.tsx (server component).

import { useState } from 'react'
import { thumb } from '@/lib/imageUrl'

type Props = {
  url: string | null
  name: string
  genre?: string
  /** When true, renders without the outer card wrapper (parent supplies the container) */
  bare?: boolean
}

export default function FigureImage({ url, name, bare }: Props) {
  const [errored, setErrored] = useState(false)

  const inner = (!url || errored) ? (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: '3rem',
      color: 'var(--muted)',
      letterSpacing: 0,
    }}>
      {figureMonogram(name)}
    </div>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={thumb(url, 600) ?? url}
      alt={name}
      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem' }}
      onError={() => setErrored(true)}
    />
  )

  if (bare) return inner

  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '12px',
      overflow: 'hidden', aspectRatio: '1',
    }}>
      {inner}
    </div>
  )
}

function figureMonogram(name: string): string {
  const words = name.replace(/[^a-zA-Z0-9 ]/g, '').split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'FP'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}
