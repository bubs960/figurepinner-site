// DataQualityBadge.tsx — visible "trust this much" pill on figure pages.
// Server component. Static styling; no client state.
//
// Reads the data-quality state derived from soldCount and renders a colored
// pill with plain-English copy. Hidden affordance for the "60% coverage"
// problem: instead of opaque gating, every figure self-labels its data
// quality so users can decide for themselves whether to trust the median.

import type { DataQualityState } from '../_lib/figureFormatters'

interface Props {
  state: DataQualityState
  compCount: number
  /** When true, render a compact pill (e.g. for hero rows). When false,
   *  render the wider explainer card. Defaults to compact. */
  compact?: boolean
}

const COPY: Record<DataQualityState, {
  label: string
  caveat: string
  bg: string
  fg: string
  border: string
  dot: string
}> = {
  reliable: {
    label: 'Reliable Pricing',
    caveat: 'Median is meaningful — bid with confidence.',
    bg: 'rgba(0, 200, 112, 0.10)',
    fg: '#00C870',
    border: 'rgba(0, 200, 112, 0.30)',
    dot: '#00C870',
  },
  limited: {
    label: 'Limited Data',
    caveat: 'Few recent comps — treat the median as an estimate.',
    bg: 'rgba(255, 184, 0, 0.10)',
    fg: '#FFB800',
    border: 'rgba(255, 184, 0, 0.30)',
    dot: '#FFB800',
  },
  sparse: {
    label: 'Sparse Data',
    caveat: 'Only 1\u20133 comps. Directional only — verify before bidding.',
    bg: 'rgba(255, 95, 0, 0.10)',
    fg: '#FF5F00',
    border: 'rgba(255, 95, 0, 0.30)',
    dot: '#FF5F00',
  },
  none: {
    label: 'No Sold Data Yet',
    caveat: 'No recent comps in our system. Search eBay sold listings directly.',
    bg: 'rgba(120, 120, 138, 0.10)',
    fg: 'var(--fp-muted)',
    border: 'rgba(120, 120, 138, 0.25)',
    dot: 'var(--fp-muted)',
  },
}

export default function DataQualityBadge({ state, compCount, compact = true }: Props) {
  const c = COPY[state]
  const compLabel = compCount === 1 ? '1 comp' : `${compCount} comps`

  if (compact) {
    return (
      <div
        role="status"
        aria-label={`Data quality: ${c.label}, ${compLabel}`}
        title={c.caveat}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: c.bg,
          color: c.fg,
          border: `1px solid ${c.border}`,
          borderRadius: '9999px',
          padding: '0.3rem 0.7rem',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: c.dot, flexShrink: 0,
          }}
        />
        <span>{c.label}</span>
        <span style={{ opacity: 0.6, fontWeight: 600 }}>· {compLabel}</span>
      </div>
    )
  }

  // Expanded variant — used on EmptyState or when we want the explanation visible.
  return (
    <div
      role="status"
      aria-label={`Data quality: ${c.label}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        background: c.bg,
        color: 'var(--fp-text)',
        border: `1px solid ${c.border}`,
        borderRadius: '10px',
        padding: '0.875rem 1rem',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8, height: 8, borderRadius: '50%',
          background: c.dot, marginTop: 6, flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.8rem', fontWeight: 700,
          color: c.fg, letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          {c.label}
          <span style={{ opacity: 0.6, fontWeight: 600, marginLeft: '0.5rem' }}>
            · {compLabel}
          </span>
        </div>
        <div style={{
          fontSize: '0.8125rem', color: 'var(--fp-muted)',
          marginTop: 4, lineHeight: 1.5,
        }}>
          {c.caveat}
        </div>
      </div>
    </div>
  )
}
