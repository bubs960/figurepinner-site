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

import { useState } from 'react'
import { formatCurrency } from '../_lib/figureFormatters'

interface Comp {
  price: number
  condition: string
}

interface BidCheckProps {
  comps: Comp[]
}

const MIN_SPLIT_COMPS = 3
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

function median(arr: number[]): number {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
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

export default function BidCheck({ comps }: BidCheckProps) {
  const [raw, setRaw] = useState('')
  const bid = parseFloat(raw)
  const hasBid = !isNaN(bid) && bid > 0

  const newPrices  = comps.filter(c => normalizeCondition(c.condition) === 'new').map(c => c.price)
  const usedPrices = comps.filter(c => normalizeCondition(c.condition) === 'used').map(c => c.price)

  const columns = [
    { key: 'new',  title: 'New',  sub: 'sealed / MOC', prices: newPrices,
      blank: 'Not enough sealed sales to call it' },
    { key: 'used', title: 'Used', sub: 'loose / opened', prices: usedPrices,
      blank: 'Not enough loose sales to call it' },
  ]

  return (
    <section
      aria-label="Bid Check"
      style={{
        background: 'var(--fp-surface-0)',
        border: '1px solid var(--fp-border)',
        borderRadius: 12,
        padding: '1rem 1.125rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.625rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.06em',
                     textTransform: 'uppercase', color: 'var(--fp-text)', margin: 0 }}>
          Bid Check
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--fp-muted)' }}>
          what&rsquo;s the current bid?
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', margin: '0.625rem 0 0.875rem' }}>
        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--fp-muted)' }}>$</span>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={raw}
          onChange={e => setRaw(e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder="Enter bid"
          aria-label="Current bid in dollars"
          style={{
            width: '7rem',
            fontSize: '1.125rem',
            fontWeight: 700,
            padding: '0.375rem 0.625rem',
            background: 'var(--fp-surface-1, transparent)',
            border: '1px solid var(--fp-border)',
            borderRadius: 8,
            color: 'var(--fp-text)',
            outline: 'none',
          }}
        />
        <span style={{ fontSize: '0.6875rem', color: 'var(--fp-muted)' }}>before shipping</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
        {columns.map(col => {
          const n = col.prices.length
          const med = median(col.prices)
          const enough = n >= MIN_SPLIT_COMPS
          const v = enough && hasBid ? verdictFor(bid, med) : null
          return (
            <div key={col.key} style={{
              border: '1px solid var(--fp-border)',
              borderRadius: 10,
              padding: '0.75rem 0.875rem',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fp-text)' }}>
                {col.title} <span style={{ fontWeight: 500, color: 'var(--fp-muted)' }}>· {col.sub}</span>
              </div>

              {!enough ? (
                <div style={{ fontSize: '0.78125rem', color: 'var(--fp-muted)', marginTop: '0.5rem' }}>
                  {col.blank}{n > 0 ? ` (${n} sale${n > 1 ? 's' : ''} on record)` : ''}
                </div>
              ) : (
                <>
                  {v && (
                    <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: v.color, marginTop: '0.375rem' }}>
                      {v.label}
                    </div>
                  )}
                  <div style={{ fontSize: '0.78125rem', color: 'var(--fp-muted)', marginTop: v ? '0.25rem' : '0.5rem' }}>
                    Median {formatCurrency(med)} · {n} sale{n !== 1 ? 's' : ''}
                    {v && <> · your bid is {pctPhrase(v.pct)}</>}
                  </div>
                  {n < FIRM_COMPS && (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--fp-muted)', marginTop: '0.25rem' }}>
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
