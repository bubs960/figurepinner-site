import type { Metadata } from 'next'
import { seoImageUrl, composeImageSlug } from '@/app/figure/[figure_id]/_lib/imageTransform'
import Link from 'next/link'
import NavLogo from '@/app/_components/NavLogo'
import { notFound } from 'next/navigation'
import { getFiguresByFandom, figureUrl, prettyFigureUrl, SERVED_GENRE_SLUGS, type KBFigure } from '@/data/kb'

const BASE = 'https://figurepinner.com'
import AdSlot from '@/app/components/AdSlot'
import GenreLineAccordion, { type LineData } from './_components/GenreLineAccordion'
import GenreNewsRail from './_components/GenreNewsRail'
import GenreFaq from './_components/GenreFaq'
import BreadcrumbJsonLd from '@/app/_components/BreadcrumbJsonLd'
import RelatedGuides from '@/app/_components/RelatedGuides'

// ISR — genre landing re-renders at most once per hour. Public KB-driven content,
// no user-specific bits. Without this, every genre page hit triggered an SSR
// D1 query (INC-014 root contributor).
export const revalidate = 3600

// generateStaticParams — required for Next.js 15 to classify this route as ISR
// (not fully-dynamic SSR). Without this export the route is absent from the
// prerender-manifest and the KV incremental cache never populates it, causing
// `cache-control: private, no-store` on every request regardless of `revalidate`.
// All 16 served genres are pre-built at deploy time; new slugs get on-demand ISR
// via dynamicParams = true (the default).
export function generateStaticParams() {
  return SERVED_GENRE_SLUGS.map(genre => ({ genre }))
}

// ── Genre config (see ./_lib/genre-meta.ts) ────────────────────────────────
import { GENRE_META } from './_lib/genre-meta'

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ genre: string }> }
): Promise<Metadata> {
  const { genre } = await params
  const meta = GENRE_META[genre]
  if (!meta) return {}

  // Pick a hero figure for OG image — first with a photo, fallback to first overall.
  // OG generator produces 1200×630 and handles no-photo figures with a branded fallback.
  const figures = getFiguresByFandom(genre)
  const hero = figures.find(f => f.canonical_image_url) ?? figures[0] ?? null
  const ogImage = hero ? `${BASE}/figure/${hero.figure_id}/opengraph-image` : undefined

  return {
    title: `${meta.label} Action Figure Prices`,
    description: meta.description,
    alternates: {
      canonical: `${BASE}/${genre}`,
    },
    openGraph: {
      title: `${meta.label} Action Figure Prices`,
      description: meta.description,
      url: `${BASE}/${genre}`,
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630, alt: `${meta.label} action figures` }] }),
    },
    ...(ogImage && {
      twitter: {
        card: 'summary_large_image' as const,
        images: [ogImage],
      },
    }),
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAX_PER_LINE = 60

