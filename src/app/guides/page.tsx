import type { Metadata } from 'next'
import { getFiguresByFandom, getLinesByFandom } from '@/data/kb'
import { TOTAL_FIGURES_LABEL } from '@/data/kb-stats'
import { ARTICLES } from './_data/articles'

/**
 * /guides — Price Guide hub.
 * Lists every genre price guide with a live figure + line ("guide") count
 * pulled straight from the KB. Each card links to its /[genre] guide, which
 * in turn breaks down into per-line guides. This is the canonical home for
 * the footer + nav "Price Guide" link (previously dumped to /search).
 *
 * Original card treatment — accent monogram tiles, no emoji/generic icons.
 */

// URL slug → KB fandom slug (URL slugs are pretty; KB slugs are canonical).
// Mirrors SLUG_TO_FANDOM in /[genre]/page.tsx.
const SLUG_TO_FANDOM: Record<string, string> = {
  'teenage-mutant-ninja-turtles': 'tmnt',
  'gijoe': 'gi-joe',
  'marvel': 'marvel-comics',
  'dungeons-dragons': 'dungeons-dragons',
}

type GenreDef = {
  slug: string
  label: string
  blurb: string
  accent: string
  highlights: string[]
}

const GENRES: GenreDef[] = [
  { slug: 'wrestling', label: 'Wrestling', accent: '#e53238', blurb: 'WWE, AEW, WCW — Mattel Elite, Jakks, Hasbro WWF.', highlights: ['Mattel Elite', 'Jakks Pacific', 'Hasbro WWF'] },
  { slug: 'marvel', label: 'Marvel', accent: '#e23636', blurb: 'Marvel Legends, Spider-Man, vintage ToyBiz.', highlights: ['Marvel Legends', 'ToyBiz Classics', 'Spider-Man'] },
  { slug: 'star-wars', label: 'Star Wars', accent: '#3d7bca', blurb: 'Black Series, Vintage Collection, Power of the Force.', highlights: ['Black Series', 'Vintage Collection', 'POTF'] },
  { slug: 'dc', label: 'DC', accent: '#3a6fbf', blurb: 'McFarlane, DC Direct, DC Universe Classics.', highlights: ['McFarlane Toys', 'DCUC', 'DC Direct'] },
  { slug: 'transformers', label: 'Transformers', accent: '#c44f0e', blurb: 'Masterpiece, Studio Series, Generations.', highlights: ['Masterpiece', 'Studio Series', 'Generations'] },
  { slug: 'gijoe', label: 'G.I. Joe', accent: '#2e7d32', blurb: 'Classified Series and A Real American Hero.', highlights: ['Classified', 'A Real American Hero', 'Sigma 6'] },
  { slug: 'masters-of-the-universe', label: 'Masters of the Universe', accent: '#b8860b', blurb: 'Masterverse, Origins, vintage MOTU.', highlights: ['Masterverse', 'Origins', 'Vintage MOTU'] },
  { slug: 'teenage-mutant-ninja-turtles', label: 'TMNT', accent: '#2e7d32', blurb: 'NECA Ultimate, Playmates vintage, Super7.', highlights: ['NECA Ultimate', 'Playmates', 'Super7 ReAction'] },
  { slug: 'power-rangers', label: 'Power Rangers', accent: '#d32f2f', blurb: 'Lightning Collection and vintage Bandai.', highlights: ['Lightning Collection', 'Vintage Bandai', 'Legacy'] },
  { slug: 'indiana-jones', label: 'Indiana Jones', accent: '#8d6e63', blurb: 'Adventure Series and vintage Kenner.', highlights: ['Adventure Series', 'Vintage Kenner'] },
  { slug: 'ghostbusters', label: 'Ghostbusters', accent: '#5e35b1', blurb: 'Plasma Series, Kenner Real Ghostbusters.', highlights: ['Plasma Series', 'Kenner RGB', 'Afterlife'] },
  { slug: 'mythic-legions', label: 'Mythic Legions', accent: '#7b5e3a', blurb: 'Four Horsemen — Advent of Decay, Necronominus.', highlights: ['Four Horsemen', 'Advent of Decay', 'Necronominus'] },
  { slug: 'thundercats', label: 'Thundercats', accent: '#f57c00', blurb: 'Super7 Ultimates, LJN vintage, Bandai.', highlights: ['Super7 Ultimates', 'LJN Vintage', 'Bandai'] },
  { slug: 'dungeons-dragons', label: 'Dungeons & Dragons', accent: '#6a1b9a', blurb: 'Golden Archive, LJN vintage, Hasbro.', highlights: ['Golden Archive', 'LJN Vintage', 'Hasbro'] },
  { slug: 'neca', label: 'Horror & Film', accent: '#b71c1c', blurb: 'NECA Ultimate, Retro, Toony Terrors.', highlights: ['NECA Ultimate', 'Retro', 'Toony Terrors'] },
  { slug: 'spawn', label: 'Spawn', accent: '#37474f', blurb: 'McFarlane Toys Spawn Series 1–35, Deluxe.', highlights: ['Series 1–35', 'Deluxe', 'Ultra-Action'] },
  { slug: 'action-force', label: 'Action Force', accent: '#455a64', blurb: 'British Action Force figures and vehicles.', highlights: ['Action Force'] },
]

