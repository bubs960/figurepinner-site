import type { Metadata } from 'next'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const metadata: Metadata = {
  title: 'News — FigurePinner',
  description: 'Action figure release announcements, line news, and license updates across all 17 genres.',
  alternates: { canonical: 'https://figurepinner.com/news' },
}

// ISR — feed re-renders at most every 5 min. Matches /api/news cache TTL.
export const revalidate = 300

interface NewsEvent {
  id: string
  title: string
  body: string | null
  url: string | null
  genre: string | null
  figure_id: string | null
  pinned: number
  published_at: string
  created_at: string
}

const GENRE_LABELS: Record<string, { label: string; emoji: string }> = {
  wrestling:                       { label: 'Wrestling',      emoji: '🤼' },
  marvel:                          { label: 'Marvel',         emoji: '🦸' },
  'star-wars':                     { label: 'Star Wars',      emoji: '⚔️' },
  dc:                              { label: 'DC',             emoji: '🦇' },
  transformers:                    { label: 'Transformers',   emoji: '🤖' },
  gijoe:                           { label: 'GI Joe',         emoji: '🪖' },
  'masters-of-the-universe':       { label: 'MOTU',           emoji: '⚡' },
  'teenage-mutant-ninja-turtles':  { label: 'TMNT',           emoji: '🐢' },
  'power-rangers':                 { label: 'Power Rangers',  emoji: '🦕' },
  'indiana-jones':                 { label: 'Indiana Jones',  emoji: '🎩' },
  ghostbusters:                    { label: 'Ghostbusters',   emoji: '👻' },
  'mythic-legions':                { label: 'Mythic Legions', emoji: '🗡️' },
  thundercats:                     { label: 'ThunderCats',    emoji: '🐱' },
  'action-force':                  { label: 'Action Force',   emoji: '🎖️' },
  'dungeons-dragons':              { label: 'D&D',            emoji: '🐉' },
  neca:                            { label: 'NECA',           emoji: '🎬' },
  spawn:                           { label: 'Spawn',          emoji: '🦇' },
}

async function fetchEvents(genre: string | null): Promise<NewsEvent[]> {
  try {
    const { env } = await getCloudflareContext()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (env as any).DB as D1Database | undefined
    if (!db) return []

    if (genre) {
      const { results } = await db
        .prepare(`
          SELECT id, title, body, url, genre, figure_id, pinned, published_at, created_at
          FROM news_events
          WHERE published_at <= datetime('now') AND genre = ?
          ORDER BY pinned DESC, published_at DESC
          LIMIT 50
        `)
        .bind(genre)
        .all()
      return results as unknown as NewsEvent[]
    }

    const { results } = await db
      .prepare(`
        SELECT id, title, body, url, genre, figure_id, pinned, published_at, created_at
        FROM news_events
        WHERE published_at <= datetime('now')
        ORDER BY pinned DESC, published_at DESC
        LIMIT 50
      `)
      .all()
    return results as unknown as NewsEvent[]
  } catch {
    return []
  }
}

/** Fetches the distinct genre slugs that have at least one published event,
 *  so we only show filter pills for genres with actual content. */
async function fetchAvailableGenres(): Promise<string[]> {
  try {
    const { env } = await getCloudflareContext()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (env as any).DB as D1Database | undefined
    if (!db) return []
    const { results } = await db
      .prepare(`
        SELECT DISTINCT genre FROM news_events
        WHERE published_at <= datetime('now') AND genre IS NOT NULL
        ORDER BY genre
      `)
      .all()
    return (results as Array<{ genre: string }>).map(r => r.genre).filter(Boolean)
  } catch {
    return []
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso.replace(' ', 'T') + 'Z')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return iso }
}

