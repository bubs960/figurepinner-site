// LiveMedian — the Bid Check differentiator inside the indexable guide format.
//
// A guide cites a figure's real sold median; this renders it LIVE from the
// r2proxy price-summaries snapshot (the same data the figure page + price-check
// API read), so the number self-updates and no competitor can fake it. The
// prose around it carries the story; this carries the current truth.
//
// Server-side data: `fetchPriceSnaps()` is called once by the page (async) for
// every `comp` block's fid and the result map is passed down, so this component
// stays a SYNC presentational leaf (no async-component-in-sync-JSX typing pain).
// The fetch is ISR-cached at 1h so the page shell can stay static while the
// medians refresh hourly. A fid with no comps renders an honest blank, never a
// derived number (S16 honest-blanks rule).

const R2_PROXY_BASE = 'https://figurepinner-r2proxy.bubs960.workers.dev'

export type PriceSnap = {
  median_sold: number | null
  avg_sold: number | null
  min_sold: number | null
  max_sold: number | null
  sold_count: number
}

/** Batched, ISR-cached (1h) fetch of price snapshots for a set of fids.
 *  Returns only fids that have a usable snapshot. */
export async function fetchPriceSnaps(fids: string[]): Promise<Map<string, PriceSnap>> {
  const unique = [...new Set(fids)]
  const entries = await Promise.all(
    unique.map(async (fid) => {
      try {
        const r = await fetch(`${R2_PROXY_BASE}/price-summaries/${encodeURIComponent(fid)}.json`, {
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(4000),
        })
        if (!r.ok) return [fid, null] as const
        const j = (await r.json()) as PriceSnap
        if (!j || Object.keys(j).length === 0) return [fid, null] as const
        return [fid, j] as const
      } catch {
        return [fid, null] as const
      }
    }),
  )
  return new Map(entries.filter((e): e is readonly [string, PriceSnap] => e[1] !== null))
}

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
}: {
  snap?: PriceSnap | null
  label: string
  sublabel?: string
  href?: string
}) {
  const median = snap ? (snap.median_sold ?? snap.avg_sold) : null
  const n = snap?.sold_count ?? 0
  const hasData = median !== null && n > 0

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
        {href && (
          <a
            href={href}
            style={{ display: 'inline-block', marginTop: '0.35rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--fp-accent)', textDecoration: 'none' }}
          >
            See every sold &rarr;
          </a>
        )}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {hasData ? (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', lineHeight: 1, color: 'var(--green, var(--fp-accent))' }}>
              {fmtMoney(median as number)}
            </div>
            <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fp-muted)', marginTop: '0.3rem' }}>
              {n} sold &middot; median &middot; live
            </div>
          </>
        ) : (
          <div style={{ fontSize: '0.82rem', color: 'var(--fp-muted)', fontStyle: 'italic' }}>No sold comps yet</div>
        )}
      </div>
    </div>
  )
}
