// MarketPanel.tsx — Zone 4: Price chart + recent comps
// Server component — chart path computed server-side, Pro gate overlay is static HTML

import { buildChartPath, formatCurrency, formatDate } from '../_lib/figureFormatters'

interface Comp {
  title: string
  price: number
  sold_date: string
  condition: string
  listing_format?: string
}

interface Pricing {
  median: number | null
  comp_count: number
  chart_points: Array<{ date: string; price: number }>
  recent_comps: Comp[]
}

interface MarketPanelProps {
  pricing: Pricing | null
  isPro: boolean
  ebaySearchUrl: string
  figureName: string
}

const CHART_W = 400
const CHART_H = 100

export default function MarketPanel({ pricing, isPro, ebaySearchUrl, figureName }: MarketPanelProps) {
  if (!pricing || pricing.comp_count < 1) return null

  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 86400000
  const chartPoints = pricing.chart_points ?? []
  const hasOlderData = chartPoints.some(p => new Date(p.date).getTime() < thirtyDaysAgo)
  const showGate = !isPro && hasOlderData

  const { linePath, areaPath } = buildChartPath(chartPoints, CHART_W, CHART_H)
  const freeComps = isPro ? pricing.recent_comps : pricing.recent_comps.slice(0, 3)
  const lockedCount = isPro ? 0 : Math.max(0, pricing.recent_comps.length - 3)

  // Find x-coordinate of the 30-day cutoff for the Pro gate overlay
  let gateX = 0
  if (showGate && chartPoints.length >= 2) {
    const sorted = [...chartPoints].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const minDate = new Date(sorted[0].date).getTime()
    const maxDate = new Date(sorted[sorted.length - 1].date).getTime()
    const range = maxDate - minDate || 1
    gateX = ((thirtyDaysAgo - minDate) / range) * CHART_W
    gateX = Math.max(0, Math.min(gateX, CHART_W * 0.7))
  }

  return (
    <section>
      {/* Chart */}
      {linePath && (
        <div style={{
          background: 'var(--fp-surface-0)',
          border: '1px solid var(--fp-border)',
          borderRadius: 'var(--fp-radius)',
          padding: '1.25rem',
          marginBottom: '1rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Gradient top accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, var(--fp-accent), transparent)',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--fp-dim)', textTransform: 'uppercase' }}>
              {isPro ? '90-Day' : '30-Day'} Price History
            </div>
            {!isPro && (
              <a href="/pro" style={{
                fontSize: '0.72rem', color: 'var(--fp-accent)', textDecoration: 'none', fontWeight: '600',
              }}>
                Unlock 90/180-day →
              </a>
            )}
          </div>

          {/* SVG Chart */}
          <div style={{ position: 'relative' }}>
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              preserveAspectRatio="none"
              style={{ width: '100%', height: 90, display: 'block', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--fp-accent)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--fp-accent)" stopOpacity="0" />
                </linearGradient>
                {showGate && (
                  <linearGradient id="gateGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--fp-surface-0)" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="var(--fp-surface-0)" stopOpacity="0" />
                  </linearGradient>
                )}
              </defs>

              {/* Area fill */}
              {areaPath && (
                <path d={areaPath} fill="url(#chartFill)" />
              )}
              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke="var(--fp-accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Pro gate overlay — gradient fade over older data */}
              {showGate && gateX > 0 && (
                <rect
                  x={0} y={0}
                  width={gateX + 30}
                  height={CHART_H}
                  fill="url(#gateGrad)"
                />
              )}
            </svg>

            {/* Pro gate CTA — positioned over blurred area */}
            {showGate && (
              <div style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                paddingLeft: '0.75rem', gap: '0.375rem',
              }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--fp-muted)', fontWeight: '600' }}>
                  Full history locked
                </div>
                <a href="/pro" style={{
                  display: 'inline-block',
                  background: 'var(--fp-accent)',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 'var(--fp-radius-sm)',
                  fontSize: '0.72rem', fontWeight: '700', textDecoration: 'none',
                }}>
                  Unlock Pro
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent comps */}
      {freeComps.length > 0 && (
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '0.625rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--fp-border)',
          }}>
            <div style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--fp-dim)', textTransform: 'uppercase' }}>
              Recent eBay Sales
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--fp-dim)' }}>
              {isPro
                ? `${pricing.recent_comps.length} total`
                : `3 of ${pricing.recent_comps.length} — Pro sees all`}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {freeComps.map((comp, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.625rem 0.875rem',
                background: 'var(--fp-surface-0)', border: '1px solid var(--fp-border)',
                borderRadius: 'var(--fp-radius-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--fp-dim)', flexShrink: 0, minWidth: 44 }}>
                    {formatDate(comp.sold_date)}
                  </span>
                  <span style={{
                    padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', flexShrink: 0,
                    background: 'var(--fp-surface-2)', border: '1px solid var(--fp-border)',
                    color: 'var(--fp-muted)',
                  }}>
                    {comp.condition}
                  </span>
                  {comp.listing_format === 'auction' && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--fp-accent-warm)', fontWeight: '600', flexShrink: 0 }}>
                      Auction
                    </span>
                  )}
                  <span style={{
                    fontSize: '0.78rem', color: 'var(--fp-muted)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {comp.title}
                  </span>
                </div>
                <span style={{
                  fontFamily: 'var(--fp-font-display)', fontSize: '1.1rem',
                  color: 'var(--fp-success)', letterSpacing: '0.02em', flexShrink: 0, marginLeft: '0.75rem',
                }}>
                  {formatCurrency(comp.price)}
                </span>
              </div>
            ))}
          </div>

          {/* Locked comps gate */}
          {lockedCount > 0 && (
            <div style={{
              marginTop: '0.5rem', padding: '0.875rem',
              background: 'var(--fp-surface-0)', border: '1px solid var(--fp-border)',
              borderRadius: 'var(--fp-radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--fp-muted)' }}>
                +{lockedCount} more sales hidden
              </span>
              <a href="/pro" style={{
                fontSize: '0.75rem', fontWeight: '700', color: 'var(--fp-accent)', textDecoration: 'none',
              }}>
                Unlock with Pro →
              </a>
            </div>
          )}

          <div style={{ marginTop: '0.625rem', textAlign: 'right' }}>
            <a
              href={ebaySearchUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              style={{ fontSize: '0.75rem', color: 'var(--fp-accent)', textDecoration: 'none' }}
            >
              See live eBay listings for {figureName} →
            </a>
          </div>
        </div>
      )}
    </section>
  )
}
