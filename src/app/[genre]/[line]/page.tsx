/**
 * Line hub page — /[genre]/[line]
 * e.g. /wrestling/wwe-elite  or  /wrestling/elite
 *
 * SEO purpose: ranks for "[Line Name] price guide" queries.
 * Shows all figures in the line grouped by series/wave, links to /figure/[id].
 * No external pricing fetched — KB data only. Fast, cacheable, crawlable.
 *
 * Sits alongside [genre]/[line]/[slug]/page.tsx (3-level pretty URL alias).
 * Next.js resolves them cleanly: 2-segment → this page, 3-segment → alias.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFiguresByLine, getAllFandoms, deriveName, figureUrl, prettyFigureUrl, type KBFigure } from '@/data/kb'
import AdSlot from '@/app/components/AdSlot'

export const dynamic = 'force-dynamic'

// ─── Genre config (accent colors) ─────────────────────────────────────────────

const GENRE_ACCENT: Record<string, string> = {
  'wrestling':                  '#e53238',
  'marvel':                     '#e23636',
  'star-wars':                  '#3d7bca',
  'dc':                         '#3a6fbf',
  'transformers':               '#c44f0e',
  'gijoe':                      '#3d7a3d',
  'masters-of-the-universe':    '#8b2be2',
  'teenage-mutant-ninja-turtles': '#3d7a3d',
  'power-rangers':              '#c43d3d',
  'indiana-jones':              '#8b6914',
  'ghostbusters':               '#c4941c',
  'mythic-legions':             '#546e7a',
  'thundercats':                '#c44f0e',
  'action-force':               '#3a6fbf',
  'dungeons-dragons':           '#7b2be2',
  'neca':                       '#37474f',
  'spawn':                      '#212121',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function prettifySlug(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

/** Build a display name for the line from the URL slug + first figure's data */
function buildLineDisplayName(lineSlug: string, figures: KBFigure[]): string {
  if (!figures.length) return prettifySlug(lineSlug)
  const f = figures[0]
  const mfr = f.manufacturer
  const pl  = f.product_line
  // If slug is "mfr-pl" form, build "Mfr Pl" display name
  if (lineSlug.toLowerCase() === `${mfr}-${pl}`) {
    return `${prettifySlug(mfr)} ${prettifySlug(pl)}`
  }
  // Otherwise just prettify product_line
  return prettifySlug(pl)
}

