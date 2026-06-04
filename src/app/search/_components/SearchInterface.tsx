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
import { useUser } from '@clerk/nextjs'
import { matchCharacterHub } from '@/data/characterHubs'
import Sparkline from '@/app/components/Sparkline'

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
  const { isSignedIn, isLoaded } = useUser()
  const [query, setQuery]             = useState(initialQuery)
  const [results, setResults]         = useState<SearchResult[]>([])
  const [loading, setLoading]         = useState(false)
  const [searched, setSearched]       = useState(false)   // true after first fetch
  const [activeGenre, setActiveGenre] = useState<GenreSlug | null>(null)
  const [showAllGenres, setShowAllGenres] = useState(false)
  const [focused, setFocused]         = useState(false)
  const [trackRecord, setTrackRecord] = useState<Record<string, 'idle'|'loading'|'added'|'exists'|'error'>>({})
  const [sparklines, setSparklines]   = useState<Record<string, { points: number[]; trend: 'up'|'down'|'flat' }>>({})
  const inputRef  = useRef<HTMLInputElement>(null)
  const debounce  = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handleTrack(r: SearchResult) {
    if (!r.figure_id) return
    // Anon users: redirect to sign-up with return URL so the context is preserved
    if (isLoaded && !isSignedIn) {
      const returnTo = `/search?q=${encodeURIComponent(query)}`
      window.location.href = `/sign-up?redirect_url=${encodeURIComponent(returnTo)}`
      return
    }
    setTrackRecord(s => ({ ...s, [r.figure_id!]: 'loading' }))
    try {
      const res = await fetch('/api/wantlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figure_id: r.figure_id,
          name: r.name,
          brand: r.brand,
          line: r.line,
          genre: r.genre,
          target_price: 0,
        }),
      })
      if (res.status === 201) {
        setTrackRecord(s => ({ ...s, [r.figure_id!]: 'added' }))
      } else if (res.status === 409) {
        setTrackRecord(s => ({ ...s, [r.figure_id!]: 'exists' }))
      } else {
        setTrackRecord(s => ({ ...s, [r.figure_id!]: 'error' }))
      }
    } catch {
      setTrackRecord(s => ({ ...s, [r.figure_id!]: 'error' }))
    }
  }

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
        const data = await res.json() as { results: SearchResult[] }
        setResults(data.results ?? [])
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

  // ── Fetch sparklines when results change
  useEffect(() => {
    const ids = results.map(r => r.figure_id).filter(Boolean) as string[]
    if (!ids.length) { setSparklines({}); return }
    const idsParam = ids.slice(0, 48).join(',')
    fetch(`/api/sparklines?ids=${encodeURIComponent(idsParam)}`)
      .then(r => r.ok ? r.json() : {})
      .then(data => setSparklines(data as Record<string, { points: number[]; trend: 'up'|'down'|'flat' }>))
      .catch(() => {})
  }, [results])

  // ── Genre filter
  const availableGenres = searched
    ? GENRES.filter(g => results.some(r => r.genre === g.slug))
    : []

  const GENRE_PILL_LIMIT = 5
  const visibleGenres = showAllGenres ? availableGenres : availableGenres.slice(0, GENRE_PILL_LIMIT)
  const hiddenGenreCount = availableGenres.length - GENRE_PILL_LIMIT

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

  // ── Form submit (Enter): bypass the debounce and run search immediately
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (debounce.current) clearTimeout(debounce.current)
    const trimmed = query.trim()
    const url = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search'
    window.history.replaceState(null, '', url)
    runSearch(trimmed)
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
            22,000+ figures across wrestling, Marvel, Star Wars, and more
          </p>
        </div>

        {/* ── Search input ── */}
        <form onSubmit={handleSubmit} role="search" aria-label="Search figures">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--s1)',
            border: `1px solid ${focused ? 'var(--gold)' : 'var(--border)'}`,
            borderRadius: 12,
            padding: '0 16px',
            gap: 10,
            marginBottom: '1.25rem',
            boxShadow: focused ? '0 0 0 3px rgba(0,102,255,0.12)' : '0 0 0 0px transparent',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            position: 'relative',
          }}>
            <SearchIcon />
            <input
              ref={inputRef}
              type="search"
              name="q"
              placeholder="Search any character, brand, line, or series — try ‘macho man’ or ‘wwe elite 11’"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
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
              <ClearButton onClick={() => { setQuery(''); setResults([]); setSearched(false); inputRef.current?.focus() }} />
            )}
            {/* Hidden submit button so Enter triggers form onSubmit */}
            <button type="submit" aria-label="Run search" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}>Search</button>
          </div>
        </form>

        {/* ── Genre filter pills — staged disclosure: show first 5, reveal rest on demand ── */}
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
            {visibleGenres.map(g => (
              <FilterPill
                key={g.slug}
                label={`${g.emoji} ${g.name}`}
                active={activeGenre === g.slug}
                count={results.filter(r => r.genre === g.slug).length}
                accent={g.accent}
                onClick={() => setActiveGenre(activeGenre === g.slug ? null : g.slug)}
              />
            ))}
            {!showAllGenres && hiddenGenreCount > 0 && (
              <button
                onClick={() => setShowAllGenres(true)}
                style={{
                  padding: '0.3125rem 0.75rem',
                  borderRadius: '9999px',
                  border: '1px solid var(--border)',
                  background: 'var(--s1)',
                  color: 'var(--muted)',
                  fontSize: '0.78125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                +{hiddenGenreCount} more
              </button>
            )}
          </div>
        )}

        {/* ── Results ── */}
        {searched && !loading && filtered.length === 0 && (
          <EmptyState query={query} />
        )}

        {filtered.length > 0 && (
          <>
            {/* Character hub cross-link — surfaced when the query matches a
                registered /character/[slug] page. Helps users searching by
                character name jump to the cross-line aggregation page
                instead of scrolling through every variant. */}
            {(() => {
              const charHub = matchCharacterHub(query)
              return charHub ? (
                <a
                  href={`/character/${charHub.slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    background: 'rgba(0,102,255,0.08)',
                    border: '1px solid rgba(0,102,255,0.3)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    marginBottom: '1rem',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ fontSize: 22 }}>{charHub.emoji ?? '👤'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 800, letterSpacing: '.08em',
                      textTransform: 'uppercase', color: 'var(--blue)',
                      marginBottom: 2,
                    }}>
                      Character Hub
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                      Browse all {charHub.displayName} variants across every line
                    </div>
                  </div>
                  <div style={{ color: 'var(--blue)', fontSize: '1.1rem', fontWeight: 700 }}>→</div>
                </a>
              ) : null
            })()}

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
                <FigureResultCard
                key={r.figure_id ?? i}
                result={r}
                query={query}
                sparkline={r.figure_id ? sparklines[r.figure_id] : undefined}
                trackState={r.figure_id ? (trackRecord[r.figure_id] ?? 'idle') : 'idle'}
                onTrack={() => handleTrack(r)}
              />
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

function FigureResultCard({
  result: r, query, sparkline, trackState, onTrack,
}: {
  result: SearchResult
  query: string
  sparkline?: { points: number[]; trend: 'up' | 'down' | 'flat' }
  trackState: 'idle' | 'loading' | 'added' | 'exists' | 'error'
  onTrack: () => void
}) {
  const genre  = GENRE_MAP[r.genre]
  const accent = genre?.accent ?? '#FF5F00'
  const href = (r.fandom_slug && r.line_slug && r.character_slug)
    ? `/${r.fandom_slug}/${r.line_slug}/${r.character_slug}`
    : r.figure_id
      ? `/figure/${r.figure_id}`
      : `/search?q=${encodeURIComponent(r.name)}`

  const trackDone = trackState === 'added' || trackState === 'exists'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: trackState === 'added' ? 'rgba(30,170,63,0.05)' : 'var(--s1)',
        border: `1px solid ${trackState === 'added' ? 'rgba(30,170,63,0.35)' : 'var(--border)'}`,
        borderRadius: 10,
        transition: 'border-color 0.12s, background 0.12s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        if (trackState !== 'added') {
          el.style.borderColor = 'var(--border-hover)'
          el.style.background = 'var(--s2)'
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = trackState === 'added' ? 'rgba(30,170,63,0.35)' : 'var(--border)'
        el.style.background  = trackState === 'added' ? 'rgba(30,170,63,0.05)' : 'var(--s1)'
      }}
    >
      {/* Clickable left section — thumb + info */}
      <a
        href={href}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          flex: 1, minWidth: 0, textDecoration: 'none', color: 'var(--text)',
        }}
      >
        {/* Thumbnail */}
        <div style={{
          width: 64, height: 64, borderRadius: 8, flexShrink: 0,
          background: 'var(--s2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', fontSize: '1.3rem',
        }}>
          {r.image
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={r.image} alt="" width={64} height={64} style={{ width: '100%', height: '100%', objectFit: 'contain' }} loading="lazy" decoding="async" />
            : (genre?.emoji ?? '🤼')
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginBottom: 3,
          }}>
            {highlightMatch(r.name, query)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.4 }}>
            {r.brand} · {r.line}{r.series ? ` · Ser. ${r.series}` : ''}{r.year ? ` · ${r.year}` : ''}
          </div>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.6rem', fontWeight: 700,
              padding: '0.1rem 0.4rem', borderRadius: '9999px',
              background: accent + '18', color: accent,
              border: `1px solid ${accent}30`,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {genre?.name ?? r.genre}
            </span>
            {sparkline && (
              <Sparkline points={sparkline.points} trend={sparkline.trend} width={52} height={16} />
            )}
          </div>
        </div>
      </a>

      {/* Track Price button — right side */}
      {r.figure_id && (
        <button
          onClick={e => { e.stopPropagation(); if (!trackDone) onTrack() }}
          disabled={trackState === 'loading' || trackDone}
          style={{
            flexShrink: 0,
            padding: '5px 11px',
            borderRadius: 7,
            fontSize: '0.72rem',
            fontWeight: 700,
            border: `1px solid ${
              trackState === 'added'  ? 'rgba(30,170,63,0.4)' :
              trackState === 'exists' ? 'var(--border)' :
              trackState === 'error'  ? 'rgba(255,59,48,0.4)' :
              'rgba(0,102,255,0.4)'
            }`,
            background:
              trackState === 'added'  ? 'rgba(30,170,63,0.12)' :
              trackState === 'exists' ? 'transparent' :
              trackState === 'error'  ? 'rgba(255,59,48,0.08)' :
              'rgba(0,102,255,0.08)',
            color:
              trackState === 'added'  ? 'var(--green)' :
              trackState === 'exists' ? 'var(--muted)' :
              trackState === 'error'  ? '#FF3B30' :
              trackState === 'loading' ? 'var(--muted)' :
              'var(--blue)',
            cursor: trackDone ? 'default' : trackState === 'loading' ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s',
          }}
        >
          {trackState === 'added'   ? '✓ Tracking' :
           trackState === 'exists'  ? '✓ Tracking' :
           trackState === 'loading' ? '…' :
           trackState === 'error'   ? 'Retry' :
           'Track'}
        </button>
      )}
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  // Curated bounce-back suggestions — queries we know work because they're
  // either popular character canonicals or aliases registered in
  // characterAliases.ts. Cover wrestling + Marvel + DC + Star Wars +
  // Transformers so the user has options across genres. Click any chip
  // to retry — handler is the SuggestChip component below which navigates
  // to /search?q=...
  // (#71 audit follow-up 2026-04-30: previously the zero-results state
  // just gave a generic "try X, Y, Z" sentence. Now it offers concrete
  // working examples — including aliases — so users discover the search
  // system works on multiple-naming-convention inputs like "macho man"
  // and "randy savage" returning the same results.)
  const tryInsteadByGroup: Array<{ label: string; queries: string[] }> = [
    {
      label: 'Popular characters',
      queries: ['CM Punk', 'Macho Man', 'Spider-Man', 'Wolverine', 'Optimus Prime', 'Batman'],
    },
    {
      label: 'Popular brands or lines',
      queries: ['WWE Elite', 'AEW Unrivaled', 'Marvel Legends', 'Black Series', 'NECA Aliens'],
    },
    {
      label: 'Or try an alias',
      queries: ['Randy Savage', 'HBK', 'Y2J', 'Phenom', 'Hitman', 'Anakin'],
    },
  ]

  return (
    <div style={{
      padding: '3rem 1rem',
      color: 'var(--muted)',
      maxWidth: 720, margin: '0 auto',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
        <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
          No results for &ldquo;{query}&rdquo;
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', maxWidth: 480, margin: '0 auto' }}>
          We search by character, brand, line, series, and known aliases. If you typed something specific,
          double-check the spelling — or try one of these:
        </p>
      </div>

      {tryInsteadByGroup.map(group => (
        <div key={group.label} style={{ marginBottom: '1.5rem' }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--dim)',
            marginBottom: '0.5rem', textAlign: 'center',
          }}>
            {group.label}
          </div>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
            justifyContent: 'center',
          }}>
            {group.queries.map(q => (
              <SuggestChip key={q} text={q} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function IdlePrompt() {
  // Suggestion sets organized by what kind of search the user has in mind.
  // Phase 4 (2026-04-30): replaced 6-flat-chip layout with categorized groups
  // so visitors learn what kinds of queries the search supports — character
  // names, brand+line shorthand, multi-token specific lookups. The Phase 1
  // search overhaul made "wwe elite 11" and "aew unrivaled" return results;
  // these chips show users that those queries work.
  const suggestions: Array<{ label: string; queries: string[] }> = [
    {
      label: 'By character',
      queries: ['CM Punk', 'Macho Man', 'Spider-Man', 'Wolverine', 'He-Man', 'Optimus Prime'],
    },
    {
      label: 'By brand or line',
      queries: ['WWE Elite', 'AEW Unrivaled', 'Marvel Legends', 'Black Series', 'Mattel Elite Legends', 'NECA Aliens'],
    },
    {
      label: 'By series number',
      queries: ['Elite 11', 'Series 124', 'Marvel Legends Wave 5', 'Star Wars 40th Anniversary'],
    },
  ]

  return (
    <div style={{
      padding: '3rem 1rem',
      color: 'var(--muted)',
      maxWidth: 720, margin: '0 auto',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📦</div>
        <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
          Search 22,000+ action figures
        </p>
        <p style={{ fontSize: '0.875rem', maxWidth: 480, margin: '0 auto' }}>
          Real eBay sold prices, every variant, every wave. Try one of these:
        </p>
      </div>

      {suggestions.map(group => (
        <div key={group.label} style={{ marginBottom: '1.75rem' }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--dim)',
            marginBottom: '0.625rem', textAlign: 'center',
          }}>
            {group.label}
          </div>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
            justifyContent: 'center',
          }}>
            {group.queries.map(q => (
              <SuggestChip key={q} text={q} />
            ))}
          </div>
        </div>
      ))}

      {/* Genre quick-entry grid — fills the dead space below suggestion
          chips with a visual "where do I want to go" menu. Replaces the
          previous all-empty-air idle state. (#71-style audit, 2026-04-30:
          /search idle was the lowest-density page on the site; users with
          no specific query had nothing to look at.) */}
      <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
        <div style={{
          fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--dim)',
          marginBottom: '1rem', textAlign: 'center',
        }}>
          Or browse by genre
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.5rem',
        }}>
          {GENRES.map(g => (
            <a
              key={g.slug}
              href={`/${g.slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem 0.875rem',
                background: 'var(--s1)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                textDecoration: 'none',
                color: 'var(--text)',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'border-color 0.12s, background 0.12s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = g.accent + '66'
                e.currentTarget.style.background = g.accent + '0A'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'var(--s1)'
              }}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{g.emoji}</span>
              <span>{g.name}</span>
            </a>
          ))}
        </div>
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
  const trimmed = query.trim()
  if (!trimmed) return text

  // Multi-token highlighting (Phase 4 unlock — 2026-04-30): split the query
  // into individual tokens and highlight each. Pre-Phase-1 the search was
  // strict-substring on the full query string, so single-token highlight was
  // sufficient. Now that "wwe elite macho" returns results matched across
  // multiple fields, the highlight should mark every matched token in the
  // result name. Tokens >=2 chars only — 1-char highlights make every "a"
  // and "i" pop, which is noise.
  const tokens = trimmed.toLowerCase().split(/\s+/).filter(t => t.length >= 2)
  if (tokens.length === 0) return text

  // Build a single regex with all tokens for one pass through the text.
  // Escape each token so user input like "(Hollywood)" doesn't break it.
  const escapedTokens = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`(${escapedTokens.join('|')})`, 'gi')
  const tokenSet = new Set(tokens)
  const parts = text.split(re)

  return parts.map((part, i) =>
    tokenSet.has(part.toLowerCase())
      ? <strong key={i} style={{ color: 'var(--gold)', fontWeight: 700 }}>{part}</strong>
      : <span key={i}>{part}</span>
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
