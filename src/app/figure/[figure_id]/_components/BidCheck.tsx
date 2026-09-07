'use client'

// BidCheck.tsx — the verdict widget (S16, north star: Whatnot price oracle).
//
// Type the current bid → instant verdict against the New and Used medians,
// side by side, with the receipts shown (median · sales count · % delta).
// Data makes the claim; the verdict makes it instant.
//
// Voice (action-figure-expert reviewed, 6/10): sober labels in the middle
// bands where money decisions happen, community language at the extremes —
// "Steal" / "You're getting worked" (homepage H1 language, correct usage per
// the vocabulary canon). NOT full kayfabe: "heat" = crowd disapproval, so
// cute labels misuse the jargon and read as outsider marketing.
//
// Trust guardrails:
//  - A condition column with < MIN_SPLIT_COMPS sales shows an honest blank
//    ("not enough sealed sales to call it"), never a derived number. The
//    data-grounded estimate (per-line sealed premium) is a v2 matcher ask.
//  - Sparse columns (3-9 sales) carry a thin-data caveat with the count.
//  - Zero comps overall → parent doesn't render this component at all.
//  - "before shipping" microcopy: Whatnot bids exclude shipping; comps don't
//    always. Honest about the gap.
//
// Condition split mirrors MarketPanel.normalizeCondition exactly (Steve's
// 6/06 call: eBay's own language, untagged = Used). Keep the two in sync.
//
// 6/12 reskin: shelf design language (design-explorations/2026-06-12-agency/
// figure-shelf.html) — hairline frame + lit edge, kicker header, hairline
// input with gold focus ring, verdict as a gold/cream chip. Presentation
// only; logic, thresholds, wording, and verdict colors are unchanged.

import { useState } from 'react'
import { formatCurrency, MIN_COMPS_TO_QUOTE } from '../_lib/figureFormatters'
import { resolveBidColumns, columnQuotable } from '../_lib/bidCheckResolve'
import SectionH2 from './SectionH2'

interface Comp {
  price: number
  condition: string
}

interface BidCheckProps {
  comps: Comp[]
  /** Authoritative full-corpus condition buckets from the price snapshot.
   *  When the split is statistically valid (segmentation != 'pooled'), the
   *  verdict columns use THESE medians/counts instead of recomputing from the
   *  ~30-comp recent sample — so Bid Check can never contradict the placard /
   *  MarketPanel above it. Pooled figures keep the local recent-sample split
   *  (which mirrors MarketPanel's pooled path exactly). */
  segmentation?: 'split' | 'sealed-only' | 'loose-only' | 'pooled'
  sealedMedian?: number | null
  sealedCount?: number
  looseMedian?: number | null
  looseCount?: number
}

// One floor site-wide (FPPS-01 rule 2, figureFormatters.MIN_COMPS_TO_QUOTE) --
// this used to be a local `3` that happened to agree with the contract while
// the hero and passport surfaces used `>= 1` (2026-09-02).
const MIN_SPLIT_COMPS = MIN_COMPS_TO_QUOTE
const FIRM_COMPS = 10

// ── Parity helpers (mirror MarketPanel) ──────────────────────────────────────

function normalizeCondition(raw: string | null | undefined): 'new' | 'used' {
  const c = (raw ?? '').toLowerCase().trim()
  if (
    c.includes('moc') || c.includes('mib') || c.includes('misb') ||
    c.includes('sealed') || c === 'mint' || c === 'new' || c.includes('brand new')
  ) return 'new'
  return 'used'
}

// ── Verdict ──────────────────────────────────────────────────────────────────

interface Verdict {
  label: string
  color: string
  pct: number // signed % vs median: -43 = 43% under
}

function verdictFor(bid: number, med: number): Verdict {
  const ratio = bid / med
  const pct = Math.round((ratio - 1) * 100)
  if (ratio < 0.7)  return { label: 'Steal',                color: 'var(--green)',          pct }
  if (ratio < 0.9)  return { label: 'Under market',         color: 'var(--green)',          pct }
  if (ratio <= 1.1) return { label: 'Market price',         color: 'var(--fp-text)',        pct }
  if (ratio <= 1.3) return { label: 'Above market',         color: 'var(--fp-accent-warm)', pct }
  return                   { label: "You're getting worked", color: 'var(--red)',           pct }
}

