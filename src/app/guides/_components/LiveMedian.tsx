'use client'

// LiveMedian — the Bid Check differentiator inside the indexable guide format.
//
// A guide cites a figure's real sold median; this renders it LIVE from the
// r2proxy price-summaries snapshot (the same data the figure page + price-check
// API read), so the number self-updates and no competitor can fake it. The
// prose around it carries the story; this carries the current truth.
//
// Server-side data: `fetchPriceSnaps()` (now in `../_lib/priceSnaps.ts` — see
// that file's header for why it had to move out of this one) is called once
// by the page (async) for every `comp` block's fid and the result map is
// passed down as plain props, so this stays a thin client leaf (needed now
// for the tracked eBay click). The fetch is ISR-cached at 1h so the page
// shell can stay static while the medians refresh hourly. A fid with no
// comps renders an honest blank, never a derived number (S16 honest-blanks
// rule).
//
// 2026-07-02: added a direct eBay affiliate CTA (ebayUrl) + trackFunnel
// ebay_exit on click — these pages previously had NO affiliate link at all
// (ad units only), so there was nothing to compare against ad performance.
// This is the instrumentation the comparison needs; the comparison itself
// waits on a real data-collection window.

import { trackFunnel } from '@/app/_lib/funnelClient'
import type { PriceSnap } from '../_lib/priceSnaps'

function fmtMoney(n: number): string {
  const hasCents = Math.round(n * 100) % 100 !== 0
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  })}`
}

export default function LiveMedian({
  snap,
  label,
  sublabel,
  href,
  ebayUrl,
  figureId,
}: {
  snap?: PriceSnap | null
  label: string
  sublabel?: string
  href?: string
  ebayUrl?: string
  figureId?: string
}) {
  const median = snap ? (snap.median_sold ?? snap.avg_sold) : null
  // Label truthfulness (S55 FTC audit): when a snapshot has no median_sold the
  // number shown is the average — say so instead of calling it a median.
  const stat = snap?.median_sold != null ? 'median' : 'avg'
  const n = snap?.sold_count ?? 0
  const hasData = median !== null && n > 0

  function onEbayClick() {
    trackFunnel('ebay_exit', { figureId: figureId ?? '', target: 'guide_bidcheck' })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        margin: '0 0 0.875rem',
        padding: '0.875rem 1.125rem',
        border: '1px solid var(--border)',
        borderRadius: 'var(--fp-radius, 10px)',
        background: 'var(--fp-surface-1, var(--s1))',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: 'var(--fp-text)', fontSize: '0.98rem', lineHeight: 1.35 }}>{label}</div>
        {sublabel && (
          <div style={{ fontSize: '0.82rem', color: 'var(--fp-muted)', marginTop: '0.15rem' }}>{sublabel}</div>
        )}
        <div style={{ display: 'flex', gap: '0.9rem', marginTop: '0.35rem' }}>
          {href && (
            <a
              href={href}
              style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--fp-accent)', textDecoration: 'none' }}
            >
              See every sold &rarr;
            </a>
          )}
          {ebayUrl && (
            <a
              href={ebayUrl}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              onClick={onEbayClick}
              style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--fp-muted)', textDecoration: 'none' }}
            >
              Shop similar on eBay &rarr;
            </a>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {hasData ? (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', lineHeight: 1, color: 'var(--green, var(--fp-accent))' }}>
              {fmtMoney(median as number)}
            </div>
            <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fp-muted)', marginTop: '0.3rem' }}>
              {n} sold &middot; {stat} &middot; live
            </div>
          </>
        ) : (
          <div style={{ fontSize: '0.82rem', color: 'var(--fp-muted)', fontStyle: 'italic' }}>No sold comps yet</div>
        )}
      </div>
    </div>
  )
}
