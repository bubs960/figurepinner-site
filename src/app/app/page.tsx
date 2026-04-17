'use client'

import { useState, useRef, useEffect } from 'react'

// Client component — runtime is inherited from the edge layout

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''

// Matches actual API response from /api/v1/search
// figure_id and image are P0 gaps being added by engineer — optional until then
type SearchResult = {
  figure_id?: string       // added by engineer (P0) — used for detail page URL
  name: string
  brand: string
  line: string
  series: string
  genre: string
  year: number | null
  image?: string | null    // added by engineer (P0) — canonical_image_url
}

// Recent searches — stored in memory only (localStorage not available on edge/SSR)
const PLACEHOLDER_RECENT = [
  { id: '1', name: 'Rey Mysterio Elite 100', line: 'Mattel Elite', genre: 'wrestling', slug: 'rey-mysterio-elite-100', avg_price: 34 },
  { id: '2', name: 'Roman Reigns Acknowledge Me', line: 'Mattel Elite', genre: 'wrestling', slug: 'roman-reigns-acknowledge-me', avg_price: 28 },
  { id: '3', name: 'CM Punk Elite Return', line: 'Mattel Elite', genre: 'wrestling', slug: 'cm-punk-elite-return', avg_price: 67 },
]

export default function AppHome() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/v1/search?q=${encodeURIComponent(query)}&limit=8`)
        if (res.ok) {
          const data = await res.json() as { figures: SearchResult[] }
          setResults(data.figures ?? [])
          setOpen(true)
        }
      } catch {
        // API not reachable — silently ignore, show empty state
      } finally {
        setLoading(false)
      }
    }, 280)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>

      {/* Search */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          letterSpacing: '0.04em',
          color: 'var(--text)',
          marginBottom: '1rem',
        }}>
          FIND A FIGURE
        </h1>

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--s2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '0 1rem',
            gap: '0.75rem',
          }}>
            <SearchIconSm />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search 20,000+ figures by name, line, or character…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => query.length >= 2 && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text)',
                fontSize: '1rem',
                padding: '0.875rem 0',
                fontFamily: 'var(--font-body)',
              }}
            />
            {loading && <SpinnerIcon />}
          </div>

          {/* Dropdown */}
          {open && results.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'var(--s2)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              overflow: 'hidden',
              zIndex: 50,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {results.map((r, i) => (
                <a
                  key={r.figure_id ?? i}
                  href={r.figure_id ? `/figure/${r.figure_id}` : `/app?q=${encodeURIComponent(r.name)}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    color: 'var(--text)',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '0.9rem',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--s1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1 }}>
                    {r.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image} alt="" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4, background: 'var(--s2)', flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontWeight: '500' }}>{r.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{r.brand} {r.line}{r.series ? ` · Series ${r.series}` : ''}</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Searches */}
      <section style={{ marginBottom: '2.5rem' }}>
        <SectionHeader label="Recently Viewed" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {PLACEHOLDER_RECENT.map(r => (
            <a
              key={r.id}
              href={`/${r.genre}/mattel-elite/${r.slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: 'var(--s1)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div>
                <div style={{ fontWeight: '500' }}>{r.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{r.line}</div>
              </div>
              <div style={{ color: 'var(--green)', fontWeight: '600' }}>${r.avg_price}</div>
            </a>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section>
        <SectionHeader label="Browse by Genre" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
          {GENRES.map(g => (
            <a
              key={g.slug}
              href={`/${g.slug}`}
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--s1)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <span style={{ marginRight: '0.5rem' }}>{g.emoji}</span>{g.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: '0.75rem',
      fontWeight: '600',
      letterSpacing: '0.08em',
      color: 'var(--muted)',
      textTransform: 'uppercase',
      marginBottom: '0.625rem',
    }}>
      {label}
    </div>
  )
}

function SearchIconSm() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--muted)', flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="4" />
      <line x1="10" y1="10" x2="14" y2="14" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--muted)', flexShrink: 0, animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 18" strokeLinecap="round" />
    </svg>
  )
}

// Fandom slugs match KB `genre` field exactly — 17 genres as of v11.2.0
const GENRES = [
  { slug: 'wrestling', label: 'Wrestling', emoji: '🤼' },
  { slug: 'marvel', label: 'Marvel', emoji: '🦸' },
  { slug: 'star-wars', label: 'Star Wars', emoji: '⚔️' },
  { slug: 'dc', label: 'DC', emoji: '🦇' },
  { slug: 'transformers', label: 'Transformers', emoji: '🤖' },
  { slug: 'gijoe', label: 'G.I. Joe', emoji: '🪖' },
  { slug: 'masters-of-the-universe', label: 'MOTU', emoji: '⚡' },
  { slug: 'teenage-mutant-ninja-turtles', label: 'TMNT', emoji: '🐢' },
  { slug: 'power-rangers', label: 'Power Rangers', emoji: '🦕' },
  { slug: 'indiana-jones', label: 'Indiana Jones', emoji: '🎩' },
  { slug: 'ghostbusters', label: 'Ghostbusters', emoji: '👻' },
  { slug: 'mythic-legions', label: 'Mythic Legions', emoji: '🗡️' },
  { slug: 'thundercats', label: 'Thundercats', emoji: '🐱' },
  { slug: 'action-force', label: 'Action Force', emoji: '🎖️' },
  { slug: 'dungeons-dragons', label: 'D&D', emoji: '🐉' },
  { slug: 'neca', label: 'Horror & Film', emoji: '🎬' },
  { slug: 'spawn', label: 'Spawn', emoji: '🦇' },
]