export const revalidate = 3600

function genreStats(slug: string): { figures: number; guides: number } {
  const fandom = SLUG_TO_FANDOM[slug] ?? slug
  try {
    const figures = getFiguresByFandom(fandom).length
    const guides = getLinesByFandom(fandom).length
    return { figures, guides }
  } catch {
    return { figures: 0, guides: 0 }
  }
}

const STATS = GENRES.map(g => ({ ...g, ...genreStats(g.slug) }))
const TOTAL_FIGURES = STATS.reduce((s, g) => s + g.figures, 0)
const TOTAL_GUIDES = STATS.reduce((s, g) => s + g.guides, 0) + GENRES.length // line guides + genre guides

export const metadata: Metadata = {
  title: 'Action Figure Price Guides — Every Genre & Line',
  description:
    `Browse FigurePinner price guides across 16 genres and 100+ figure lines — wrestling, Marvel, Star Wars, Transformers and more. Real eBay sold prices for every figure.`,
  alternates: { canonical: 'https://figurepinner.com/guides' },
  openGraph: {
    title: 'Action Figure Price Guides | FigurePinner',
    description: `Every genre, every line — real eBay sold prices for ${TOTAL_FIGURES_LABEL} action figures.`,
    url: 'https://figurepinner.com/guides',
  },
}

export default function GuidesPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>

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

        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1rem, 5vw, 2rem)' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
            color: 'var(--blue)', textTransform: 'uppercase', marginBottom: '0.875rem',
          }}>
            Price Guides
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            letterSpacing: '0.02em', lineHeight: 1.1,
            marginBottom: '1rem',
          }}>
            EVERY FIGURE. EVERY LINE. REAL PRICES.
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'var(--muted)', lineHeight: 1.7, maxWidth: 640 }}>
            {TOTAL_GUIDES.toLocaleString()} price guides across {GENRES.length} genres, built on real eBay
            sold data for {TOTAL_FIGURES_LABEL} figures. Pick a genre to drill into its lines and waves.
          </p>
        </div>

        {/* Genre guide grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '0.875rem',
        }}>
          {STATS.map(g => (
            <a
              key={g.slug}
              href={`/${g.slug}`}
              style={{
                display: 'flex', gap: '0.875rem', alignItems: 'stretch',
                padding: '0', overflow: 'hidden',
                background: 'var(--s1)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                textDecoration: 'none', color: 'var(--text)',
                transition: 'border-color 0.14s, transform 0.14s',
              }}
            >
              {/* Accent monogram tile — original, no emoji */}
              <div style={{
                flexShrink: 0, width: 84,
                background: `linear-gradient(150deg, ${g.accent} 0%, ${g.accent}99 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.02em',
                color: '#fff',
                borderRight: `1px solid ${g.accent}`,
              }}>
                {monogram(g.label)}
              </div>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0, padding: '0.875rem 1rem 0.875rem 0' }}>
                <div style={{
                  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                  gap: '0.5rem', marginBottom: '0.25rem',
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>{g.label}</span>
                  <span style={{ fontSize: '0.68rem', color: g.accent, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {g.guides > 0 ? `${g.guides} guides` : 'Guide'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.45, margin: '0 0 0.5rem' }}>
                  {g.blurb}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {g.highlights.slice(0, 3).map(h => (
                    <span key={h} style={{
                      fontSize: '0.62rem', fontWeight: 600,
                      padding: '0.1rem 0.4rem', borderRadius: 9999,
                      background: g.accent + '14', color: g.accent,
                      border: `1px solid ${g.accent}26`,
                    }}>
                      {h}
                    </span>
                  ))}
                  {g.figures > 0 && (
                    <span style={{ fontSize: '0.62rem', color: 'var(--dim)', alignSelf: 'center' }}>
                      {g.figures.toLocaleString()} figures
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Search nudge */}
        <div style={{
          marginTop: '2.5rem', padding: '1.5rem',
          background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 16,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text)', fontWeight: 600, margin: '0 0 0.5rem' }}>
            Looking for one specific figure?
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 1rem' }}>
            Skip the browse — search any character, brand, or line directly.
          </p>
          <a href="/search" className="btn btn-primary">Search figures →</a>
        </div>

        {/* Collector Guides — editorial long-form articles */}
        <section style={{ marginTop: '3.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', letterSpacing: '0.03em', color: 'var(--text)', margin: '0 0 0.5rem' }}>
            Collector Guides
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', margin: '0 0 1.25rem' }}>
            How to price, authenticate, and collect smarter — written by collectors, backed by real sold data.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {ARTICLES.map((a) => (
              <a
                key={a.slug}
                href={`/guides/${a.slug}`}
                style={{
                  display: 'block', padding: '1.25rem',
                  background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 14,
                  textDecoration: 'none',
                }}
              >
                <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--fp-accent-warm)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Guide · {a.readingMinutes} min
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, marginBottom: '0.4rem' }}>
                  {a.title}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                  {a.dek}
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>

      {/* Footer is rendered globally by the root layout (src/app/layout.tsx). */}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** 2-letter monogram from a genre label (e.g. "Star Wars" → "SW", "DC" → "DC"). */
function monogram(label: string): string {
  const words = label.replace(/&/g, '').split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return label.slice(0, 2).toUpperCase()
}
