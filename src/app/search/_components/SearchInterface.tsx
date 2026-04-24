'use client'
/**
 * SearchInterface.tsx
 * Full-page search experience. Features:
 *   - Pre-filled from URL ?q= param (SSR → hydrate)
 *   - Debounced live search against /api/v1/search
 *   - Genre filter pills (show only matching genre)
 *   - Results grid with figure cards
 *   - URL updated via history.pushState on every query change (shareable links)
 *   - No auth required
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchResult = {
  figure_id?: string
  name: string
  brand: string
  line: string
  series: string
  genre: string
  year: number | null
  image?: string | null
  // Raw slugs for building pretty URLs
  fandom_slug?: string
  line_slug?: string
  character_slug?: string
}

// ─── Genre config ─────────────────────────────────────────────────────────────

const GENRES = [
  { slug: 'wrestling',                  name: 'Wrestling',         emoji: '🤼', accent: '#E63946' },
  { slug: 'marvel',                     name: 'Marvel',            emoji: '🦸', accent: '#E63946' },
  { slug: 'star-wars',                  name: 'Star Wars',         emoji: '⚔️', accent: '#FFD700' },
  { slug: 'dc',                         name: 'DC',                emoji: '🦇', accent: '#1565C0' },
  { slug: 'transformers',               name: 'Transformers',      emoji: '🤖', accent: '#E65100' },
  { slug: 'gijoe',                      name: 'GI Joe',            emoji: '🪖', accent: '#388E3C' },
  { slug: 'masters-of-the-universe',    name: 'MOTU',              emoji: '⚡', accent: '#7B1FA2' },
  { slug: 'teenage-mutant-ninja-turtles', name: 'TMNT',            emoji: '🐢', accent: '#388E3C' },
  { slug: 'power-rangers',              name: 'Power Rangers',     emoji: '🦕', accent: '#D32F2F' },
  { slug: 'indiana-jones',              name: 'Indiana Jones',     emoji: '🎩', accent: '#8D6E63' },
  { slug: 'ghostbusters',               name: 'Ghostbusters',      emoji: '👻', accent: '#F9A825' },
  { slug: 'mythic-legions',             name: 'Mythic Legions',    emoji: '🗡️', accent: '#546E7A' },
  { slug: 'thundercats',                name: 'ThunderCats',       emoji: '🐱', accent: '#E65100' },
  { slug: 'action-force',               name: 'Action Force',      emoji: '🎖️', accent: '#1565C0' },
  { slug: 'dungeons-dragons',           name: 'D&D',               emoji: '🐉', accent: '#6A1B9A' },
  { slug: 'neca',                       name: 'NECA',              emoji: '🎬', accent: '#37474F' },
  { slug: 'spawn',                      name: 'Spawn',             emoji: '🦇', accent: '#212121' },
] as const

type GenreSlug = typeof GENRES[number]['slug']

const GENRE_MAP = Object.fromEntries(GENRES.map(g => [g.slug, g])) as Record<string, typeof GENRES[number]>

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialQuery: string
}

export default function SearchInterface({ initialQuery }: Props) {
  const [query, setQuery]             = useState(initialQuery)
  const [results, setResults]         = useState<SearchResult[]>([])
  const [loading, setLoading]         = useState(false)
  const [searched, setSearched]       = useState(false)   // true after first fetch
  const [activeGenre, setActiveGenre] = useState<GenreSlug | null>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const debounce  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Focus input on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // ── Run search (called by debounce + initial query)
  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}&limit=48`)
      if (res.ok) {
        const data = await res.json() as { figures: SearchResult[] }
        setResults(data.figures ?? [])
        setSearched(true)
        setActiveGenre(null)   // reset genre filter on new search
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Debounce on query change
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      // update URL (no navigation, shareable link)
      const url = query.trim()
        ? `/search?q=${encodeURIComponent(query.trim())}`
        : '/search'
      window.history.replaceState(null, '', url)
      runSearch(query.trim())
    }, 260)
    return () => { if (debounce.current) clearTimeout(debounce.current) }
  }, [query, runSearch])

  // ── Initial load: run if there's a pre-filled query
  useEffect(() => {
    if (initialQuery.length >= 2) runSearch(initialQuery)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Genre filter
  const availableGenres = searched
    ? GENRES.filter(g => results.some(r => r.genre === g.slug))
    : []

  const filtered = activeGenre
    ? results.filter(r => r.genre === activeGenre)
    : results

  // ── Key handler (Esc clears)
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setQuery('')
      setResults([])
      setSearched(false)
    }
  }

  return (
    <div style={{ padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 5vw, 3rem)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 800,
            color: 'var(--text)',
            marginBottom: '0.375rem',
            letterSpacing: '-0.02em',
          }}>
            Search Figures
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', margin: 0 }}>
            20,000+ figures across wrestling, Marvel, Star Wars, and more
          </p>
        </div>

        {/* ── Search input ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--s1)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '0 16px',
          gap: 10,
          marginBottom: '1.25rem',
          boxShadow: '0 0 0 0px transparent',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
          onFocus={() => {}}
        >
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by name, character, or series…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            aria-label="Search figures"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: '1.0625rem',
              padding: '16px 0',
              fontFamily: 'var(--font-ui)',
            }}
          />
          {loading && <SpinnerIcon />}
          {!loading && query.length > 0 && (
            <ClearButton onClick={() => { setQuery(''); setResults([]); setSearched(false) }} />
          )}
        </div>

        {/* ── Genre filter pills (only show when there are results to filter) ── */}
        {availableGenres.length > 1 && (
          <div style={{
            display: 'flex',
            gap: '0.375rem',
            flexWrap: 'wrap',
            marginBottom: '1.5rem',
          }}>
            <FilterPill
              label="All"
              active={activeGenre === null}
              count={results.length}
              accent="var(--blue)"
              onClick={() => setActiveGenre(null)}
            />
            {availableGenres.map(g => (
              <FilterPill
                key={g.slug}
                label={`${g.emoji} ${g.name}`}
                active={activeGenre === g.slug}
                count={results.filter(r => r.genre === g.slug).length}
                accent={g.accent}
                onClick={() => setActiveGenre(activeGenre === g.slug ? null : g.slug)}
              />
            ))}
          </div>
        )}

        {/* ── Results ── */}
        {searched && !loading && filtered.length === 0 && (
          <EmptyState query={query} />
        )}

        {filtered.length > 0 && (
          <>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--dim)',
              marginBottom: '0.875rem',
              fontWeight: 500,
            }}>
              {filtered.length === results.length
                ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
                : `${filtered.length} of ${results.length} results · filtered to ${GENRE_MAP[activeGenre!]?.name}`
              }
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '0.625rem',
            }}>
              {filtered.map((r, i) => (
                <FigureResultCard key={r.figure_id ?? i} result={r} query={query} />
              ))}
            </div>

            {results.length >= 48 && (
              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--dim)' }}>
                  Showing top 48 results — try a more specific search to narrow down
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Idle state — no query yet ── */}
        {!searched && !loading && query.length < 2 && (
          <IdlePrompt />
        )}

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterPill({
  label, active, count, accent, onClick,
}: {
  label: string
  active: boolean
  count: number
  accent: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.3125rem 0.75rem',
        borderRadius: '9999px',
        border: `1px solid ${active ? accent : 'var(--border)'}`,
        background: active ? `${accent}18` : 'var(--s1)',
        color: active ? accent : 'var(--muted)',
        fontSize: '0.78125rem',
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        transition: 'all 0.12s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      <span style={{
        fontSize: '0.65rem',
        background: active ? `${accent}28` : 'var(--s2)',
        color: active ? accent : 'var(--dim)',
        padding: '0.0625rem 0.375rem',
        borderRadius: '9999px',
        fontWeight: 700,
      }}>
        {count}
      </span>
    </button>
  )
}

