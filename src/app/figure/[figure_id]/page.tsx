import type { Metadata } from 'next'
import { getFigureById, deriveName, type KBFigure as LocalKBFigure } from '@/data/kb'
import FigureImage from '@/app/components/FigureImage'
import AdSlot from '@/app/components/AdSlot'

// All figure pages are edge-rendered on first request and cached by Cloudflare CDN.
// This avoids pre-building 18K+ static files at build time (Cloudflare Pages 20K limit).
// SEO works fine — Googlebot triggers edge render and receives full HTML.
export const dynamic = 'force-dynamic'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''
const EBAY_CAMPAIGN_ID = process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID ?? ''

// ── Types — mapped to actual API contract ────────────────────────────────────

// GET /api/v1/figure/:figure_id (new endpoint, P0 from engineer)
type KBFigure = {
  figure_id: string
  name: string
  brand: string
  line: string
  series: string
  genre: string            // fandom slug e.g. "wrestling"
  year: number | null
  canonical_image_url: string | null
  series_total?: number    // computed from KB once engineer adds it
}

// GET /api/v1/figure-price?figureId= (accepts v2 figure_id once engineer adds support)
type PriceData = {
  figureId: string
  avgSold: number | null
  soldCount: number
  avgFS: number | null
  fsCount: number
  minFS: number | null
  // P1 additions (coming from engineer):
  medianSold?: number | null
  minSold?: number | null
  maxSold?: number | null
  soldHistory: {
    price: number
    title: string
    condition: string
    sold_date: string
    listing_format: string
  }[]
}

type PageProps = {
  params: Promise<{ figure_id: string }>
}

// ── Metadata ──────────────────────────────────────────────────────────────────
// Uses KB data (always available at build time) + price data (from API, best-effort)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { figure_id } = await params

  // KB lookup first — always available, no network needed
  const local = getFigureById(figure_id)
  if (!local) return { title: 'Figure Not Found' }

  const displayName = deriveName(local)
  const line = local.product_line.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const fandom = local.fandom.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  // Try to get price for richer description — non-blocking
  const { price } = await fetchFigureData(figure_id)
  const avg = price?.avgSold ?? null

  return {
    title: `${displayName} Price Guide — ${line} | FigurePinner`,
    description: `${displayName} current market value${avg ? `: avg $${avg.toFixed(0)}` : ''}. Real eBay sold prices for ${fandom} action figures.`,
    openGraph: {
      title: `${displayName}${avg ? ` — $${avg.toFixed(0)} avg` : ''} | FigurePinner`,
      description: `Real sold prices for ${displayName}. ${price?.soldCount ?? 0} eBay comps.`,
      images: local.canonical_image_url
        ? [{ url: local.canonical_image_url, width: 400, height: 400, alt: displayName }]
        : [],
    },
  }
}

// ── Data fetching ─────────────────────────────────────────────────────────────
async function fetchFigureData(figure_id: string): Promise<{ figure: KBFigure | null; price: PriceData | null }> {
  // Fetch KB entry and price in parallel
  const [figureRes, priceRes] = await Promise.allSettled([
    fetch(`${API_BASE}/api/v1/figure/${encodeURIComponent(figure_id)}`, { next: { revalidate: 3600 } }),
    fetch(`${API_BASE}/api/v1/figure-price?figureId=${encodeURIComponent(figure_id)}`, { next: { revalidate: 3600 } }),
  ])

  const figure = figureRes.status === 'fulfilled' && figureRes.value.ok
    ? await figureRes.value.json() as KBFigure
    : null

  const price = priceRes.status === 'fulfilled' && priceRes.value.ok
    ? await priceRes.value.json() as PriceData
    : null

  return { figure, price }
}