/** Group figures by release_wave. Returns sorted array of [wave, figures[]] */
function groupByWave(figures: KBFigure[]): Array<{ wave: string; label: string; figures: KBFigure[] }> {
  const map = new Map<string, KBFigure[]>()
  for (const f of figures) {
    const w = f.release_wave || 'Unknown'
    if (!map.has(w)) map.set(w, [])
    map.get(w)!.push(f)
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      const na = parseInt(a), nb = parseInt(b)
      if (!isNaN(na) && !isNaN(nb)) return na - nb
      return a.localeCompare(b)
    })
    .map(([wave, figs]) => ({
      wave,
      label: wave === 'Unknown' ? 'Other' : isNaN(parseInt(wave)) ? wave : `Series ${wave}`,
      figures: figs.sort((a, b) =>
        a.character_canonical.localeCompare(b.character_canonical)
      ),
    }))
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ genre: string; line: string }> }
): Promise<Metadata> {
  const { genre, line } = await params
  const figures = getFiguresByLine(genre, line)
  if (!figures.length) return { title: 'Not Found' }

  const lineName  = buildLineDisplayName(line, figures)
  const genreName = prettifySlug(genre)

  return {
    title: `${lineName} Price Guide — ${genreName} | FigurePinner`,
    description: `${lineName} action figure prices. Track values for ${figures.length}+ ${genreName} figures with real eBay sold data on FigurePinner.`,
    openGraph: {
      title: `${lineName} Price Guide | FigurePinner`,
      description: `Real sold prices for ${figures.length}+ ${lineName} figures. Updated daily from eBay.`,
    },
    alternates: {
      canonical: `https://figurepinner.com/${genre}/${line}`,
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LineHubPage(
  { params }: { params: Promise<{ genre: string; line: string }> }
) {
  const { genre, line } = await params

  // Guard: genre must be valid
  const validFandoms = getAllFandoms()
  if (!validFandoms.includes(genre)) notFound()

  const figures = getFiguresByLine(genre, line)
  if (!figures.length) notFound()

  const lineName    = buildLineDisplayName(line, figures)
  const genreName   = prettifySlug(genre)
  const accent      = GENRE_ACCENT[genre] ?? '#FF5F00'
  const waves       = groupByWave(figures)
  const totalCount  = figures.length

  // Unique characters (for meta)
  const uniqueChars = new Set(figures.map(f => f.character_canonical)).size

  // Sample images for the hero (first 4 figures with images)
  const sampleImages = figures
    .filter(f => f.canonical_image_url)
    .slice(0, 4)
    .map(f => f.canonical_image_url!)

  // JSON-LD: ItemList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${lineName} Price Guide`,
    description: `Price guide for ${totalCount} ${lineName} action figures`,
    url: `https://figurepinner.com/${genre}/${line}`,
    mainEntity: {
      '@type': 'ItemList',
      name: `${lineName} Figures`,
      numberOfItems: totalCount,
      itemListElement: figures.slice(0, 50).map((f, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://figurepinner.com${prettyFigureUrl(f)}`,
        name: deriveName(f),
      })),
    },
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hover styles — server-safe CSS, no client JS needed */}
      <style>{`
        .line-card:hover {
          border-color: ${accent}55 !important;
          background: ${accent}0A !important;
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,12,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 clamp(1rem, 5vw, 2rem)',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          height: 52,
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          fontSize: '0.8rem', color: 'var(--dim)',
          overflow: 'hidden',
        }}>
          <a href="/" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', textDecoration: 'none', flexShrink: 0 }}>FP</a>
          <span style={{ opacity: 0.4, flexShrink: 0 }}>›</span>
          <a href={`/${genre}`} style={{ color: 'var(--muted)', textDecoration: 'none', flexShrink: 0 }}>{genreName}</a>
          <span style={{ opacity: 0.4, flexShrink: 0 }}>›</span>
          <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lineName}</span>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1rem, 5vw, 3rem)',
        background: `linear-gradient(135deg, ${accent}08 0%, transparent 60%)`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Breadcrumb genre pill */}
          <a href={`/${genre}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: accent, textDecoration: 'none',
            background: `${accent}15`, border: `1px solid ${accent}30`,
            borderRadius: '9999px', padding: '0.2rem 0.625rem',
            marginBottom: '1rem',
          }}>
            {genreName}
          </a>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text)',
            margin: '0 0 0.625rem',
          }}>
            {lineName} Price Guide
          </h1>

          <p style={{ fontSize: '1rem', color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: 540 }}>
            Real eBay sold prices for {totalCount.toLocaleString()} {lineName} figures across{' '}
            {waves.length} series. {uniqueChars} unique characters.
          </p>

          {/* Sample image strip */}
          {sampleImages.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {sampleImages.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt=""
                  width={56}
                  height={56}
                  style={{
                    width: 56, height: 56,
                    objectFit: 'contain',
                    background: 'var(--s1)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                  loading="lazy"
                />
              ))}
              {totalCount > sampleImages.length && (
                <div style={{
                  width: 56, height: 56, borderRadius: 8, flexShrink: 0,
                  background: 'var(--s1)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: 'var(--dim)',
                }}>
                  +{(totalCount - sampleImages.length).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Figures', value: totalCount.toLocaleString() },
              { label: 'Series', value: waves.length.toLocaleString() },
              { label: 'Characters', value: uniqueChars.toLocaleString() },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: accent }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--dim)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 5vw, 3rem) 5rem' }}>

        {/* Ad slot */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <AdSlot slot="leaderboard" />
        </div>

        {/* Series / wave sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {waves.map(({ wave, label, figures: waveFigs }) => (
            <section key={wave} id={`series-${wave}`}>
              {/* Section header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: `2px solid ${accent}22`,
              }}>
                <div style={{
                  width: 3, height: '1.125rem', borderRadius: 2,
                  background: accent, flexShrink: 0,
                }} />
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.0625rem', fontWeight: 700,
                  color: 'var(--text)', margin: 0,
                }}>
                  {lineName} {label}
                </h2>
                <span style={{ fontSize: '0.72rem', color: 'var(--dim)', marginLeft: 'auto', fontWeight: 500 }}>
                  {waveFigs.length} figure{waveFigs.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Figure grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '0.5rem',
              }}>
                {waveFigs.map(f => (
                  <FigureCard key={f.figure_id} figure={f} accent={accent} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Bottom ad + CTA */}
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <AdSlot slot="rectangle" />
          <div style={{ marginTop: '2rem' }}>
            <a
              href="https://chromewebstore.google.com/detail/figurepinner"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: accent,
                color: '#fff',
                borderRadius: 10,
                fontWeight: 700, fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Track {lineName} Prices Free →
            </a>
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--dim)' }}>
              Chrome extension · No account required
            </p>
          </div>
        </div>

        {/* Affiliate disclosure */}
        <p style={{
          marginTop: '2rem', textAlign: 'center',
          fontSize: '0.68rem', color: 'var(--dim)',
        }}>
          FigurePinner may earn a commission from eBay purchases. Prices are based on recent sold listings.
        </p>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--dim)', margin: 0 }}>
          © {new Date().getFullYear()} FigurePinner ·{' '}
          <a href={`/${genre}`} style={{ color: 'var(--dim)', textDecoration: 'none' }}>
            All {genreName} figures
          </a>{' '}·{' '}
          <a href="/privacy" style={{ color: 'var(--dim)', textDecoration: 'none' }}>Privacy</a>
        </p>
      </footer>
    </div>
  )
}

