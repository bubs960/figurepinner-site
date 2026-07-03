'use client'

// MarketPanel.tsx — Zone 4: Sold price summary (no listing rows)
//
// Changelog:
//   2026-07-02: Added an expandable "See the comps" list (WP1, price-receipt
//               feature) — price + condition + sold date per comp, deliberately
//               NO listing title, so it can't reintroduce the exact problem
//               2026-05-29 removed titles for. Fires price_receipt_open on open.
//   2026-06-12: Ported to the shelf design language — kicker header over a gold
//               hairline, condition medians as hairline ledger rows with dotted
//               leaders + gold SOLD chips, prices in display font at modest size.
//               Data fields, labels, and all conditional logic unchanged.
//   2026-05-29: Removed individual comp rows — listing titles exposed bad matches,
//               killing credibility. Now shows total count + avg NIB / avg Loose only.
//   2026-05-12: Chart removed, eBay exit CTA removed, conditions collapsed to MOC/Loose.

import { useState } from 'react'
import { formatCurrency, formatDate } from '../_lib/figureFormatters'
import { trackFunnel } from '@/app/_lib/funnelClient'

interface Comp {
  title: string
  price: number
  sold_date: string
  condition: string
  listing_format?: string
}

interface Pricing {
  median: number | null
  /** True when `median` is actually the average (snapshot had no median_sold) —
   *  the "All" ledger row label must say so (S55 FTC audit). */
  medianIsAvg?: boolean
  comp_count: number
  chart_points: Array<{ date: string; price: number }>
  recent_comps: Comp[]
}

/** Full-corpus condition buckets from the price snapshot. These are the
 *  authoritative numbers (same source the placard + vault read); a bucket with
 *  enough comps replaces the local 30-comp approximation so this panel never
 *  shows a condition median the rest of the app contradicts. Passed for ALL
 *  segmentations incl. pooled — a thin bucket (< MIN_SPLIT_COMPS) is ignored
 *  per-bucket below, falling back to the blended view. */
interface SnapshotBuckets {
  segmentation: 'split' | 'sealed-only' | 'loose-only' | 'pooled'
  sealed: { median: number | null; count: number } | null
  loose: { median: number | null; count: number } | null
}

interface MarketPanelProps {
  pricing: Pricing | null
  ebaySearchUrl: string
  figureName: string
  buckets?: SnapshotBuckets | null
}

function median(arr: number[]): number {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- ebaySearchUrl kept in the prop contract, unused here
export default function MarketPanel({ pricing, ebaySearchUrl: _ebaySearchUrl, figureName, buckets: snapshotBuckets }: MarketPanelProps) {
  const [showComps, setShowComps] = useState(false)

  if (!pricing || pricing.comp_count < 1) return null

  const comps = pricing.recent_comps
  if (!comps.length) return null

  // Most recent first; cap the visible list — this is supplementary evidence
  // for the median above, not a full listing browser.
  const compRows = [...comps]
    .sort((a, b) => (b.sold_date || '').localeCompare(a.sold_date || ''))
    .slice(0, 15)

  function toggleComps() {
    const next = !showComps
    setShowComps(next)
    if (next) trackFunnel('price_receipt_open', { figure_name: figureName, comp_count: comps.length })
  }

  // Show the condition split ONLY when the snapshot says it is statistically
  // valid — segmentation split / sealed-only / loose-only — the SAME gate the
  // vault (vaultData.conditionMatchedMedian) and the placard (FigureDetailContent
  // headlineBucket) use. So all three valuation surfaces agree on a figure. A
  // 'pooled' figure falls through to the blended median below — exactly what the
  // placard and vault show for it.
  //
  // (Was a count-based ≥3 gate that fired even under 'pooled', surfacing a
  // sealed/loose split that the placard + vault blended away — the cross-surface
  // contradiction standalone flagged. The local recent-sample split is dropped
  // entirely: it is exactly the divergent local recompute P1 moved off of. 2026-06-14.)
  const seg = snapshotBuckets?.segmentation ?? 'pooled'
  const sealedRow = snapshotBuckets?.sealed && (seg === 'split' || seg === 'sealed-only') && snapshotBuckets.sealed.median != null
    ? { median: snapshotBuckets.sealed.median, count: snapshotBuckets.sealed.count }
    : null
  const looseRow = snapshotBuckets?.loose && (seg === 'split' || seg === 'loose-only') && snapshotBuckets.loose.median != null
    ? { median: snapshotBuckets.loose.median, count: snapshotBuckets.loose.count }
    : null
  const useSnapshot = Boolean(sealedRow || looseRow)

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
        .fp-comps-toggle{
          background:none;border:none;cursor:pointer;padding:0.6rem 0 0.2rem;
          font-family:var(--fp-font-body);font-size:11px;font-weight:600;
          letter-spacing:0.1em;text-transform:uppercase;
          color:var(--shelf-gold,#e0a83e);
        }
        .fp-comps-toggle:hover{color:var(--shelf-gold-hi,#f5c462)}
        .fp-comps-list{
          overflow:hidden;max-height:0;opacity:0;
          transition:max-height 0.3s ease,opacity 0.25s ease;
        }
        .fp-comps-list.open{max-height:600px;opacity:1}
        @media (prefers-reduced-motion: reduce){
          .fp-comps-list{transition:none}
        }
        .fp-comp-row{
          display:flex;align-items:center;gap:0.75rem;padding:0.4rem 0;
          font-family:var(--fp-font-body);font-size:11.5px;
          border-bottom:1px solid var(--shelf-line,rgba(242,232,213,.06));
        }
        .fp-comp-date{color:var(--shelf-cream-mut,rgba(242,232,213,.5));min-width:3.6em}
        .fp-comp-condition{
          color:var(--shelf-cream-dim,rgba(242,232,213,.7));flex:1 1 auto;
          text-transform:capitalize;
        }
        .fp-comp-price{
          font-family:var(--fp-font-display);color:var(--shelf-cream,#f2e8d5);
          font-variant-numeric:tabular-nums;
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
        {!useSnapshot && (
          // Pooled / no statistically valid split — the blended median, identical
          // to the placard + vault. Full-corpus snapshot median when present;
          // local-comp median only as a last resort if the snapshot carries none.
          <LedgerRow
            label="All"
            median={pricing.median ?? median(comps.map(c => c.price))}
            count={pricing.median != null ? pricing.comp_count : comps.length}
            stat={pricing.median != null && pricing.medianIsAvg ? 'avg' : 'median'}
          />
        )}
      </div>

      {/* Expandable comp list — price/condition/date only, deliberately no
          listing title (see 2026-05-29 changelog entry above). */}
      <button
        type="button"
        className="fp-comps-toggle"
        onClick={toggleComps}
        aria-expanded={showComps}
      >
        {showComps ? 'Hide the comps ▴' : 'See the comps ▾'}
      </button>
      <div className={`fp-comps-list${showComps ? ' open' : ''}`}>
        {compRows.map((c, i) => (
          <div className="fp-comp-row" key={`${c.sold_date}-${i}`}>
            <span className="fp-comp-date">{formatDate(c.sold_date)}</span>
            <span className="fp-comp-condition">{c.condition}</span>
            <span className="fp-comp-price">{formatCurrency(c.price)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function LedgerRow({ label, median: med, count, stat = 'median' }: { label: string; median: number; count: number; stat?: 'median' | 'avg' }) {
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
        {stat}
      </span>
    </div>
  )
}
