'use client'

// WaveProgress.tsx — client island for the "Complete the Wave" RelatedRow.
// Fetches the signed-in user's vault once, intersects owned figure_ids with
// the wave's fids, and renders a "You own N of M" badge in the row header.
//
// Renders NOTHING for logged-out visitors (401), on fetch failure, or when the
// user owns zero of the wave — figure-page traffic is mostly logged-out SEO,
// so the default state must be invisible (no regression, no discouraging "0 of N").

import { useEffect, useState } from 'react'

interface WaveProgressProps {
  /** Every fid in the wave, including the figure currently being viewed. */
  fids: string[]
}

export default function WaveProgress({ fids }: WaveProgressProps) {
  const [owned, setOwned] = useState<number | null>(null)
  const total = fids.length

  useEffect(() => {
    let cancelled = false
    const waveSet = new Set(fids)
    fetch('/api/vault')
      .then(res => (res.ok ? res.json() : null))
      .then((data: { items?: { figure_id: string }[] } | null) => {
        if (cancelled || !data?.items) return
        const seen = new Set<string>()
        let n = 0
        for (const it of data.items) {
          if (waveSet.has(it.figure_id) && !seen.has(it.figure_id)) {
            seen.add(it.figure_id)
            n++
          }
        }
        setOwned(n)
      })
      .catch(() => { /* logged-out or offline — stay invisible */ })
    return () => { cancelled = true }
  }, [fids])

  // Invisible until we know the user owns at least one of the wave.
  if (owned == null || owned < 1) return null

  const complete = owned >= total

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4em',
        fontSize: '0.59rem',
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        color: complete ? 'var(--shelf-gold-hi, #f5c462)' : 'var(--shelf-gold, #e0a83e)',
      }}
    >
      <span aria-hidden="true">{complete ? '✓' : '◆'}</span>
      {complete
        ? `Wave complete · ${owned} of ${total}`
        : `You own ${owned} of ${total}`}
    </span>
  )
}
