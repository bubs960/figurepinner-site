import type { Metadata } from 'next'
import { getFigureById, deriveName, type KBFigure as LocalKBFigure } from '@/data/kb'
import FigureImage from '@/app/components/FigureImage'
import FigureActions from '@/app/components/FigureActions'
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

// GET /api/v1/figure-price?figureId=
type PriceData = {
  figureId: string
  avgSold: number | null
  medianSold?: number | null
  minSold?: number | null
  maxSold?: number | null
  soldCount: number
  avgFS: number | null
  fsCount: number
  minFS: number | null
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
      images: (local.canonical_image_url ?? price?.image_url)
        ? [{ url: (local.canonical_image_url ?? price?.image_url)!, width: 400, height: 400, alt: displayName }]
        : [],
    },
  }
}

// ── Data fetching ─────────────────────────────────────────────────────────────
async function fetchFigureData(figure_id: string): Promise<{ figure: KBFigure | null; price: PriceData | null }> {
  // Price data comes from the API worker (has eBay sold data) — server-side, no CORS issue
  // Figure data uses local KB route (faster, always available)
  const priceRes = await fetch(
    `${API_BASE}/api/v1/figure-price?figureId=${encodeURIComponent(figure_id)}`,
    { next: { revalidate: 3600 }, signal: AbortSignal.timeout(4000) }
  ).catch(() => null)

  const price = priceRes?.ok
    ? await priceRes.json() as PriceData
    : null

  return { figure: null, price }
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
  // image: local KB first, then fall back to D1 image returned by figure-price endpoint
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

  // JSON-LD structured data for Google rich results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: figure.name,
    description: `${figure.name} action figure by ${figure.brand}. ${figure.line} Series ${figure.series}.`,
    brand: { '@type': 'Brand', name: figure.brand },
    image: figure.canonical_image_url ?? undefined,
    category: figure.genre.replace(/-/g, ' '),
    offers: avg != null ? {
      '@type': 'Offer',
      price: avg.toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: ebayUrl,
      seller: { '@type': 'Organization', name: 'eBay' },
      description: `Based on ${price?.soldCount ?? 0} recent eBay sold listings`,
    } : undefined,
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .fp-detail-grid { grid-template-columns: 1fr !important; }
          .fp-detail-right { position: static !important; order: -1; }
          .fp-price-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .fp-detail-right .fp-img-card { max-width: 240px; margin: 0 auto; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(9,9,15,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--dim)' }}>
          <a href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text)', textDecoration: 'none', letterSpacing: '0.04em' }}>FP</a>
          <Chevron />
          <a href={`/${figure.genre}`} style={{ color: 'var(--muted)', textDecoration: 'none', textTransform: 'capitalize' }}>
            {figure.genre.replace(/-/g, ' ')}
          </a>
          <Chevron />
          <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
            {figure.name}
          </span>
        </div>
        <a href="/pro" style={{
          padding: '5px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600',
          background: 'var(--blue)', color: '#fff', textDecoration: 'none', flexShrink: 0,
        }}>Pro</a>
      </nav>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        <div className="fp-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2.5rem', alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div>
            {/* Genre + line label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.1em',
                color: 'var(--blue)', textTransform: 'uppercase',
                background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '4px',
                border: '1px solid rgba(59,130,246,0.2)',
              }}>
                {figure.brand}
              </span>
              <span style={{ color: 'var(--dim)', fontSize: '0.75rem' }}>·</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                {figure.line}{figure.series ? ` · Series ${figure.series}` : ''}
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              letterSpacing: '0.03em',
              lineHeight: '1.1',
              margin: '0 0 1.75rem',
            }}>
              {figure.name.toUpperCase()}
            </h1>

            {/* Price stats grid */}
            {price ? (
              <>
                <div className="fp-price-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <PriceStat label="AVG SOLD" value={avg != null ? `$${avg.toFixed(0)}` : '—'} highlight />
                  <PriceStat label="MEDIAN" value={price.medianSold != null ? `$${price.medianSold.toFixed(0)}` : '—'} />
                  <PriceStat label="LOWEST" value={price.minSold != null ? `$${price.minSold.toFixed(0)}` : '—'} />
                  <PriceStat label="HIGHEST" value={price.maxSold != null ? `$${price.maxSold.toFixed(0)}` : '—'} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--dim)' }}>
                    {price.soldCount} eBay sold comps
                  </span>
                  {price.avgFS != null && (
                    <>
                      <span style={{ color: 'var(--border)', fontSize: '0.75rem' }}>·</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        For sale avg{' '}
                        <strong style={{ color: 'var(--text)', fontWeight: '600' }}>${price.avgFS.toFixed(0)}</strong>
                        {' '}({price.fsCount} listings)
                      </span>
                    </>
                  )}
                  {avg != null && price.minFS != null && (
                    <>
                      <span style={{ color: 'var(--border)', fontSize: '0.75rem' }}>·</span>
                      <span style={{ fontSize: '0.75rem' }}>
                        {price.minFS < avg
                          ? <span style={{ color: 'var(--green)', fontWeight: '600' }}>Deal available from ${price.minFS.toFixed(0)} →</span>
                          : <span style={{ color: 'var(--muted)' }}>Buy now from ${price.minFS.toFixed(0)}</span>
                        }
                      </span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div style={{
                padding: '1.25rem', background: 'var(--s1)', border: '1px solid var(--border)',
                borderRadius: '10px', marginBottom: '2rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
              }}>
                <span style={{ fontSize: '1.25rem' }}>📊</span>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.125rem', fontSize: '0.875rem' }}>No price data yet</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                    This figure hasn&apos;t been matched to recent eBay listings yet.
                  </div>
                </div>
              </div>
            )}

            {/* Price history Pro gate */}
            <div style={{
              background: 'var(--s1)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '1.5rem', marginBottom: '1.75rem',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: 'linear-gradient(90deg, var(--blue), transparent)',
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--blue)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    90-Day Price History
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>See how this figure&apos;s price has moved over time.</div>
                </div>
                <a href="/pro" style={{
                  flexShrink: 0, display: 'inline-block',
                  background: 'var(--blue)', color: '#fff',
                  padding: '6px 14px', borderRadius: '6px',
                  fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}>
                  Unlock Pro
                </a>
              </div>
              {/* Blurred chart placeholder */}
              <div style={{
                height: '90px', background: 'var(--s2)', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(4px)' }} />
                <ChartIcon />
              </div>
            </div>

            {/* Ad slot */}
            <div style={{ margin: '1.5rem 0', display: 'flex', justifyContent: 'center' }}>
              <AdSlot slot="rectangle" />
            </div>

            {/* Recent sold history */}
            {price && price.soldHistory.length > 0 && (
              <div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '0.75rem', paddingBottom: '0.625rem', borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase' }}>
                    Recent eBay Sales
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--dim)' }}>
                    Showing 3 of {price.soldHistory.length}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {price.soldHistory.slice(0, 3).map((s, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.75rem 1rem', background: 'var(--s1)', border: '1px solid var(--border)',
                      borderRadius: '8px', fontSize: '0.8rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ color: 'var(--dim)', fontSize: '0.72rem', minWidth: '52px' }}>{formatDate(s.sold_date)}</span>
                        <span style={{
                          padding: '1px 7px', borderRadius: '4px', fontSize: '0.68rem',
                          background: 'var(--s2)', border: '1px solid var(--border)',
                          color: 'var(--muted)',
                        }}>
                          {s.condition}
                        </span>
                        {s.listing_format === 'auction' && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--orange)', fontWeight: '600' }}>Auction</span>
                        )}
                      </div>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--green)', letterSpacing: '0.02em' }}>
                        ${s.price.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                  <a href={ebayUrl} target="_blank" rel="noopener noreferrer sponsored" style={{ fontSize: '0.75rem', color: 'var(--blue)', textDecoration: 'none' }}>
                    See all eBay listings →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* ── Right column (sticky) ── */}
          <div className="fp-detail-right" style={{ position: 'sticky', top: '72px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {/* Figure image */}
            <div className="fp-img-card" style={{
              background: 'var(--s1)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', aspectRatio: '1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FigureImage url={figure.canonical_image_url} name={figure.name} genre={figure.genre} bare />
            </div>

            {/* Price + CTA card */}
            <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              {/* Price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: avg != null ? '2rem' : '1.1rem',
                  letterSpacing: '0.02em',
                  color: avg != null ? 'var(--text)' : 'var(--muted)',
                }}>
                  {avg != null ? `$${avg.toFixed(0)}` : 'No data'}
                </div>
                {avg != null && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--dim)', textAlign: 'right', lineHeight: '1.3' }}>
                    avg sold<br />
                    <span style={{ color: 'var(--muted)' }}>{price?.soldCount} comps</span>
                  </div>
                )}
              </div>

              {/* eBay CTA */}
              <a
                href={ebayUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  background: '#E53238', color: '#fff',
                  padding: '0.8rem', borderRadius: '8px',
                  fontSize: '0.875rem', fontWeight: '700', textDecoration: 'none',
                  marginBottom: '0.375rem',
                }}
              >
                <span>Find on eBay</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7h8M7 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <div style={{ fontSize: '0.65rem', color: 'var(--dim)', textAlign: 'center', marginBottom: '1rem' }}>
                Affiliate link · No extra cost to you
              </div>

              <FigureActions
                figure_id={figure.figure_id}
                name={figure.name}
                brand={figure.brand}
                line={figure.line}
                genre={figure.genre}
              />
            </div>

            {/* Quick facts */}
            <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--dim)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Details
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <DetailRow label="Brand" value={figure.brand} />
                <DetailRow label="Line" value={figure.line} />
                {figure.series && <DetailRow label="Series" value={figure.series} />}
                <DetailRow label="Genre" value={figure.genre.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
                {Number(local.pack_size) > 1 && <DetailRow label="Pack" value={`${local.pack_size}-pack`} />}
                {local.exclusive_to && local.exclusive_to !== 'None' && <DetailRow label="Exclusive" value={local.exclusive_to} />}
                {local.scale && <DetailRow label="Scale" value={local.scale} />}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--dim)' }}>
          © {new Date().getFullYear()} FigurePinner ·{' '}
          <a href={`/${figure.genre}`} style={{ color: 'var(--dim)' }}>More {figure.genre.replace(/-/g, ' ')} figures</a> ·{' '}
          <a href="/about" style={{ color: 'var(--dim)' }}>About</a> ·{' '}
          <a href="/privacy" style={{ color: 'var(--dim)' }}>Privacy</a>
        </p>
      </footer>
    </div>
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', fontSize: '0.8rem' }}>
      <span style={{ color: 'var(--dim)', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--muted)', textAlign: 'right' }}>{value}</span>
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
