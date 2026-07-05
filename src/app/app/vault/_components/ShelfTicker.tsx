'use client'
// ShelfTicker — WP4 (wow-feature package, 2026-07-05). Vault header widget:
// "Your shelf: $4,218 ▲ 3.2%" derived from real 30-day sold-price movement,
// not cost-basis gain (VaultStats already covers paid-vs-value). Reuses WP1
// plumbing: same r2proxy snapshot fetch as every other vault/figure price
// panel, no new data source, no D1 in the render path.
//
// Honesty rule (mirrors Bid Check / VaultCase's own gates): a shelf with zero
// items carrying a computable trend renders "not enough sold history yet",
// never a fabricated 0.0%. The coverage count is shown alongside the delta
// so a 1-of-40-items number never reads as shelf-wide.

import { useState } from 'react'
import type { ShelfMover } from '../_lib/vaultData'
import { trackFunnel } from '@/app/_lib/funnelClient'

type Props = {
  estValue: number
  trend30d: number | null
  coverage: number
  figures: number
  topMovers: ShelfMover[]
}

export default function ShelfTicker({ estValue, trend30d, coverage, figures, topMovers }: Props) {
  const [open, setOpen] = useState(false)

  const hasTrend = trend30d != null && coverage > 0
  const pct = hasTrend && estValue > 0 ? (trend30d! / estValue) * 100 : null

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) trackFunnel('shelf_ticker_open', { figures, coverage })
  }

  return (
    <div className="fp-shelf-ticker">
      <style>{`
        .fp-shelf-ticker { font-family: var(--fp-font-body); margin: 0.5rem 0 1rem; }
        .fp-st-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.4375rem 0.875rem; border-radius: 999px; cursor: pointer;
          border: 1px solid var(--shelf-line, rgba(242,232,213,.08));
          background: linear-gradient(180deg, rgba(242,232,213,.03), rgba(242,232,213,.008) 60%, transparent);
          color: var(--shelf-cream-dim, rgba(242,232,213,.60));
          font-size: 0.8125rem; font-weight: 400;
        }
        .fp-st-btn:hover { border-color: rgba(242,232,213,.18); }
        .fp-st-label { color: var(--shelf-cream-mut, rgba(242,232,213,.38)); }
        .fp-st-delta.up { color: var(--green); }
        .fp-st-delta.dn { color: var(--red); }
        .fp-st-cov { font-size: 0.6875rem; color: var(--shelf-cream-mut, rgba(242,232,213,.38)); }
        .fp-st-panel {
          margin-top: 0.5rem; padding: 0.75rem 1rem; border-radius: 12px;
          border: 1px solid var(--shelf-line, rgba(242,232,213,.08));
          background: rgba(242,232,213,.02);
          display: flex; flex-direction: column; gap: 0.5rem;
          max-width: 26rem;
        }
        .fp-st-mover { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.8125rem; }
        .fp-st-mover-name { color: var(--shelf-cream-dim, rgba(242,232,213,.60)); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fp-st-mover-delta { font-variant-numeric: tabular-nums; flex-shrink: 0; }
      `}</style>

      <button
        type="button"
        className="fp-st-btn"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className="fp-st-label">Your shelf, 30 days:</span>
        {hasTrend ? (
          <>
            <span className={`fp-st-delta ${trend30d! >= 0 ? 'up' : 'dn'}`}>
              {trend30d! >= 0 ? '▲' : '▼'} ${Math.abs(trend30d!).toFixed(2)}
              {pct != null && <> ({trend30d! >= 0 ? '+' : '−'}{Math.abs(pct).toFixed(1)}%)</>}
            </span>
            <span className="fp-st-cov">({coverage} of {figures} priced this window)</span>
          </>
        ) : (
          <span className="fp-st-cov">not enough sold history yet for a trend</span>
        )}
      </button>

      {open && hasTrend && (
        <div className="fp-st-panel">
          <div className="fp-st-label" style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Top movers
          </div>
          {topMovers.map(m => (
            <a key={m.fid} className="fp-st-mover" href={m.href}>
              <span className="fp-st-mover-name">{m.name}</span>
              <span className={`fp-st-mover-delta ${m.delta >= 0 ? 'fp-st-delta up' : 'fp-st-delta dn'}`}>
                {m.delta >= 0 ? '▲' : '▼'} ${Math.abs(m.delta).toFixed(2)}
                {m.pct != null && <> ({m.delta >= 0 ? '+' : '−'}{Math.abs(m.pct).toFixed(0)}%)</>}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
