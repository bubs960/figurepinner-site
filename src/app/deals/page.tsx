import type { Metadata } from 'next'
import Link from 'next/link'
import NavLogo from '@/app/_components/NavLogo'
import type { DealResult } from '@/app/api/v1/deals/route'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Price Drop Alert — Action Figure Deals | FigurePinner',
  description: 'Action figures selling significantly below their historical average right now. Real eBay sold data updated hourly.',
  alternates: { canonical: 'https://figurepinner.com/deals' },
}

function prettify(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function fandomToPath(fandom: string) {
  const map: Record<string, string> = {
    'marvel-comics': 'marvel-comics',
    'wrestling': 'wrestling',
    'star-wars': 'star-wars',
    'dc': 'dc',
    'tmnt': 'teenage-mutant-ninja-turtles',
    'power-rangers': 'power-rangers',
    'gijoe': 'gijoe',
    'scifi': 'neca',
  }
  return map[fandom] ?? fandom
}

async function getDeals(): Promise<DealResult[]> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://figurepinner.com'
    const res = await fetch(`${base}/api/v1/deals`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = await res.json() as { deals: DealResult[] }
    return data.deals ?? []
  } catch {
    return []
  }
}

export default async function DealsPage() {
  const deals = await getDeals()

  return (
    <div style={{ background: 'var(--fp-bg)', minHeight: '100vh', color: 'var(--fp-text)', fontFamily: 'var(--fp-font-body)' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--nav-bg-translucent)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--fp-border)',
        padding: '0 1.5rem', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <NavLogo />
        <Link href="/search" style={{ fontSize: '0.8rem', color: 'var(--fp-dim)', textDecoration: 'none' }}>
          Search →
        </Link>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem' }}>📉</span>
            <h1 style={{
              fontFamily: 'var(--fp-font-display)',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 800, margin: 0,
              letterSpacing: '-0.02em',
            }}>
              Price Drop Alert
            </h1>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--fp-dim)', margin: 0 }}>
            Figures selling below their historical average right now — based on real eBay sold data.
            Updated hourly.
          </p>
        </div>

        {deals.length === 0 ? (
          <div style={{
            padding: '4rem 2rem', textAlign: 'center',
            color: 'var(--fp-dim)', fontSize: '0.9rem',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <p>No active deals found right now. Check back soon — updates every hour.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {deals.map((deal) => {
              const savings = deal.avg_base - deal.avg_recent
              const figureUrl = `/figure/${deal.figure_id}`
              return (
                <a
                  key={deal.figure_id}
                  href={figureUrl}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.875rem 1.125rem',
                    background: 'var(--fp-surface-0)',
                    border: '1px solid var(--fp-border)',
                    borderRadius: 10,
                    textDecoration: 'none', color: 'inherit',
                    transition: 'border-color 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--fp-border-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--fp-border)')}
                >
                  {/* Drop % badge */}
                  <div style={{
                    flexShrink: 0,
                    width: 54, height: 54,
                    borderRadius: 10,
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 800, letterSpacing: '0.04em' }}>DOWN</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444', lineHeight: 1.1 }}>
                      {deal.drop_pct}%
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700, fontSize: '0.9rem',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginBottom: '0.2rem',
                    }}>
                      {deal.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--fp-dim)' }}>
                      {prettify(deal.brand)} · {prettify(deal.line)} · {prettify(deal.fandom)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--fp-dim)', marginTop: 2 }}>
                      {deal.cnt_recent} recent sale{deal.cnt_recent !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
                      ${deal.avg_recent.toFixed(0)}
                    </div>
                    <div style={{
                      fontSize: '0.72rem', color: 'var(--fp-dim)',
                      textDecoration: 'line-through',
                    }}>
                      avg ${deal.avg_base.toFixed(0)}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>
                      save ~${savings.toFixed(0)}
                    </div>
                  </div>

                  <div style={{ color: 'var(--fp-dim)', fontSize: '0.9rem', flexShrink: 0 }}>→</div>
                </a>
              )
            })}
          </div>
        )}

        {/* Footer note */}
        <div style={{
          marginTop: '2rem', padding: '1rem',
          background: 'var(--fp-surface-0)', borderRadius: 8,
          fontSize: '0.75rem', color: 'var(--fp-dim)',
          border: '1px solid var(--fp-border)',
        }}>
          <strong>How this works:</strong> Comparing recent sold prices (last 14 days) against the all-time average
          for each figure. A figure appears here when its recent average is 18%+ below historical. Data from real
          eBay completed listings — not asking prices.
          {' '}<Link href="/search" style={{ color: 'var(--fp-accent)', textDecoration: 'none' }}>
            Search all figures →
          </Link>
        </div>
      </div>
    </div>
  )
}