// ─── Figure Card ──────────────────────────────────────────────────────────────

function FigureCard({ figure: f, accent }: { figure: KBFigure; accent: string }) {
  const charName = f.character_canonical
    .split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const variant = (f.character_variant && f.character_variant !== 'None')
    ? f.character_variant : null
  const exclusive = (f.exclusive_to && f.exclusive_to !== 'None')
    ? f.exclusive_to : null

  return (
    <a
      href={figureUrl(f)}
      className="line-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.625rem 0.75rem',
        background: 'var(--s1)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        textDecoration: 'none',
        color: 'var(--text)',
        fontSize: '0.8125rem',
        transition: 'border-color 0.12s, background 0.12s',
        minWidth: 0,
      }}
    >
      {/* Thumbnail */}
      {f.canonical_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={f.canonical_image_url}
          alt=""
          width={40}
          height={40}
          style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4, flexShrink: 0, background: 'var(--s2)' }}
          loading="lazy"
        />
      ) : (
        <div style={{
          width: 40, height: 40, borderRadius: 4, flexShrink: 0,
          background: 'var(--s2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.4">
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <circle cx="8" cy="6" r="1.5" />
            <path d="M4 12c0-2.2 1.8-4 4-4s4 1.8 4 4" />
          </svg>
        </div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.3,
        }}>
          {charName}
        </div>
        {variant && (
          <div style={{ fontSize: '0.68rem', color: 'var(--dim)', marginTop: 1 }}>
            {variant}
          </div>
        )}
        {exclusive && (
          <div style={{ fontSize: '0.65rem', color: accent, marginTop: 1, opacity: 0.85 }}>
            {exclusive}
          </div>
        )}
      </div>

      {/* Arrow */}
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}>
        <path d="M2 6h8M6 2l4 4-4 4" />
      </svg>
    </a>
  )
}
