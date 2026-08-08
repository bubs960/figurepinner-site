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
import LiquidSparkline from './LiquidSparkline'
import { derivePriceContract, INSUFFICIENT_COMPS_LABEL } from '../_lib/priceContract'

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
  /** Same number the page's own JSON-LD already claims (valuePricing.trend_90d_pct,
   *  passed to SeoSummary too) — the sparkline's momentum droplet reuses it rather
   *  than computing a second, differently-windowed "trend" that could disagree. */
  trendPct?: number | null
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- ebaySearchUrl kept in the prop contract, unused here
export default function MarketPanel({ pricing, ebaySearchUrl: _ebaySearchUrl, figureName, buckets: snapshotBuckets, trendPct = null }: MarketPanelProps) {
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

  // FPPS-01 (2026-07-15, Steve's binding decisions): this panel is THE
  // surface webaudit flagged for the pooled "$180 · MEDIAN SOLD · 50 COMPS"
  // pattern. Each row's NUMBER runs through the same 10+/3-9/<3 comp-count
  // tier as every other price surface, via derivePriceContract -- a thin
  // bucket (3-9 comps) gets a "Thin data" chip instead of a plain "sold"
  // chip, and a suppressed bucket (<3 comps) renders NO number, just the
  // insufficient-comps state, rather than falling through to the pooled blend.
  //
  // Census-addendum transparent-split fix (2026-07-17): sealed/loose used to
  // be gated on `segmentation === 'split'` (etc.) before being passed in --
  // for the 3,839-fid affected population (segmentation 'pooled' but real
  // sealed+loose buckets both exist underneath), that nulled BOTH buckets out
  // and fell straight through to the blended "All" row, directly contradicting
  // HeroBand's headline immediately above it on the same page (the exact bug
  // 13b0cf6 already fixed for the headline -- this panel was the one surface
  // still gating on the raw segmentation label instead of real bucket
  // presence, same class as the fixed HeroBand ticket-let). derivePriceContract
  // itself already gates per-bucket on presence (median != null && count >= 1,
  // see priceContract.ts) -- passing the raw buckets unconditionally, same as
  // HeroBand/CollectionPanel/SeoSummary/meta description all already do via
  // jsonLdPriceContract, is the fix; no second gate needed here.
  const seg = snapshotBuckets?.segmentation ?? 'pooled'
  const contract = derivePriceContract({
    soldCount: pricing.comp_count,
    medianSold: pricing.median,
    avgSold: null,
    segmentation: seg,
    sealed: snapshotBuckets?.sealed ?? null,
    loose: snapshotBuckets?.loose ?? null,
  })
  const sealedRow = contract.sealed
  const looseRow = contract.loose
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
        .fp-comp-date{color:var(--shelf-cream-mut,rgba(242,232,213,.38));min-width:3.6em}
        .fp-comp-condition{
          color:var(--shelf-cream-dim,rgba(242,232,213,.60));flex:1 1 auto;
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
        <h2 style={{
          fontFamily: 'var(--fp-font-body)',
          fontSize: '10px', fontWeight: 500, letterSpacing: '0.22em',
          color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))', textTransform: 'uppercase',
          margin: 0,
        }}>
          Recent eBay Sales
        </h2>
        <div style={{
          fontSize: '12px', fontWeight: 400,
          color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {pricing.comp_count} sold
        </div>
      </div>

      {/* Hero sparkline — the real sold-comp price line, P2.2 spec.
          Session 1 (surface) only: static gold stroke. Session 2 adds the
          liquid treatment (pour-in, shimmer, wobble, momentum droplet). */}
      <LiquidSparkline soldHistory={comps} trendPct={trendPct} />

      {/* Condition median ledger rows. Snapshot buckets (full corpus, same
          source as the placard) when the split is statistically valid;
          otherwise the legacy local approximation from the recent comps.
          FPPS-01: each row is now tier-aware -- 10+ comps renders plain,
          3-9 comps renders with a "Thin data" chip, <3 comps renders NO
          number (INSUFFICIENT_COMPS_LABEL instead), per bucket. */}
      <div>
        {sealedRow && (
          sealedRow.median != null
            ? <LedgerRow label="Sealed / Carded" median={sealedRow.median} count={sealedRow.count} thin={sealedRow.needsThinDataLabel} tone="gold" />
            : <SuppressedRow label="Sealed / Carded" count={sealedRow.count} />
        )}
        {looseRow && (
          looseRow.median != null
            ? <LedgerRow label="Loose" median={looseRow.median} count={looseRow.count} thin={looseRow.needsThinDataLabel} tone="red" />
            : <SuppressedRow label="Loose" count={looseRow.count} />
        )}
        {!useSnapshot && contract.pooled && (
          // No statistically valid condition split at all — the blended
          // median, identical to the placard + vault. Still tier-gated: a
          // pooled figure with <3 total comps suppresses here too.
          contract.pooled.median != null
            ? <LedgerRow
                label="All"
                median={contract.pooled.median}
                count={pricing.comp_count}
                stat={contract.pooled.isAvg ? 'avg' : 'median'}
                thin={contract.pooled.needsThinDataLabel}
              />
            : <SuppressedRow label="All" count={pricing.comp_count} />
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

function LedgerRow({ label, median: med, count, stat = 'median', thin = false, tone }: { label: string; median: number; count: number; stat?: 'median' | 'avg'; thin?: boolean; tone?: 'gold' | 'red' }) {
  return (
    <div
      className="fp-marketledger-row"
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.7rem 0 0.65rem',
        borderBottom: '1px solid var(--shelf-line, rgba(242,232,213,.08))',
      }}
    >
      {/* condition label — quiet uppercase kicker. Colored to match HeroBand's
          per-condition label treatment (row.key === 'loose' ? red-hi : gold-hi)
          when this row IS a real condition (sealed/loose); the pooled "All"
          row passes no tone and stays neutral cream, since there's no
          condition being distinguished there. */}
      <span style={{
        fontFamily: 'var(--fp-font-body)',
        fontSize: '10px', fontWeight: 500, letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: tone === 'red' ? 'var(--fp-danger-hi, #F97075)'
          : tone === 'gold' ? 'var(--shelf-gold-hi, #f5c462)'
          : 'var(--shelf-cream-dim, rgba(242,232,213,.60))',
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

      {/* SOLD chip — comp depth behind this row's number. Steve, 2026-07-16:
          this chip was hardcoded gold regardless of condition, while the
          top-of-page HeroBand placard colors loose=red / sealed=gold (same
          --fp-danger-hi / --shelf-gold tokens as ConditionShineBox) — a reader
          scrolling from the placard to this panel saw the same figure's loose
          row switch from red to gold with no reason. Matched here. Text stays
          the same near-black (#1a1206) on both — computed contrast against
          --fp-danger-hi is 6.7:1 (vs --shelf-gold's 8.7:1), both comfortably
          clear AA's 4.5:1 for this size; the base (non-hi) red token was
          checked too and only clears it narrowly (4.7:1), which is why -hi
          was picked over base despite gold using its base variant. */}
      <span style={{
        fontFamily: 'var(--fp-font-body)',
        fontSize: '9px', fontWeight: 600, letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: '#1a1206',
        background: tone === 'red' ? 'var(--fp-danger-hi, #F97075)' : 'var(--shelf-gold, #e0a83e)',
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

      {/* FPPS-01: 3-9 comp tier requires a "thin data" label wherever this
          number renders (Steve's binding decision 2) -- same caution the
          Hogan page's sealed bucket already carried, now applied everywhere. */}
      {thin && (
        <span style={{
          fontFamily: 'var(--fp-font-body)',
          fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))',
          border: '1px solid rgba(242,232,213,.22)',
          borderRadius: '3px', padding: '2px 6px',
          whiteSpace: 'nowrap',
        }}>
          Thin data
        </span>
      )}
    </div>
  )
}

/** Under-3-comp state (Steve's decision 2): NO number renders, ever, for a
 *  bucket this thin -- this row exists so the condition is still named
 *  (so the layout doesn't silently vanish a whole condition) without ever
 *  computing or displaying a median from 1-2 sales. */
function SuppressedRow({ label, count }: { label: string; count: number }) {
  return (
    <div
      className="fp-marketledger-row"
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.7rem 0 0.65rem',
        borderBottom: '1px solid var(--shelf-line, rgba(242,232,213,.08))',
      }}
    >
      <span style={{
        fontFamily: 'var(--fp-font-body)',
        fontSize: '10px', fontWeight: 500, letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <span aria-hidden="true" style={{
        flex: '1 1 auto', minWidth: '16px',
        borderBottom: '1px dotted rgba(242,232,213,.18)',
        transform: 'translateY(-3px)',
      }} />
      <span style={{
        fontFamily: 'var(--fp-font-body)',
        fontSize: '11px', fontWeight: 400, fontStyle: 'italic',
        color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))',
        whiteSpace: 'nowrap',
      }}>
        {INSUFFICIENT_COMPS_LABEL} ({count})
      </span>
    </div>
  )
}