function formatLineName(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function cardName(f: KBFigure): string {
  const base = f.character_canonical
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  const variant = (f.character_variant && f.character_variant !== 'None')
    ? ` (${f.character_variant})`
    : ''
  return `${base}${variant}`
}

/** Build serialized LineData[] from raw KB figures — server-only. */
function buildLineData(figures: KBFigure[]): { lines: LineData[]; totalCount: number } {
  // 1. Group by product_line
  const groups = new Map<string, KBFigure[]>()
  for (const f of figures) {
    if (!groups.has(f.product_line)) groups.set(f.product_line, [])
    groups.get(f.product_line)!.push(f)
  }

  // 2. Sort within each line: newest wave first, then alpha
  for (const [, group] of groups) {
    group.sort((a, b) => {
      const wA = parseInt(a.release_wave ?? '') || 0
      const wB = parseInt(b.release_wave ?? '') || 0
      if (wA !== wB) return wB - wA
      return a.character_canonical.localeCompare(b.character_canonical)
    })
  }

  // 3. Sort lines by total count descending
  const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)

  // 4. Serialize — cap at MAX_PER_LINE, keep totalCount for "see all" link
  const lines: LineData[] = sorted.map(([slug, group]) => ({
    slug,
    displayName: formatLineName(slug),
    totalCount:  group.length,
    figureCount: Math.min(group.length, MAX_PER_LINE),
    figures:     group.slice(0, MAX_PER_LINE).map(f => ({
      figure_id:    f.figure_id,
      href:         figureUrl(f),
      canonicalUrl: prettyFigureUrl(f),
      name:         cardName(f),
      series:       f.release_wave ?? null,
      exclusive:    f.exclusive_to ?? null,
      imageUrl:     f.canonical_image_url ? seoImageUrl(f.canonical_image_url, composeImageSlug({ character: f.character_canonical, line: f.product_line, series: parseInt(f.release_wave ?? '') || null, brand: f.manufacturer })) : null,
    })),
  }))

  return { lines, totalCount: figures.length }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function GenrePage(
  { params }: { params: Promise<{ genre: string }> }
) {
  const { genre } = await params
  const meta = GENRE_META[genre]
  if (!meta) notFound()

  const figures = getFiguresByFandom(genre)
  if (!figures.length) notFound()

  const { lines, totalCount: totalFigures } = buildLineData(figures)
  const totalLines = lines.length

  // JSON-LD: CollectionPage wrapping ItemList (P4 — CollectionPage enables richer SERP classification)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${meta.label} Action Figure Prices`,
    description: meta.description,
    url: `https://figurepinner.com/${genre}`,
    mainEntity: {
      '@type': 'ItemList',
      name: `${meta.label} Action Figures`,
      numberOfItems: totalFigures,
      itemListElement: lines.slice(0, 5).flatMap((line, li) =>
        line.figures.slice(0, 10).map((f, fi) => ({
          '@type': 'ListItem',
          position: li * 10 + fi + 1,
          item: {
            '@type': 'Product',
            name: f.name,
            url: `https://figurepinner.com${f.canonicalUrl}`,
          },
        }))
      ),
    },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BreadcrumbJsonLd
        crumbs={[
          { name: 'Home', url: 'https://figurepinner.com/' },
          { name: meta.label, url: `https://figurepinner.com/${genre}` },
        ]}
      />

      {/* Genre accent color override */}
      <style>{`
        :root { --genre-accent: ${meta.accent}; }
        .genre-tag { background: color-mix(in srgb, ${meta.accent} 15%, var(--s2)); border-color: color-mix(in srgb, ${meta.accent} 30%, var(--border)); color: ${meta.accent}; }
        @media (max-width: 640px) {
          .genre-hero-grid { grid-template-columns: 1fr !important; }
          .genre-stats-bar { flex-direction: column !important; }
          .genre-hero-collage { display: none !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--nav-bg-translucent)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <NavLogo />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href="/search" style={{ fontSize: '0.875rem', color: 'var(--nav-text)', textDecoration: 'none' }}>Search</a>
          <a href="/pro" style={{
            padding: '5px 12px', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: '600',
            background: 'var(--gold)', color: '#111115', textDecoration: 'none',
          }}>Try Pro</a>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div style={{
        maxWidth: '1100px', margin: '0 auto', padding: '0.875rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        fontSize: '0.8125rem', color: 'var(--dim)',
      }}>
        <a href="/" style={{ color: 'var(--dim)', textDecoration: 'none' }}>Home</a>
        <span>›</span>
        <span style={{ color: 'var(--muted)' }}>{meta.label}</span>
      </div>

      {/* Hero */}
      <header style={{
        maxWidth: '1100px', margin: '0 auto',
        padding: '1rem 1.5rem 2.5rem',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Accent bar */}
        <div style={{
          height: '3px', width: '48px', background: meta.accent,
          borderRadius: '2px', marginBottom: '1.25rem',
        }} />

        <div className="genre-hero-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'end',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              letterSpacing: '0.04em',
              marginBottom: '0.75rem',
              lineHeight: '1.05',
            }}>
              {meta.label.toUpperCase()} FIGURE PRICES
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', maxWidth: '600px', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {meta.description}
            </p>

            {/* Stats bar */}
            <div className="genre-stats-bar" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <StatBadge value={totalFigures.toLocaleString()} label="figures" accent={meta.accent} />
              <StatBadge value={totalLines.toString()} label="product lines" accent={meta.accent} />
              {meta.highlights.slice(0, 2).map(h => (
                <span key={h} className="genre-tag" style={{
                  padding: '3px 10px', borderRadius: '100px', fontSize: '0.75rem',
                  border: '1px solid', fontWeight: '500',
                }}>
                  {h}
                </span>
              ))}
              <a href="/app" style={{
                fontSize: '0.875rem', color: meta.accent, textDecoration: 'none', fontWeight: '500',
              }}>
                Search all {meta.label} figures →
              </a>
            </div>
          </div>

          {/* Hero figure collage — top 4 imaged figures, 2×2 grid.
              Hidden at mobile (≤640px) via .genre-hero-collage media query.
              Server-rendered: uses the figures array already in scope. */}
          {(() => {
            const heroFigs = figures
              .filter(f => f.canonical_image_url && f.canonical_image_url.startsWith('https://') && f.canonical_image_url.trim() !== 'None')
              .slice(0, 4)
            if (heroFigs.length < 2) return null
            return (
              <div className="genre-hero-collage" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', width: '202px', flexShrink: 0 }}>
                {heroFigs.map(f => (
                  <a
                    key={f.figure_id}
                    href={figureUrl(f)}
                    style={{
                      display: 'block', width: '98px', height: '98px',
                      borderRadius: '8px', overflow: 'hidden',
                      border: '1px solid var(--border)', background: 'var(--s2)',
                      textDecoration: 'none',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={seoImageUrl(f.canonical_image_url!, composeImageSlug({ character: f.character_canonical, line: f.product_line, series: parseInt(f.release_wave ?? '') || null, brand: f.manufacturer }))}
                      alt={`${f.character_canonical.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} action figure`}
                      loading="lazy"
                      decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }}
                    />
                  </a>
                ))}
              </div>
            )
          })()}
        </div>
      </header>

      {/* Genre news rail — renders nothing when no events exist */}
      <GenreNewsRail genre={genre} />

      {/* Ticket CTA — only rendered when ticketCta is configured (e.g. MOTU film) */}
      {meta.ticketCta && (
        <div style={{ maxWidth: '1100px', margin: '1.25rem auto 0', padding: '0 1.5rem' }}>
          <a
            href={meta.ticketCta.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.875rem 1.25rem',
              background: 'color-mix(in srgb, var(--genre-accent) 12%, var(--s1))',
              border: '1px solid color-mix(in srgb, var(--genre-accent) 35%, var(--border))',
              borderRadius: '10px',
              textDecoration: 'none',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {meta.ticketCta.badge && (
                <span style={{
                  padding: '2px 8px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700,
                  background: meta.accent, color: '#fff', letterSpacing: '0.03em',
                }}>
                  {meta.ticketCta.badge}
                </span>
              )}
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
                {meta.ticketCta.label}
              </span>
            </div>
            <span style={{
              fontSize: '0.8125rem', fontWeight: 700, color: meta.accent,
              whiteSpace: 'nowrap',
            }}>
              {meta.ticketCta.cta}
            </span>
          </a>
        </div>
      )}

      {/* Line accordion */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1.5rem 5rem' }}>
        <GenreLineAccordion lines={lines} accent={meta.accent} genre={genre} />

        {/* Ad — after content, before CTA (mirrors most-valuable + character page pattern) */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.25rem 0' }}>
          <AdSlot slot="leaderboard" />
        </div>

        {/* CTA */}
        <div style={{
          marginTop: '2rem',
          padding: '2.5rem',
          background: 'var(--s1)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative accent glow */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '200px', height: '2px', background: meta.accent, borderRadius: '0 0 4px 4px',
          }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.04em', marginBottom: '0.625rem' }}>
            TRACK YOUR {meta.label.toUpperCase()} COLLECTION
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1.5rem', maxWidth: '460px', margin: '0 auto 1.5rem' }}>
            Search real eBay sold prices, set deal alerts when figures drop below your target price,
            and track your collection value with FigurePinner.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/sign-up" style={{
              display: 'inline-block', padding: '10px 22px',
              background: meta.accent, color: '#fff',
              borderRadius: '8px', fontWeight: '700', fontSize: '0.875rem', textDecoration: 'none',
            }}>
              Get Started Free
            </a>
            <a href="/pro" style={{
              display: 'inline-block', padding: '10px 22px',
              background: 'transparent', color: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: '8px', fontWeight: '600', fontSize: '0.875rem', textDecoration: 'none',
            }}>
              See Pro Features
            </a>
          </div>
        </div>
        {/* Related guides — internal linking to long-form content */}
        <RelatedGuides
          categorySlug={genre}
          accent={meta.accent}
          heading="COLLECTOR GUIDES"
          caption="Deep dives on values, grading, and strategy."
        />

        {/* FAQ section — visible Q&A + FAQPage JSON-LD for AI engines */}
        <GenreFaq genre={genre} accent={meta.accent} />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', textAlign: 'center' }}>
        <nav style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { href: '/wrestling', label: 'Wrestling' },
            { href: '/marvel', label: 'Marvel' },
            { href: '/star-wars', label: 'Star Wars' },
            { href: '/dc', label: 'DC' },
            { href: '/transformers', label: 'Transformers' },
          ].map(({ href, label }) => (
            <a key={href} href={href} style={{ fontSize: '0.75rem', color: 'var(--dim)', textDecoration: 'none' }}>{label}</a>
          ))}
        </nav>
        <p style={{ fontSize: '0.75rem', color: 'var(--dim)' }}>
          © {new Date().getFullYear()} FigurePinner ·{' '}
          <a href="/about" style={{ color: 'var(--dim)' }}>About</a> ·{' '}
          <a href="/privacy" style={{ color: 'var(--dim)' }}>Privacy</a> ·{' '}
          <a href="/terms" style={{ color: 'var(--dim)' }}>Terms</a>
        </p>
      </footer>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBadge({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', letterSpacing: '0.04em', color: accent }}>
        {value}
      </span>
      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{label}</span>
    </div>
  )
}
