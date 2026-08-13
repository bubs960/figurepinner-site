'use client'

// CardMedian.tsx — tiny live-median line for related-rail cards (v4 Phase 4).
// Renders nothing until the batched lookup resolves, and stays empty for
// figures with no sold data — no placeholder, no layout jump beyond the
// reserved line height. Data arrives via railMedianBatch (one request per
// page, never per card).

import { useEffect, useState } from 'react'
import { requestRailMedian, type RailMedian } from './railMedianBatch'

export default function CardMedian({ figureId }: { figureId: string }) {
  const [data, setData] = useState<RailMedian | null>(null)

  useEffect(() => {
    let alive = true
    void requestRailMedian(figureId).then(m => { if (alive) setData(m) })
    return () => { alive = false }
  }, [figureId])

  if (data?.median == null) return null

  return (
    <span style={{
      fontFamily: 'var(--fp-font-display)',
      fontSize: '0.92rem',
      letterSpacing: '0.03em',
      lineHeight: 1,
      color: 'var(--shelf-gold-hi, #f5c462)',
      fontVariantNumeric: 'tabular-nums',
    }}>
      ${Math.round(data.median)}
      {data.stat === 'avg' && (
        <span style={{
          fontFamily: 'var(--fp-font-body)',
          fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))',
          marginLeft: '4px',
        }}>
          avg
        </span>
      )}
    </span>
  )
}
