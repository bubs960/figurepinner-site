// ValueStrip.tsx — Zone 2: Four-cell price summary strip
// Server component

import { formatCurrency, compCountToConfidence } from '../_lib/figureFormatters'

interface Pricing {
  median: number | null
  trend_90d_pct: number | null
  low: number | null
  high: number | null
  confidence: 1 | 2 | 3 | 4 | 5
  comp_count: number
}

interface ValueStripProps {
  pricing: Pricing | null
  className?: string
}

export default function ValueStrip({ pricing, className }: ValueStripProps) {
  if (!pricing || pricing.comp_count < 1) return null

  const tooFewComps = pricing.comp_count < 3
  const trend = pricing.trend_90d_pct

  const trendDisplay = (() => {
    if (tooFewComps || trend === null) return null
    if (Math.abs(trend) < 0.5) return { label: '— Flat', color: 'var(--fp-muted)' }
    if (trend > 0) return { label: `▲ ${trend.toFixed(1)}%`, color: 'var(--fp-success)' }
    return { label: `▼ ${Math.abs(trend).toFixed(1)}%`, color: 'var(--fp-danger)' }
  })()

  const confidence = tooFewComps ? 1 : (pricing.confidence ?? compCountToConfidence(pricing.comp_count))
  const dots = Array.from({ length: 5 }, (_, i) => i < confidence)

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: tooFewComps ? '1fr' : `repeat(${trendDisplay ? 4 : 3}, 1fr)`,
        gap: '1px',
      background: 'var(--fp-border)',
      border: '1px solid var(--fp-border)',
      borderRadius: 'var(--fp-radius)',
      overflow: 'hidden',
    }}>
      {/* Median */}
      <Cell
        label="Median Sold"
        value={pricing.median != null ? formatCurrency(pricing.median) : '—'}
        highlight
      />

      {/* Trend — hidden if insufficient comps */}
      {trendDisplay && (
        <Cell
          label="90-Day Trend"
          value={trendDisplay.label}
          valueColor={trendDisplay.color}
        />
      )}
      {tooFewComps && (
        <Cell
          label="Trend"
          value="Insufficient comps"
          valueColor="var(--fp-dim)"
          small
        />
      )}

      {/* Range */}
      {!tooFewComps && (
        <Cell
          label="Range"
          value={
            pricing.low != null && pricing.high != null
              ? `${formatCurrency(pricing.low)} – ${formatCurrency(pricing.high)}`
              : '—'
          }
          small
        />
      )}

      {/* Confidence */}
      <Cell
        label="Confidence"
        value=""
        extra={
          <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
            {dots.map((filled, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: filled ? 'var(--fp-accent)' : 'var(--fp-surface-2)',
                border: `1px solid ${filled ? 'var(--fp-accent)' : 'var(--fp-border)'}`,
              }} />
            ))}
          </div>
        }
        sub={`${pricing.comp_count} comps`}
      />
    </div>
  )
}

function Cell({
  label, value, highlight, valueColor, small, extra, sub,
}: {
  label: string
  value: string
  highlight?: boolean
  valueColor?: string
  small?: boolean
  extra?: React.ReactNode
  sub?: string
}) {
  return (
    <div style={{
      background: 'var(--fp-surface-0)',
      padding: '1rem 1.125rem',
      display: 'flex', flexDirection: 'column', gap: '0.25rem',
    }}>
      <div style={{
        fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.1em',
        color: 'var(--fp-dim)', textTransform: 'uppercase',
      }}>
        {label}
      </div>
      {value && (
        <div style={{
          fontFamily: small ? 'var(--fp-font-body)' : 'var(--fp-font-display)',
          fontSize: small ? '0.875rem' : '1.5rem',
          letterSpacing: small ? 'normal' : '0.02em',
          color: valueColor ?? (highlight ? 'var(--fp-success)' : 'var(--fp-text)'),
          fontWeight: small ? '500' : undefined,
        }}>
          {value}
        </div>
      )}
      {extra}
      {sub && (
        <div style={{ fontSize: '0.68rem', color: 'var(--fp-dim)' }}>{sub}</div>
      )}
    </div>
  )
}
