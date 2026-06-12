import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prettyFigureUrl, type KBFigure } from '@/data/kb'
import { figuresForGenre, groupAndSortLines, toFigureRow, cardName, MAX_PER_LINE } from '@/lib/genreFigures'
import { prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'
import AdSlot from '@/app/components/AdSlot'
import GenreLineAccordion, { type LineData } from './_components/GenreLineAccordion'
import SiteHeader from '@/app/components/SiteHeader'

// ── Genre config ──────────────────────────────────────────────────────────────

const GENRE_META: Record<string, {
  label: string
  description: string
  accent: string       // CSS color for genre-specific accent
  highlights: string[] // 3 notable product lines or facts
}> = {
  'wrestling': {
    label: 'Wrestling',
    description: 'WWE, AEW, and wrestling action figure prices. Track Mattel Elite, Hasbro, Jakks, and Entrance Greats values across 8,000+ figures.',
    accent: '#e53238',
    highlights: ['Mattel Elite', 'Jakks Pacific', 'Hasbro WWF'],
  },
  'marvel': {
    label: 'Marvel',
    description: 'Marvel Legends, Spider-Man, and Marvel action figure prices. Track Hasbro and ToyBiz values across your collection.',
    accent: '#e23636',
    highlights: ['Marvel Legends', 'ToyBiz Classics', 'Spider-Man'],
  },
  'star-wars': {
    label: 'Star Wars',
    description: 'Star Wars action figure prices. Black Series, Vintage Collection, Power of the Force values with real eBay sold data.',
    accent: '#3d7bca',
    highlights: ['Black Series', 'Vintage Collection', 'Power of the Force'],
  },
  'dc': {
    label: 'DC',
    description: 'DC action figure prices. McFarlane, DC Direct, DC Universe Classics values with real eBay sold data.',
    accent: '#3a6fbf',
    highlights: ['McFarlane Toys', 'DC Universe Classics', 'DC Direct'],
  },
  'transformers': {
    label: 'Transformers',
    description: 'Transformers action figure prices. Masterpiece, Studio Series, Generations values with real eBay sold data.',
    accent: '#c44f0e',
    highlights: ['Masterpiece', 'Studio Series', 'Generations'],
  },
  'gijoe': {
    label: 'G.I. Joe',
    description: 'G.I. Joe action figure prices. Classified Series, vintage values with real eBay sold data.',
    accent: '#2e7d32',
    highlights: ['Classified Series', 'A Real American Hero', 'Sigma 6'],
  },
  'masters-of-the-universe': {
    label: 'Masters of the Universe',
    description: 'Masters of the Universe action figure prices. Origins, Masterverse, vintage MOTU values.',
    accent: '#b8860b',
    highlights: ['Masterverse', 'Origins', 'Vintage MOTU'],
  },
  'teenage-mutant-ninja-turtles': {
    label: 'TMNT',
    description: 'Teenage Mutant Ninja Turtles action figure prices. NECA, Playmates, Super7 values with real eBay sold data.',
    accent: '#2e7d32',
    highlights: ['NECA Ultimate', 'Playmates Vintage', 'Super7 ReAction'],
  },
  'power-rangers': {
    label: 'Power Rangers',
    description: 'Power Rangers action figure prices. Lightning Collection, vintage values with real eBay sold data.',
    accent: '#d32f2f',
    highlights: ['Lightning Collection', 'Vintage Bandai', 'Legacy'],
  },
  'indiana-jones': {
    label: 'Indiana Jones',
    description: 'Indiana Jones action figure prices. Adventure Series values with real eBay sold data.',
    accent: '#8d6e63',
    highlights: ['Adventure Series', 'Vintage Kenner'],
  },
  'ghostbusters': {
    label: 'Ghostbusters',
    description: 'Ghostbusters action figure prices. Plasma Series, vintage values with real eBay sold data.',
    accent: '#5e35b1',
    highlights: ['Plasma Series', 'Kenner Real Ghostbusters', 'Afterlife'],
  },
  'mythic-legions': {
    label: 'Mythic Legions',
    description: 'Mythic Legions action figure prices. Four Horsemen values with real eBay sold data.',
    accent: '#7b5e3a',
    highlights: ['Four Horsemen', 'Advent of Decay', 'Necronominus'],
  },
  'thundercats': {
    label: 'Thundercats',
    description: 'Thundercats action figure prices. Super7, LJN vintage values with real eBay sold data.',
    accent: '#f57c00',
    highlights: ['Super7 Ultimates', 'LJN Vintage', 'Bandai'],
  },
  'action-force': {
    label: 'Action Force',
    description: 'Action Force action figure prices. Values with real eBay sold data.',
    accent: '#455a64',
    highlights: ['Action Force'],
  },
  'dungeons-dragons': {
    label: 'Dungeons & Dragons',
    description: 'Dungeons & Dragons action figure prices. Golden Archive, vintage values with real eBay sold data.',
    accent: '#6a1b9a',
    highlights: ['Golden Archive', 'LJN Vintage', 'Hasbro'],
  },
  'neca': {
    label: 'Horror & Film',
    description: 'NECA Horror & Film action figure prices. Ultimate figures, vintage values with real eBay sold data.',
    accent: '#b71c1c',
    highlights: ['NECA Ultimate', 'Retro', 'Toony Terrors'],
  },
  'spawn': {
    label: 'Spawn',
    description: 'Spawn action figure prices. McFarlane Toys Spawn series values with real eBay sold data.',
    accent: '#37474f',
    highlights: ['McFarlane Series 1–35', 'Deluxe', 'Ultra-Action'],
  },
}



export const revalidate = 3600

export function generateStaticParams() {
  return Object.keys(GENRE_META).map(genre => ({ genre }))
}


// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ genre: string }> }
): Promise<Metadata> {
  const { genre } = await params
  const meta = GENRE_META[genre]
  if (!meta) return {}

  return {
    title: `${meta.label} Action Figure Prices`,
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


function formatLineName(slug: string): string {
  return prettifySlug(slug) // shared override-aware caser (W2)
}


/** Build LineData[] from raw KB figures — server-only. Only the first
 *  (default-open) line ships its figure rows; the accordion fetches the
 *  rest from /api/genre-line-figures on open (S20 payload cut — before
 *  this, /wrestling pushed 2,115 cards through the flight payload). */
function buildLineData(figures: KBFigure[]) {
  const groups = groupAndSortLines(figures)
  const lines: LineData[] = groups.map(([slug, group], i) => ({
    slug,
    displayName: formatLineName(slug),
    totalCount:  group.length,
    figureCount: Math.min(group.length, MAX_PER_LINE),
    figures:     i === 0 ? group.slice(0, MAX_PER_LINE).map(toFigureRow) : null,
  }))
  return { lines, groups, totalCount: figures.length }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function GenrePage(
  { params }: { params: Promise<{ genre: string }> }
) {
  const { genre } = await params
  const meta = GENRE_META[genre]
  if (!meta) notFound()

  const figures = figuresForGenre(genre)
  if (!figures.length) notFound()

  const { lines, groups, totalCount: totalFigures } = buildLineData(figures)
  const totalLines = lines.length

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${meta.label} Action Figure Prices`,
    description: meta.description,
    url: `https://figurepinner.com/${genre}`,
    numberOfItems: totalFigures,
    itemListElement: groups.slice(0, 5).flatMap(([, group]) =>
      group.slice(0, 10).map((f, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://figurepinner.com${prettyFigureUrl(f)}`,
        name: cardName(f),
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

      <SiteHeader />

      {/* Breadcrumb */}
      <div style={{
        maxWidth: '1100px', margin: '0 auto', padding: '0.875rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        fontSize: '0.8125rem', color: '#EEEEF5',
      }}>
        <a href="/" style={{ color: '#EEEEF5', textDecoration: 'none' }}>Home</a>
        <span>›</span>
        <span style={{ color: '#EEEEF5' }}>{meta.label}</span>
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
            <p style={{ fontSize: '0.9375rem', color: '#EEEEF5', maxWidth: '600px', lineHeight: '1.6', marginBottom: '1.5rem' }}>
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
              <a href={`/search?q=${encodeURIComponent(meta.label)}`} style={{
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
          <p style={{ fontSize: '0.9rem', color: '#EEEEF5', marginBottom: '1.5rem', maxWidth: '460px', margin: '0 auto 1.5rem' }}>
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
            <a href="/guides" style={{
              display: 'inline-block', padding: '10px 22px',
              background: 'transparent', color: '#EEEEF5',
              border: '1px solid var(--border)',
              borderRadius: '8px', fontWeight: '600', fontSize: '0.875rem', textDecoration: 'none',
            }}>
              Read the Guides
            </a>
          </div>
        </div>
      </main>

      {/* Footer is rendered globally by the root layout (src/app/layout.tsx). */}
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
      <span style={{ fontSize: '0.75rem', color: '#EEEEF5' }}>{label}</span>
    </div>
  )
}