function prettifyGenre(g: string | null): string | null {
  if (!g) return null
  return GENRE_LABELS[g]?.label ?? g.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

interface PageProps {
  searchParams: Promise<{ genre?: string }>
}

export default async function NewsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const genre = params.genre?.trim() || null

  const [events, availableGenres] = await Promise.all([
    fetchEvents(genre),
    fetchAvailableGenres(),
  ])

  return (
    <main style={{
      background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)',
      fontFamily: 'var(--font-body)',
    }}>
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '4rem 1.5rem' }}>
        <div style={{
          display: 'inline-block', fontSize: '0.7rem', fontWeight: 800,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--blue)',
          marginBottom: 12,
        }}>
          News &amp; Releases{genre ? ` · ${prettifyGenre(genre)}` : ''}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)',
          letterSpacing: '0.03em', lineHeight: 1.05, marginBottom: 12,
        }}>
          What&apos;s new in <span style={{ color: '#E63946' }}>action figures</span>.
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          Release announcements, license updates, and line news across all 17 genres.
        </p>

        {availableGenres.length > 1 && (
          <nav aria-label="Filter by genre" style={{
            display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem',
          }}>
            <Link
              href="/news"
              style={pillStyle(genre === null)}
            >
              All news
            </Link>
            {availableGenres.map((g) => (
              <Link
                key={g}
                href={`/news?genre=${encodeURIComponent(g)}`}
                style={pillStyle(genre === g)}
              >
                {GENRE_LABELS[g]?.emoji ?? '·'} {prettifyGenre(g)}
              </Link>
            ))}
          </nav>
        )}

        {events.length === 0 ? (
          <div style={{
            background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 14,
            padding: '2rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>📰</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
              {genre ? `No ${prettifyGenre(genre)} news yet` : 'No news yet'}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
              {genre ? (
                <>Check <Link href="/news" style={{ color: 'var(--blue)' }}>all news</Link> or come back soon.</>
              ) : (
                'We post collector-relevant updates here as they break. Check back soon.'
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {events.map((e) => (
              <article
                key={e.id}
                style={{
                  background: 'var(--s1)',
                  border: `1px solid ${e.pinned ? 'rgba(255,184,0,0.3)' : 'var(--border)'}`,
                  borderRadius: 14, padding: '1.5rem', position: 'relative',
                }}
              >
                {e.pinned === 1 && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: '#FFB800',
                    background: 'rgba(255,184,0,0.1)', padding: '3px 8px', borderRadius: 9999,
                    border: '1px solid rgba(255,184,0,0.25)',
                  }}>
                    📌 Pinned
                  </div>
                )}
                <div style={{
                  display: 'flex', gap: '0.625rem', marginBottom: '0.5rem',
                  fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '0.04em',
                  textTransform: 'uppercase', fontWeight: 600,
                }}>
                  <time>{formatDate(e.published_at)}</time>
                  {e.genre && (
                    <>
                      <span style={{ color: 'var(--dim)' }}>·</span>
                      <Link
                        href={`/news?genre=${encodeURIComponent(e.genre)}`}
                        style={{ color: 'var(--blue)', textDecoration: 'none' }}
                      >
                        {prettifyGenre(e.genre)}
                      </Link>
                    </>
                  )}
                </div>
                <h2 style={{
                  fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)',
                  marginBottom: e.body ? '0.5rem' : 0, lineHeight: 1.35,
                }}>
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noopener noreferrer"
                       style={{ color: 'var(--text)', textDecoration: 'none' }}>
                      {e.title} <span style={{ color: 'var(--blue)', fontSize: '0.85em' }}>↗</span>
                    </a>
                  ) : (
                    e.title
                  )}
                </h2>
                {e.body && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 0 }}>
                    {e.body}
                  </p>
                )}
                {e.figure_id && (
                  <a
                    href={`/figure/${e.figure_id}`}
                    style={{
                      display: 'inline-block', marginTop: '0.75rem',
                      fontSize: '0.78rem', fontWeight: 600, color: 'var(--blue)',
                      textDecoration: 'none',
                    }}
                  >
                    See figure detail →
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
    fontSize: '0.78rem', fontWeight: 600,
    color: active ? '#fff' : 'var(--muted)',
    background: active ? 'var(--blue)' : 'var(--s1)',
    border: `1px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
    borderRadius: 9999, padding: '0.4rem 0.875rem',
    textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
  }
}