function pctPhrase(pct: number): string {
  if (pct === 0) return 'right at the median'
  return pct < 0 ? `${Math.abs(pct)}% under` : `${pct}% over`
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BidCheck({
  comps,
  segmentation = 'pooled',
  sealedMedian = null,
  sealedCount = 0,
  looseMedian = null,
  looseCount = 0,
}: BidCheckProps) {
  const [raw, setRaw] = useState('')
  const bid = parseFloat(raw)
  const hasBid = !isNaN(bid) && bid > 0

  const newPrices  = comps.filter(c => normalizeCondition(c.condition) === 'new').map(c => c.price)
  const usedPrices = comps.filter(c => normalizeCondition(c.condition) === 'used').map(c => c.price)

  // Release S (2026-09-07): the snapshot's title-classified buckets are the
  // ONLY source whenever the snapshot has a split -- a thin bucket is an honest
  // blank with its count, never a number from the item-condition sample (that
  // fallback produced "Used $28 · 30 sales" beside "Loose: 1 sale" on Vader).
  // Pooled figures with no bucket data keep the sample split, labelled as such.
  const [newCol, usedCol] = resolveBidColumns({
    segmentation, sealedMedian, sealedCount, looseMedian, looseCount, newPrices, usedPrices,
  })
  const sampleNote = newCol.source === 'sample' ? ' · recent sample, eBay item condition' : ''
  const columns = [
    { ...newCol,  title: 'New',  sub: 'sealed / MOC' + sampleNote,   blank: 'Not enough sealed sales to call it' },
    { ...usedCol, title: 'Used', sub: 'loose / opened' + sampleNote, blank: 'Not enough loose sales to call it' },
  ]

  return (
    <section
      aria-label="Bid Check"
      className="fp-bidcheck"
      style={{
        position: 'relative',
        fontFamily: 'var(--fp-font-body)',
        border: '1px solid var(--shelf-line, rgba(242,232,213,.08))',
        borderRadius: 16,
        padding: '1.25rem 1.5rem 1.375rem',
        background: 'linear-gradient(180deg, rgba(242,232,213,.03), rgba(242,232,213,.008) 60%, transparent)',
        overflow: 'hidden',
      }}
    >
      {/* thin lit edge + input focus ring + staggered card rise (reduced-motion safe) */}
      <style>{`
        .fp-bidcheck::before {
          content: '';
          position: absolute;
          top: 0; left: 10%; right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(245,196,98,.45), transparent);
        }
        .fp-bidcheck-input {
          width: 7rem;
          font-family: var(--fp-font-body);
          font-size: 1.125rem;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          padding: 0.4375rem 0.75rem;
          background: rgba(242,232,213,.02);
          border: 1px solid rgba(242,232,213,.18);
          border-radius: 8px;
          color: var(--shelf-cream, #f2e8d5);
          outline: none;
          transition: border-color .2s, box-shadow .2s, background .2s;
        }
        .fp-bidcheck-input::placeholder {
          color: var(--shelf-cream-mut, rgba(242,232,213,.38));
          font-weight: 300;
        }
        .fp-bidcheck-input:hover {
          border-color: rgba(242,232,213,.28);
        }
        .fp-bidcheck-input:focus {
          border-color: var(--shelf-gold, #e0a83e);
          box-shadow: 0 0 0 3px rgba(224,168,62,.16);
          background: rgba(224,168,62,.04);
        }
        @keyframes fpBidcheckRise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }
        .fp-bidcheck-card {
          animation: fpBidcheckRise .55s cubic-bezier(.22,.61,.36,1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .fp-bidcheck-card { animation: none; }
          .fp-bidcheck-input { transition: none; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
        <SectionH2 lead="Bid" accent="Check" />
        <span style={{ fontSize: '0.8125rem', fontWeight: 300, color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))' }}>
          what&rsquo;s the current bid?
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.875rem 0 1.125rem' }}>
        <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))' }}>$</span>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={raw}
          onChange={e => setRaw(e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder="Enter bid"
          aria-label="Current bid in dollars"
          className="fp-bidcheck-input"
        />
        <span style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.14em', textTransform: 'uppercase',
                       color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))' }}>
          before shipping
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
        {columns.map((col, i) => {
          const n = col.n
          const med = col.med
          const enough = columnQuotable(col)
          const v = enough && hasBid ? verdictFor(bid, med) : null
          return (
            <div key={col.key} className="fp-bidcheck-card" style={{
              border: '1px solid var(--shelf-line, rgba(242,232,213,.08))',
              borderRadius: 12,
              padding: '0.875rem 1rem 0.9375rem',
              animationDelay: `${0.08 + i * 0.09}s`,
            }}>
              <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.18em',
                            textTransform: 'uppercase', color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))' }}>
                {col.title} <span style={{ fontWeight: 400, color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))' }}>· {col.sub}</span>
              </div>

              {!enough ? (
                <div style={{ fontSize: '0.8125rem', fontWeight: 300, lineHeight: 1.6,
                              color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))', marginTop: '0.5rem' }}>
                  {col.blank}{n > 0 ? ` — ${n} sale${n > 1 ? 's' : ''} on record, needs ${MIN_SPLIT_COMPS}` : ''}
                </div>
              ) : (
                <>
                  {v && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      marginTop: '0.625rem',
                      padding: '0.3125rem 0.875rem',
                      border: '1px solid var(--shelf-line-gold, rgba(224,168,62,.20))',
                      borderRadius: 999,
                      background: 'linear-gradient(180deg, rgba(224,168,62,.08), rgba(224,168,62,.02))',
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                      lineHeight: 1.3,
                      color: v.color,
                    }}>
                      {v.label}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.6,
                                fontVariantNumeric: 'tabular-nums',
                                color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))',
                                marginTop: v ? '0.4375rem' : '0.5rem' }}>
                    Median {formatCurrency(med)} · {n} sale{n !== 1 ? 's' : ''}
                    {v && <> · your bid is {pctPhrase(v.pct)}</>}
                  </div>
                  {n < FIRM_COMPS && (
                    <div style={{ fontSize: '0.6875rem', fontWeight: 300,
                                  color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))', marginTop: '0.3125rem' }}>
                      Thin data — read as a range, not a line
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
