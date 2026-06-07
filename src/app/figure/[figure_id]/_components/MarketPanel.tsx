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

// New vs Used, in eBay's own language (Steve's call 2026-06-06).
// New  = brand new / sealed / MOC / MIB / MISB / mint.
// Used = pre-owned / loose AND untagged ("None") — most untagged secondhand
//        sales are effectively used, so they fall here rather than inflating New.
function normalizeCondition(raw: string | null | undefined): 'new' | 'used' {
  const c = (raw ?? '').toLowerCase().trim()
  if (
    c.includes('moc') || c.includes('mib') || c.includes('misb') ||
    c.includes('sealed') || c === 'mint' || c === 'new' || c.includes('brand new')
  ) return 'new'
  return 'used'
}

function median(arr: number[]): number {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

// Only show a per-condition figure when it has enough real sales to be meaningful.
const MIN_SPLIT_COMPS = 3

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function MarketPanel({ pricing, ebaySearchUrl: _ebaySearchUrl, figureName: _figureName }: MarketPanelProps) {
  if (!pricing || pricing.comp_count < 1) return null

  const comps = pricing.recent_comps
  if (!comps.length) return null

  const buckets: Record<'new' | 'used', number[]> = { new: [], used: [] }
  for (const c of comps) buckets[normalizeCondition(c.condition)].push(c.price)

  // Only surface a condition median when it has ≥3 real sales — below that a
  // single anomalous sale would misrepresent the condition's market.
  const showNew  = buckets.new.length  >= MIN_SPLIT_COMPS
  const showUsed = buckets.used.length >= MIN_SPLIT_COMPS

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

      {/* New vs Used median pills. Each shows only with ≥3 tagged sales; the
          overall median (in the ValueStrip above) remains the anchor number. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        {showNew && (
          <ConditionPill label="New" prices={buckets.new} color="var(--fp-success)" />
        )}
        {showUsed && (
          <ConditionPill label="Used" prices={buckets.used} color="var(--fp-accent)" />
        )}
        {!showNew && !showUsed && (
          // Not enough tagged sales in either bucket to split honestly — show the
          // blended median so the panel still says something true.
          <ConditionPill label="All" prices={comps.map(c => c.price)} color="var(--fp-dim)" />
        )}
      </div>
    </section>
  )
}

function ConditionPill({ label, prices, color }: { label: string; prices: number[]; color: string }) {
  const med = median(prices)
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
        {formatCurrency(med)}
      </span>
      <span style={{ fontSize: '0.7rem', color: 'var(--fp-dim)' }}>
        median · {prices.length} sold
      </span>
    </div>
  )
}
