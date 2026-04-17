import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllFandoms, getFiguresByFandom, deriveName, figureUrl, type KBFigure } from '@/data/kb'
import AdSlot from '@/app/components/AdSlot'

export const runtime = 'edge'
export const dynamicParams = false  // only pre-built genre slugs are valid

// ── Static generation ─────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return getAllFandoms().map(fandom => ({ genre: fandom }))
}

// ── Metadata ──────────────────────────────────────────────────────────────────

const GENRE_META: Record<string, { label: string; emoji: string; description: string }> = {
  'wrestling':                   { label: 'Wrestling',       emoji: '🤼', description: 'WWE, AEW, and wrestling action figure prices. Track Mattel Elite, Hasbro, Jakks, Entrance Greats values across 8,000+ figures.' },
  'marvel':                      { label: 'Marvel',          emoji: '🦸', description: 'Marvel Legends, Spider-Man, and Marvel action figure prices. Track Hasbro and ToyBiz values across your collection.' },
  'star-wars':                   { label: 'Star Wars',       emoji: '⚔️', description: 'Star Wars action figure prices. Black Series, Vintage Collection, Power of the Force values with real eBay sold data.' },
  'dc':                          { label: 'DC',              emoji: '🦇', description: 'DC action figure prices. McFarlane, DC Direct, DC Universe Classics values with real eBay sold data.' },
  'transformers':                { label: 'Transformers',    emoji: '🤖', description: 'Transformers action figure prices. Masterpiece, Studio Series, Generations values with real eBay sold data.' },
  'gijoe':                       { label: 'G.I. Joe',        emoji: '🪖', description: 'G.I. Joe action figure prices. Classified Series, vintage values with real eBay sold data.' },
  'masters-of-the-universe':     { label: 'Masters of the Universe', emoji: '⚡', description: 'Masters of the Universe action figure prices. Origins, Masterverse, vintage MOTU values.' },
  'teenage-mutant-ninja-turtles': { label: 'TMNT',           emoji: '🐢', description: 'Teenage Mutant Ninja Turtles action figure prices. NECA, Playmates, Super7 values with real eBay sold data.' },
  'power-rangers':               { label: 'Power Rangers',   emoji: '🦕', description: 'Power Rangers action figure prices. Lightning Collection, vintage values with real eBay sold data.' },
  'indiana-jones':               { label: 'Indiana Jones',   emoji: '🎩', description: 'Indiana Jones action figure prices. Adventure Series values with real eBay sold data.' },
  'ghostbusters':                { label: 'Ghostbusters',    emoji: '👻', description: 'Ghostbusters action figure prices. Plasma Series, vintage values with real eBay sold data.' },
  'mythic-legions':              { label: 'Mythic Legions',  emoji: '🗡️', description: 'Mythic Legions action figure prices. Four Horsemen values with real eBay sold data.' },
  'thundercats':                 { label: 'Thundercats',     emoji: '🐱', description: 'Thundercats action figure prices. Super7, LJN vintage values with real eBay sold data.' },
  'action-force':                { label: 'Action Force',    emoji: '🎖️', description: 'Action Force action figure prices. Values with real eBay sold data.' },
  'dungeons-dragons':            { label: 'Dungeons & Dragons', emoji: '🐉', description: 'Dungeons & Dragons action figure prices. Golden Archive, vintage values with real eBay sold data.' },
  'neca':                        { label: 'Horror & Film',   emoji: '🎬', description: 'NECA Horror & Film action figure prices. Ultimate figures, vintage values with real eBay sold data.' },
  'spawn':                       { label: 'Spawn',           emoji: '🦇', description: 'Spawn action figure prices. McFarlane Toys Spawn series values with real eBay sold data.' },
}