function FigureResultCard({ result: r, query }: { result: SearchResult; query: string }) {
  const genre  = GENRE_MAP[r.genre]
  const accent = genre?.accent ?? '#FF5F00'
  // Prefer keyword-rich pretty URL when slug fields are available
  const href = (r.fandom_slug && r.line_slug && r.character_slug)
    ? `/${r.fandom_slug}/${r.line_slug}/${r.character_slug}`
    : r.figure_id
      ? `/figure/${r.figure_id}`
      : `/search?q=${encodeURIComponent(r.name)}`

  return (
    <a
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: 'var(--s1)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        textDecoration: 'none',
        color: 'var(--text)',
        transition: 'border-color 0.12s, background 0.12s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = accent + '66'
        e.currentTarget.style.background = accent + '0A'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.background = 'var(--s1)'
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 52, height: 52, borderRadius: 8, flexShrink: 0,
        background: 'var(--s2)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', fontSize: '1.4rem',
      }}>
        {r.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={r.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} loading="lazy" />
          : (genre?.emoji ?? '🤼')
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600,
          fontSize: '0.875rem',
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: 3,
        }}>
          {highlightMatch(r.name, query)}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.4 }}>
          {r.brand} · {r.line}{r.series ? ` · Ser. ${r.series}` : ''}{r.year ? ` · ${r.year}` : ''}
        </div>
        <div style={{ marginTop: 4 }}>
          <span style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            padding: '0.1rem 0.4rem',
            borderRadius: '9999px',
            background: accent + '18',
            color: accent,
            border: `1px solid ${accent}30`,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {genre?.name ?? r.genre}
          </span>
        </div>
      </div>

      {/* CTA arrow */}
      <div style={{
        flexShrink: 0,
        fontSize: '0.7rem',
        fontWeight: 700,
        color: accent,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        opacity: 0.85,
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 7h10M7 2l5 5-5 5" />
        </svg>
        <span style={{ fontSize: '0.6rem', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>View</span>
      </div>
    </a>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '4rem 2rem',
      color: 'var(--muted)',
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
      <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>
        No results for &ldquo;{query}&rdquo;
      </p>
      <p style={{ fontSize: '0.875rem', color: 'var(--muted)', maxWidth: 380, margin: '0 auto' }}>
        Try a character name, figure series, or brand. E.g. &ldquo;Elite 91&rdquo;, &ldquo;Black Series&rdquo;, or &ldquo;Wolverine&rdquo;.
      </p>
    </div>
  )
}

function IdlePrompt() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '4rem 2rem',
      color: 'var(--muted)',
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📦</div>
      <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>
        Search 20,000+ figures
      </p>
      <p style={{ fontSize: '0.875rem', maxWidth: 380, margin: '0 auto 2rem' }}>
        Find prices, values, and collector info for any action figure in our database.
      </p>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
        justifyContent: 'center', maxWidth: 500, margin: '0 auto',
      }}>
        {['Roman Reigns', 'Black Series Luke', 'Elite 91', 'Wolverine', 'Optimus Prime', 'He-Man'].map(s => (
          <SuggestChip key={s} text={s} />
        ))}
      </div>
    </div>
  )
}

