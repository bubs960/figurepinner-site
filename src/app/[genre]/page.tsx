import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFiguresByFandom, figureUrl, prettyFigureUrl, type KBFigure } from '@/data/kb'
import AdSlot from '@/app/components/AdSlot'
import GenreLineAccordion, { type LineData } from './_components/GenreLineAccordion'

// ── Genre config ──────────────────────────────────────────────────────────────

const GENRE_META: Record<string, {
  label: string
  emoji: string
  description: string
  accent: string       // CSS color for genre-specific accent
  highlights: string[] // 3 notable product lines or facts
}> = {
  'wrestling': {
    label: 'Wrestling',
    emoji: '🤼',
    description: 'WWE, AEW, and wrestling action figure prices. Track Mattel Elite, Hasbro, Jakks, and Entrance Greats values across 8,000+ figures.',
    accent: '#e53238',
    highlights: ['Mattel Elite', 'Jakks Pacific', 'Hasbro WWF'],
  },
  'marvel': {
    label: 'Marvel',
    emoji: '🦸',
    description: 'Marvel Legends, Spider-Man, and Marvel action figure prices. Track Hasbro and ToyBiz values across your collection.',
    accent: '#e23636',
    highlights: ['Marvel Legends', 'ToyBiz Classics', 'Spider-Man'],
  },
  'star-wars': {
    label: 'Star Wars',
    emoji: '⚔️',
    description: 'Star Wars action figure prices. Black Series, Vintage Collection, Power of the Force values with real eBay sold data.',
    accent: '#3d7bca',
    highlights: ['Black Series', 'Vintage Collection', 'Power of the Force'],
  },
  'dc': {
    label: 'DC',
    emoji: '🦇',
    description: 'DC action figure prices. McFarlane, DC Direct, DC Universe Classics values with real eBay sold data.',
    accent: '#3a6fbf',
    highlights: ['McFarlane Toys', 'DC Universe Classics', 'DC Direct'],
  },
  'transformers': {
    label: 'Transformers',
    emoji: '🤖',
    description: 'Transformers action figure prices. Masterpiece, Studio Series, Generations values with real eBay sold data.',
    accent: '#c44f0e',
    highlights: ['Masterpiece', 'Studio Series', 'Generations'],
  },
  'gijoe': {
    label: 'G.I. Joe',
    emoji: '🪖',
    description: 'G.I. Joe action figure prices. Classified Series, vintage values with real eBay sold data.',
    accent: '#2e7d32',
    highlights: ['Classified Series', 'A Real American Hero', 'Sigma 6'],
  },
  'masters-of-the-universe': {
    label: 'Masters of the Universe',
    emoji: '⚡',
    description: 'Masters of the Universe action figure prices. Origins, Masterverse, vintage MOTU values.',
    accent: '#b8860b',
    highlights: ['Masterverse', 'Origins', 'Vintage MOTU'],
  },
  'teenage-mutant-ninja-turtles': {
    label: 'TMNT',
    emoji: '🐢',
    description: 'Teenage Mutant Ninja Turtles action figure prices. NECA, Playmates, Super7 values with real eBay sold data.',
    accent: '#2e7d32',
    highlights: ['NECA Ultimate', 'Playmates Vintage', 'Super7 ReAction'],
  },
  'power-rangers': {
    label: 'Power Rangers',
    emoji: '🦕',
    description: 'Power Rangers action figure prices. Lightning Collection, vintage values with real eBay sold data.',
    accent: '#d32f2f',
    highlights: ['Lightning Collection', 'Vintage Bandai', 'Legacy'],
  },
  'indiana-jones': {
    label: 'Indiana Jones',
    emoji: '🎩',
    description: 'Indiana Jones action figure prices. Adventure Series values with real eBay sold data.',
    accent: '#8d6e63',
    highlights: ['Adventure Series', 'Vintage Kenner'],
  },
  'ghostbusters': {
    label: 'Ghostbusters',
    emoji: '👻',
    description: 'Ghostbusters action figure prices. Plasma Series, vintage values with real eBay sold data.',
    accent: '#5e35b1',
    highlights: ['Plasma Series', 'Kenner Real Ghostbusters', 'Afterlife'],
  },
  'mythic-legions': {
    label: 'Mythic Legions',
    emoji: '🗡️',
    description: 'Mythic Legions action figure prices. Four Horsemen values with real eBay sold data.',
    accent: '#7b5e3a',
    highlights: ['Four Horsemen', 'Advent of Decay', 'Necronominus'],
  },
  'thundercats': {
    label: 'Thundercats',
    emoji: '🐱',
    description: 'Thundercats action figure prices. Super7, LJN vintage values with real eBay sold data.',
    accent: '#f57c00',
    highlights: ['Super7 Ultimates', 'LJN Vintage', 'Bandai'],
  },
  'action-force': {
    label: 'Action Force',
    emoji: '🎖️',
    description: 'Action Force action figure prices. Values with real eBay sold data.',
    accent: '#455a64',
    highlights: ['Action Force'],
  },
  'dungeons-dragons': {
    label: 'Dungeons & Dragons',
    emoji: '🐉',
    description: 'Dungeons & Dragons action figure prices. Golden Archive, vintage values with real eBay sold data.',
    accent: '#6a1b9a',
    highlights: ['Golden Archive', 'LJN Vintage', 'Hasbro'],
  },
  'neca': {
    label: 'Horror & Film',
    emoji: '🎬',
    description: 'NECA Horror & Film action figure prices. Ultimate figures, vintage values with real eBay sold data.',
    accent: '#b71c1c',
    highlights: ['NECA Ultimate', 'Retro', 'Toony Terrors'],
  },
  'spawn': {
    label: 'Spawn',
    emoji: '🦇',
    description: 'Spawn action figure prices. McFarlane Toys Spawn series values with real eBay sold data.',
    accent: '#37474f',
    highlights: ['McFarlane Series 1–35', 'Deluxe', 'Ultra-Action'],
  },
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ genre: string }> }
): Promise<Metadata> {
  const { genre } = await params
  const meta = GENRE_META[genre]
  if (!meta) return {}

  return {
    title: `${meta.label} Action Figure Prices | FigurePinner`,
    description: meta.description,
    alternates: {
      canonical: `https://figurepinner.com/${genre}`,
    },
    openGraph: {
      title: `${meta.label} Action Figure Prices | FigurePinner`,
      description: meta.description,
      url: `https://figurepinner.com/${genre}`,
    },
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
      imageUrl:     f.canonical_image_url ?? null,
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

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${meta.label} Action Figure Prices`,
    description: meta.description,
    url: `https://figurepinner.com/${genre}`,
    numberOfItems: totalFigures,
    itemListElement: lines.slice(0, 5).flatMap(line =>
      line.figures.slice(0, 10).map((f, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://figurepinner.com${f.canonicalUrl}`,
        name: f.name,
      }))
    ),
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Genre accent color override */}
      <style>{`
        :root { --genre-accent: ${meta.accent}; }
        .genre-tag { background: color-mix(in srgb, ${meta.accent} 15%, var(--s2)); border-color: color-mix(in srgb, ${meta.accent} 30%, var(--border)); color: ${meta.accent}; }
        @media (max-width: 640px) {
          .genre-hero-grid { grid-template-columns: 1fr !important; }
          .genre-stats-bar { flex-direction: column !important; }
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
        <a href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', letterSpacing: '0.04em', color: 'var(--text)', textDecoration: 'none' }}>
          FIGUREPINNER
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href="/search" style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'none' }}>Search</a>
          <a href="/pro" style={{
            padding: '5px 12px', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: '600',
            background: 'var(--blue)', color: '#fff', textDecoration: 'none',
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
        </div>
      </header>

      {/* Ad */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '1.25rem 1.5rem 0' }}>
        <AdSlot slot="leaderboard" />
      </div>

      {/* Line accordion */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1.5rem 5rem' }}>
        <GenreLineAccordion lines={lines} accent={meta.accent} genre={genre} />

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
