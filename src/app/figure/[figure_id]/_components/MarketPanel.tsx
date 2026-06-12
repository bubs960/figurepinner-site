// MarketPanel.tsx — Zone 4: Sold price summary (no listing rows)
//
// Changelog:
//   2026-06-12: Ported to the shelf design language — kicker header over a gold
//               hairline, condition medians as hairline ledger rows with dotted
//               leaders + gold SOLD chips, prices in display font at modest size.
//               Data fields, labels, and all conditional logic unchanged.
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

/** Full-corpus condition buckets from the price snapshot — when present
 *  (segmentation != 'pooled') they replace the local 30-comp approximation
 *  so this panel can never contradict the placard above it. */
interface SnapshotBuckets {
  segmentation: 'split' | 'sealed-only' | 'loose-only'
  sealed: { median: number | null; count: number } | null
  loose: { median: number | null; count: number } | null
}

interface MarketPanelProps {
  pricing: Pricing | null
  ebaySearchUrl: string
  figureName: string
  buckets?: SnapshotBuckets | null
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
export default function MarketPanel({ pricing, ebaySearchUrl: _ebaySearchUrl, figureName: _figureName, buckets: snapshotBuckets }: MarketPanelProps) {
  if (!pricing || pricing.comp_count < 1) return null

  const comps = pricing.recent_comps
  if (!comps.length) return null

  // Snapshot buckets win: full-corpus medians, same numbers as the placard.
  const sealedRow = snapshotBuckets?.sealed && snapshotBuckets.sealed.median != null
    ? { median: snapshotBuckets.sealed.median, count: snapshotBuckets.sealed.count }
    : null
  const looseRow = snapshotBuckets?.loose && snapshotBuckets.loose.median != null
    ? { median: snapshotBuckets.loose.median, count: snapshotBuckets.loose.count }
    : null
  const useSnapshot = Boolean(sealedRow || looseRow)

  const localBuckets: Record<'new' | 'used', number[]> = { new: [], used: [] }
  for (const c of comps) localBuckets[normalizeCondition(c.condition)].push(c.price)

  // Only surface a condition median when it has ≥3 real sales — below that a
  // single anomalous sale would misrepresent the condition's market.
  const showNew  = !useSnapshot && localBuckets.new.length  >= MIN_SPLIT_COMPS
  const showUsed = !useSnapshot && localBuckets.used.length >= MIN_SPLIT_COMPS

  return (
    <section>
      <style>{`
        @keyframes fpMarketLedgerIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .fp-marketledger-row{opacity:0;animation:fpMarketLedgerIn .55s cubic-bezier(.22,.61,.36,1) both}
        .fp-marketledger-row:nth-child(2){animation-delay:.09s}
        .fp-marketledger-row:nth-child(3){animation-delay:.18s}
        @media (prefers-reduced-motion: reduce){
          .fp-marketledger-row{animation:none;opacity:1}
        }
      `}</style>

      {/* Header — kicker over a gold hairline */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        paddingBottom: '0.55rem',
        borderBottom: '1px solid var(--shelf-line-gold, rgba(224,168,62,.20))',
      }}>
        <div style={{
          fontFamily: 'var(--fp-font-body)',
          fontSize: '10px', fontWeight: 500, letterSpacing: '0.22em',
          color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))', textTransform: 'uppercase',
        }}>
          Recent eBay Sales
        </div>
        <div style={{
          fontSize: '12px', fontWeight: 400,
          color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {pricing.comp_count} sold
        </div>
      </div>

      {/* Condition median ledger rows. Snapshot buckets (full corpus, same
          source as the placard) when the split is statistically valid;
          otherwise the legacy local approximation from the recent comps. */}
      <div>
        {sealedRow && (
          <LedgerRow label="Sealed / Carded" median={sealedRow.median} count={sealedRow.count} />
        )}
        {looseRow && (
          <LedgerRow label="Loose" median={looseRow.median} count={looseRow.count} />
        )}
        {showNew && (
          <LedgerRow label="New" median={median(localBuckets.new)} count={localBuckets.new.length} />
        )}
        {showUsed && (
          <LedgerRow label="Used" median={median(localBuckets.used)} count={localBuckets.used.length} />
        )}
        {!useSnapshot && !showNew && !showUsed && (
          // Not enough tagged sales in either bucket to split honestly — show the
          // blended median so the panel still says something true.
          <LedgerRow label="All" median={median(comps.map(c => c.price))} count={comps.length} />
        )}
      </div>
    </section>
  )
}

function LedgerRow({ label, median: med, count }: { label: string; median: number; count: number }) {
  return (
    <div
      className="fp-marketledger-row"
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.7rem 0 0.65rem',
        borderBottom: '1px solid var(--shelf-line, rgba(242,232,213,.08))',
      }}
    >
      {/* condition label — quiet uppercase kicker */}
      <span style={{
        fontFamily: 'var(--fp-font-body)',
        fontSize: '10px', fontWeight: 500, letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>

      {/* dotted leader */}
      <span aria-hidden="true" style={{
        flex: '1 1 auto', minWidth: '16px',
        borderBottom: '1px dotted rgba(242,232,213,.18)',
        transform: 'translateY(-3px)',
      }} />

      {/* gold SOLD chip — comp depth behind this row's number */}
      <span style={{
        fontFamily: 'var(--fp-font-body)',
        fontSize: '9px', fontWeight: 600, letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: '#1a1206',
        background: 'var(--shelf-gold, #e0a83e)',
        borderRadius: '3px', padding: '3px 7px',
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {count} sold
      </span>

      {/* median price — display font, modest size (numbers support, never shout) */}
      <span style={{
        fontFamily: 'var(--fp-font-display)',
        fontSize: '19px', lineHeight: 1, letterSpacing: '0.03em',
        color: 'var(--shelf-cream, #f2e8d5)',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}>
        {formatCurrency(med)}
      </span>
      <span style={{
        fontFamily: 'var(--fp-font-body)',
        fontSize: '9px', fontWeight: 500, letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))',
        whiteSpace: 'nowrap',
      }}>
        median
      </span>
    </div>
  )
}