function buildEbayUrl(figure: KBFigure): string {
  const terms = encodeURIComponent(`${figure.brand} ${figure.line} ${figure.series} ${figure.name}`)
  return `https://www.ebay.com/sch/i.html?_nkw=${terms}&_sop=15&mkcid=1&mkrid=711-53200-19255-0&campid=${EBAY_CAMPAIGN_ID}&toolid=10001`
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function FigureDetailPage({ params }: PageProps) {
  const { figure_id } = await params

  // KB data — always available, zero network latency
  const local = getFigureById(figure_id)
  if (!local) return <NotFoundState />

  // API data — best-effort, may be null if Worker is down or endpoints not yet deployed
  const { figure: apiData, price } = await fetchFigureData(figure_id)

  // Merge: API data wins if present, KB data fills gaps
  const figure: KBFigure = apiData ?? {
    figure_id: local.figure_id,
    name: deriveName(local),
    brand: local.manufacturer.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    line: local.product_line.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    series: local.release_wave,
    genre: local.fandom,
    year: null,
    canonical_image_url: local.canonical_image_url ?? null,
  }

  const avg = price?.avgSold ?? null
  const ebayUrl = buildEbayUrl(figure)

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>

      {/* Nav breadcrumb */}
      <nav style={{
        display: 'flex', alignItems: 'center', gap: '0.25rem',
        padding: '1rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--s1)',
        fontSize: '0.875rem', color: 'var(--muted)',
      }}>
        <a href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text)', textDecoration: 'none' }}>FP</a>
        <Chevron />
        <a href={`/${figure.genre}`} style={{ color: 'var(--muted)', textDecoration: 'none', textTransform: 'capitalize' }}>{figure.genre.replace(/-/g, ' ')}</a>
        <Chevron />
        <span style={{ color: 'var(--text)' }}>{figure.name}</span>
      </nav>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2.5rem', alignItems: 'start' }}>

        {/* Left */}
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--blue)', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
            {figure.brand} · {figure.line}
            {figure.series ? ` · Series ${figure.series}` : ''}
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', letterSpacing: '0.03em', margin: '0 0 1.5rem' }}>
            {figure.name.toUpperCase()}
          </h1>

          {/* Price stats */}
          {price ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem', marginBottom: '1rem' }}>
              <PriceStat label="AVG SOLD" value={avg != null ? `$${avg.toFixed(0)}` : '—'} highlight />
              <PriceStat label="MEDIAN" value={price.medianSold != null ? `$${price.medianSold.toFixed(0)}` : '—'} />
              <PriceStat label="LOW SOLD" value={price.minSold != null ? `$${price.minSold.toFixed(0)}` : '—'} />
              <PriceStat label="HIGH SOLD" value={price.maxSold != null ? `$${price.maxSold.toFixed(0)}` : '—'} />
            </div>
          ) : (
            <div style={{ padding: '1rem', background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '1rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
              No price data yet for this figure.
            </div>
          )}

          {price && (
            <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginBottom: '2rem' }}>
              Based on <strong style={{ color: 'var(--text)' }}>{price.soldCount} eBay sold listings</strong>
              {price.avgFS != null && <> · For sale avg <strong style={{ color: 'var(--text)' }}>${price.avgFS.toFixed(0)}</strong> ({price.fsCount} listings)</>}
            </p>
          )}

          {/* Price history — Pro gate */}
          <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--blue)', marginBottom: '0.625rem' }}>90-DAY PRICE HISTORY</div>
            <div style={{ height: '100px', background: 'var(--s2)', borderRadius: '8px', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChartIcon />
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '0.875rem' }}>Full price history is a Pro feature.</p>
            <a href="/pro" style={{ display: 'inline-block', background: 'var(--blue)', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none' }}>
              Unlock with Pro — $6.99/mo
            </a>
          </div>

          {/* Ad slot — 300×250 rectangle, shown between price data and sales history */}
          <div style={{ margin: '1.5rem 0', display: 'flex', justifyContent: 'center' }}>
            <AdSlot slot="rectangle" />
          </div>

          {/* Recent sold history (free — show last 3) */}
          {price && price.soldHistory.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.625rem' }}>
                Recent Sales
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {price.soldHistory.slice(0, 3).map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ color: 'var(--muted)', marginRight: '0.5rem' }}>{formatDate(s.sold_date)}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>{s.condition}</span>
                    </div>
                    <span style={{ fontWeight: '700', color: 'var(--green)' }}>${s.price.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: sticky CTA card */}
        <div style={{ position: 'sticky', top: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Figure image */}
          <FigureImage url={figure.canonical_image_url} name={figure.name} genre={figure.genre} />

          {/* Buy card */}
          <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.875rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: avg != null ? '2rem' : '1.25rem', letterSpacing: '0.02em', color: avg != null ? 'var(--text)' : 'var(--muted)' }}>
                {avg != null ? `$${avg.toFixed(0)}` : 'No data'}
              </div>
              {avg != null && <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>avg sold</div>}
            </div>

            <a href={ebayUrl} target="_blank" rel="noopener noreferrer sponsored" style={{
              display: 'block', textAlign: 'center', background: '#E53238', color: '#fff',
              padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700',
              textDecoration: 'none', marginBottom: '0.5rem',
            }}>
              Find on eBay →
            </a>
            <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textAlign: 'center', marginBottom: '1rem' }}>
              Opens eBay sold listings · Affiliate link
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a href="/app/wantlist" style={{
                display: 'block', textAlign: 'center', border: '1px solid var(--border)',
                color: 'var(--text)', padding: '0.625rem', borderRadius: '6px',
                fontSize: '0.8rem', fontWeight: '500', textDecoration: 'none',
              }}>
                + Add to Want List
              </a>
              <a href="/app/alerts" style={{
                display: 'block', textAlign: 'center', border: '1px solid var(--border)',
                color: 'var(--text)', padding: '0.625rem', borderRadius: '6px',
                fontSize: '0.8rem', fontWeight: '500', textDecoration: 'none',
              }}>
                🔔 Set Price Alert
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PriceStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      background: 'var(--s1)', border: `1px solid ${highlight ? 'var(--blue)' : 'var(--border)'}`,
      borderRadius: '8px', padding: '0.75rem', textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: highlight ? 'var(--green)' : 'var(--text)' }}>{value}</div>
    </div>
  )
}

function NotFoundState() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', marginBottom: '0.5rem' }}>404</div>
        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>Figure not found.</p>
        <a href="/" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: '600' }}>← Back to search</a>
      </div>
    </main>
  )
}

function Chevron() { return <span style={{ color: 'var(--border)', margin: '0 0.2rem' }}>›</span> }
function ChartIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ color: 'var(--border)' }}>
      <path d="M4 30L12 20L20 23L28 12L36 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
  catch { return iso }
}
