// MarketPanel.tsx — Zone 4: Sold price summary (no listing rows)
//
// Changelog:
//   2026-05-29: Removed individual comp rows — listing titles exposed bad matches,
//               killing credibility. Now shows total count + avg NIB / avg Loose only.
//   2026-05-12: Chart removed, eBay exit CTA removed, conditions collapsed to MOC/Loose.

import { formatCurrency } from '../_lib/figureFormatters'

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
  ebaySearchUrl: string
  figureName: string
}

function normalizeCondition(raw: string | null | undefined): 'moc' | 'loose' {
  const c = (raw ?? '').toLowerCase().trim()
  if (
    c.includes('moc') || c.includes('mib') || c.includes('misb') ||
    c.includes('sealed') || c === 'mint' || c === 'new'
  ) return 'moc'
  return 'loose'
}

function avg(arr: number[]): number {
  if (!arr.length) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function MarketPanel({ pricing, ebaySearchUrl: _ebaySearchUrl, figureName: _figureName }: MarketPanelProps) {
  if (!pricing || pricing.comp_count < 1) return null

  const comps = pricing.recent_comps
  if (!comps.length) return null

  const buckets: Record<'moc' | 'loose', number[]> = { moc: [], loose: [] }
  for (const c of comps) buckets[normalizeCondition(c.condition)].push(c.price)

  const hasMoc   = buckets.moc.length > 0
  const hasLoose = buckets.loose.length > 0

  return (
    <section>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '0.625rem', paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--fp-border)',
      }}>
        <div style={{
          fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.08em',
          color: 'var(--fp-text)', textTransform: 'uppercase',
        }}>
          Recent eBay Sales
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--fp-muted)' }}>
          {pricing.comp_count} sold
        </div>
      </div>

      {/* Condition avg pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        {hasMoc && (
          <AvgPill label="NIB" prices={buckets.moc} color="var(--fp-success)" />
        )}
        {hasLoose && (
          <AvgPill label="Loose" prices={buckets.loose} color="var(--fp-accent)" />
        )}
        {!hasMoc && !hasLoose && (
          <AvgPill label="Avg" prices={comps.map(c => c.price)} color="var(--fp-dim)" />
        )}
      </div>
    </section>
  )
}

function AvgPill({ label, prices, color }: { label: string; prices: number[]; color: string }) {
  const avgPrice = avg(prices)
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem',
      padding: '0.4rem 0.625rem',
      background: 'var(--fp-surface-0)',
      border: '1px solid var(--fp-border)',
      borderRadius: 'var(--fp-radius-sm)',
    }}>
      <span style={{
        fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
        textTransform: 'uppercase', color,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--fp-font-display)', fontSize: '0.95rem',
        color: 'var(--fp-text)', letterSpacing: '0.02em',
      }}>
        {formatCurrency(avgPrice)}
      </span>
      <span style={{ fontSize: '0.7rem', color: 'var(--fp-dim)' }}>
        avg · {prices.length} sold
      </span>
    </div>
  )
}