function SuggestChip({ text }: { text: string }) {
  return (
    <a
      href={`/search?q=${encodeURIComponent(text)}`}
      style={{
        padding: '0.375rem 0.875rem',
        borderRadius: '9999px',
        border: '1px solid var(--border)',
        background: 'var(--s1)',
        fontSize: '0.8125rem',
        color: 'var(--muted)',
        textDecoration: 'none',
        fontWeight: 500,
        transition: 'border-color 0.12s, color 0.12s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--blue)'
        e.currentTarget.style.color = 'var(--blue)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.color = 'var(--muted)'
      }}
    >
      {text}
    </a>
  )
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <strong style={{ color: 'var(--blue)', fontWeight: 700 }}>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ color: 'var(--muted)', flexShrink: 0 }}>
      <circle cx="7.5" cy="7.5" r="5" />
      <line x1="11.5" y1="11.5" x2="16" y2="16" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--muted)', flexShrink: 0, animation: 'search-spin 0.7s linear infinite' }}>
      <style>{`@keyframes search-spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="22 16" strokeLinecap="round" />
    </svg>
  )
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Clear search"
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--muted)', display: 'flex', padding: 4, flexShrink: 0,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <line x1="2" y1="2" x2="12" y2="12" />
        <line x1="12" y1="2" x2="2" y2="12" />
      </svg>
    </button>
  )
}