export async function generateMetadata(
  { params }: { params: Promise<{ genre: string }> }
): Promise<Metadata> {
  const { genre } = await params
  const meta = GENRE_META[genre]
  if (!meta) return {}

  return {
    title: `${meta.label} Action Figure Prices`,
    description: meta.description,
    openGraph: {
      title: `${meta.label} Action Figure Prices | FigurePinner`,
      description: meta.description,
      url: `https://figurepinner.com/${genre}`,
    },
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Cap figures shown per product line — prevents massive HTML on large genres (wrestling = 8K+)
const MAX_PER_LINE = 48

function groupByLine(figures: KBFigure[]): Map<string, KBFigure[]> {
  const map = new Map<string, KBFigure[]>()
  for (const f of figures) {
    const key = f.product_line
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(f)
  }
  // Sort each group by release_wave desc (newest first) then character alpha, cap at MAX_PER_LINE
  for (const [key, group] of map) {
    group.sort((a, b) => {
      const wA = parseInt(a.release_wave) || 0
      const wB = parseInt(b.release_wave) || 0
      if (wA !== wB) return wB - wA  // newest wave first
      return a.character_canonical.localeCompare(b.character_canonical)
    })
    map.set(key, group.slice(0, MAX_PER_LINE))
  }
  return map
}

function formatLineName(line: string): string {
  return line
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
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

  const byLine = groupByLine(figures)
  const totalFigures = figures.length

  // Full counts before capping (for display) — reuse already-fetched figures array
  const fullCounts = figures.reduce((acc, f) => {
    acc.set(f.product_line, (acc.get(f.product_line) ?? 0) + 1)
    return acc
  }, new Map<string, number>())

  // Unique lines sorted by total count desc (biggest lines first)
  const sortedLines = [...byLine.entries()].sort(
    (a, b) => (fullCounts.get(b[0]) ?? 0) - (fullCounts.get(a[0]) ?? 0)
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>

      {/* Top nav */}
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
          <a href="/app" style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'none' }}>Search</a>
          <a href="/pro" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8125rem' }}>Try Pro</a>
        </div>
      </nav>

      {/* Hero */}
      <header style={{
        maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem 2rem',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <a href="/" style={{ fontSize: '0.8125rem', color: 'var(--muted)', textDecoration: 'none' }}>Home</a>
          <span style={{ color: 'var(--dim)' }}>›</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{meta.label}</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          letterSpacing: '0.04em',
          marginBottom: '0.75rem',
        }}>
          {meta.emoji} {meta.label.toUpperCase()} FIGURE PRICES
        </h1>

        <p style={{ fontSize: '1rem', color: 'var(--muted)', maxWidth: '640px', marginBottom: '1.5rem' }}>
          {meta.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-blue">{totalFigures.toLocaleString()} figures</span>
          <span className="badge badge-blue">{byLine.size} product lines</span>
          <a href="/app" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            fontSize: '0.875rem', color: 'var(--blue)', textDecoration: 'none',
          }}>
            Search all {meta.label} figures →
          </a>
        </div>
      </header>

      {/* Jump links */}
      {sortedLines.length > 3 && (
        <div style={{
          maxWidth: '1100px', margin: '0 auto', padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginRight: '0.25rem' }}>LINES:</span>
          {sortedLines.slice(0, 12).map(([line]) => (
            <a
              key={line}
              href={`#line-${line}`}
              style={{
                fontSize: '0.75rem', padding: '3px 10px',
                background: 'var(--s2)', border: '1px solid var(--border)',
                borderRadius: 'var(--rf)', color: 'var(--muted)', textDecoration: 'none',
              }}
            >
              {formatLineName(line)}
            </a>
          ))}
        </div>
      )}

      {/* Ad slot — leaderboard below hero, before figures */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 1.5rem 0' }}>
        <AdSlot slot="leaderboard" />
      </div>

      {/* Main content */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {sortedLines.map(([line, lineFigures]) => (
          <section key={line} id={`line-${line}`} style={{ marginBottom: '3rem' }}>

            {/* Line header */}
            {(() => {
              const total = fullCounts.get(line) ?? lineFigures.length
              const capped = total > lineFigures.length
              return (
                <div style={{
                  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                  marginBottom: '1rem', gap: '1rem',
                }}>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text)' }}>
                    {formatLineName(line)}
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', flexShrink: 0 }}>
                    {capped
                      ? `${lineFigures.length} of ${total} figures`
                      : `${lineFigures.length} figure${lineFigures.length !== 1 ? 's' : ''}`
                    }
                    {capped && (
                      <a href="/app" style={{ marginLeft: '0.5rem', color: 'var(--blue)', textDecoration: 'none', fontSize: '0.7rem' }}>
                        Search all →
                      </a>
                    )}
                  </span>
                </div>
              )
            })()}

            {/* Figure grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.5rem',
            }}>
              {lineFigures.map(f => (
                <FigureCard key={f.figure_id} figure={f} />
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <div style={{
          marginTop: '2rem', padding: '2rem',
          background: 'var(--s1)', border: '1px solid var(--border)',
          borderRadius: 'var(--rlg)', textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            Track Your {meta.label} Collection
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1.25rem', maxWidth: '480px', margin: '0 auto 1.25rem' }}>
            Search real eBay sold prices, set deal alerts, and track your collection value with FigurePinner Pro.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/sign-up" className="btn btn-primary btn-lg">Get Started Free</a>
            <a href="/pro" className="btn btn-ghost btn-lg">See Pro Features</a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1.5rem',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--dim)' }}>
          © 2024 FigurePinner · <a href="/privacy" style={{ color: 'var(--dim)' }}>Privacy</a> · <a href="/pro" style={{ color: 'var(--dim)' }}>Pro</a>
        </p>
      </footer>
    </div>
  )
}

// ── Figure card ───────────────────────────────────────────────────────────────

function FigureCard({ figure }: { figure: KBFigure }) {
  const name = deriveName(figure)
  const url = figureUrl(figure)
  const hasImage = !!figure.canonical_image_url

  return (
    <a
      href={url}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        padding: '0.625rem 0.75rem',
        background: 'var(--s1)', border: '1px solid var(--border)',
        borderRadius: 'var(--r)', textDecoration: 'none',
        color: 'var(--text)', fontSize: '0.8125rem',
        transition: 'border-color 0.15s',
        minWidth: 0,
      }}
      // inline hover handled client-side — server renders base state
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={figure.canonical_image_url!}
          alt=""
          width={36}
          height={36}
          style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 4, flexShrink: 0, background: 'var(--s2)' }}
          loading="lazy"
        />
      ) : (
        <div style={{ width: 36, height: 36, borderRadius: 4, background: 'var(--s2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--dim)' }}>
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <circle cx="8" cy="6" r="1.5" />
            <path d="M4 12c0-2.2 1.8-4 4-4s4 1.8 4 4" />
          </svg>
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: '500', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </div>
        {figure.exclusive_to && (
          <div style={{ fontSize: '0.7rem', color: 'var(--orange)', marginTop: '1px' }}>
            {figure.exclusive_to}
          </div>
        )}
      </div>
    </a>
  )
}
