'use client'

import { useState, useRef, useEffect } from 'react'
import { trackFunnel } from '@/app/_lib/funnelClient'

// Matches actual /api/v1/search response shape
type SearchResult = {
  figure_id?: string
  name: string
  brand: string
  line: string
  series: string
  genre: string
  year: number | null
  image?: string | null
  fandom_slug?: string
  line_slug?: string
  character_slug?: string
}

export default function HeroSearch({
  totalLabel = '18,000+',
  placeholder,
  placeholderExamples,
  showButton = false,
}: {
  totalLabel?: string
  placeholder?: string
  /** Optional rotating example names — cycles "Try ..." hints while empty. */
  placeholderExamples?: string[]
  /** Render a visible submit button so search reads as THE action. */
  showButton?: boolean
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [exampleIdx, setExampleIdx] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
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
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}&limit=8`)
        if (res.ok) {
          const data = await res.json() as { figures: SearchResult[] }
          setResults(data.figures ?? [])
          setOpen(true)
        }
      } catch {
        // API unavailable — silent fail, no dropdown
      } finally {
        setLoading(false)
      }
    }, 260)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // "/" focuses the search from anywhere on the page (homepage copy promises
  // this — keep the hotkey and the micro-line in sync). Ignored while typing
  // in any form control or during IME composition so it never eats real input.
  useEffect(() => {
    function handleSlash(e: KeyboardEvent) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', handleSlash)
    return () => document.removeEventListener('keydown', handleSlash)
  }, [])

  // Rotate example placeholders while the field is empty. Respects
  // prefers-reduced-motion (no cycling — static base placeholder).
  useEffect(() => {
    if (!placeholderExamples?.length) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setExampleIdx(i => (i + 1) % placeholderExamples.length)
    }, 3200)
    return () => clearInterval(id)
  }, [placeholderExamples])

  function submit() {
    if (query.trim()) {
      trackFunnel('search_submit', { query: query.trim(), target: 'hero_search' })
      window.location.href = `/search?q=${encodeURIComponent(query)}`
    } else {
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setOpen(false)
    if (e.key === 'Enter') submit()
  }

  const basePlaceholder = placeholder ?? `Search ${totalLabel} figures by name or character...`
  const liveHint = placeholderExamples?.length
    ? `Try "${placeholderExamples[exampleIdx % placeholderExamples.length]}"`
    : basePlaceholder

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', maxWidth: 720, margin: '0 auto 32px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--s1)',
        border: `1px solid ${open && results.length ? 'var(--blue)' : 'var(--border)'}`,
        borderRadius: open && results.length ? '10px 10px 0 0' : '10px',
        padding: '0 8px 0 16px',
        gap: 10,
        transition: 'border-color 0.15s',
        boxShadow: open && results.length ? '0 0 0 3px rgba(0,102,255,0.12)' : 'none',
      }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={query.length === 0 ? liveHint : basePlaceholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && results.length && setOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search figures"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontSize: '1rem',
            padding: '14px 0',
            fontFamily: 'var(--font-ui)',
          }}
        />
        {loading
          ? <SpinnerIcon />
          : query.length > 0
            ? <ClearButton onClick={() => { setQuery(''); setResults([]); setOpen(false) }} />
            : null
        }
        {showButton && (
          <button
            type="button"
            onClick={submit}
            aria-label="Run a price check"
            style={{
              flexShrink: 0,
              border: 'none',
              cursor: 'pointer',
              background: 'var(--blue)',
              color: '#fff',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.85rem',
              fontWeight: 800,
              borderRadius: 8,
              padding: '10px 16px',
              margin: '6px 0',
              boxShadow: '0 6px 18px rgba(0,102,255,0.3)',
            }}
          >
            Price it
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--s1)',
            border: '1px solid var(--blue)',
            borderTop: 'none',
            borderRadius: '0 0 10px 10px',
            overflow: 'hidden',
            zIndex: 200,
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          }}
        >
          {results.map((r, i) => (
            <a
              key={r.figure_id ?? i}
              href={
                r.figure_id
                  ? `/figure/${r.figure_id}`
                  : (r.fandom_slug && r.line_slug && r.character_slug)
                    ? `/${r.fandom_slug}/${r.line_slug}/${r.character_slug}`
                    : `/search?q=${encodeURIComponent(r.name)}`
              }
              role="option"
              onClick={() => trackFunnel('search_result_click', {
                query,
                figureId: r.figure_id ?? '',
                target: 'hero_dropdown',
              })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 16px',
                color: 'var(--text)',
                textDecoration: 'none',
                borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                fontSize: '0.9rem',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--s2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Image or monogram placeholder */}
              <div style={{
                width: 36, height: 36, borderRadius: 6, flexShrink: 0,
                background: 'var(--s2)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', overflow: 'hidden',
              }}>
                {r.image
                  ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  )
                  : <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text)' }}>{resultMonogram(r.name)}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {highlightMatch(r.name, query)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>
                  {r.brand} {r.line}{r.series ? ` · Series ${r.series}` : ''}
                </div>
              </div>
            </a>
          ))}
          <a
            href={`/search?q=${encodeURIComponent(query)}`}
            onClick={() => trackFunnel('search_submit', { query: query.trim(), target: 'hero_all_results' })}
            style={{
              display: 'block',
              padding: '10px 16px',
              fontSize: '0.8rem',
              color: 'var(--blue)',
              textDecoration: 'none',
              fontWeight: 600,
              background: 'var(--s2)',
              transition: 'opacity 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            See all results for &ldquo;{query}&rdquo; →
          </a>
        </div>
      )}

      {/* Empty state */}
      {open && query.length >= 2 && !loading && results.length === 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--s1)', border: '1px solid var(--blue)', borderTop: 'none',
          borderRadius: '0 0 10px 10px', padding: '16px', textAlign: 'center',
          zIndex: 200, color: 'var(--muted)', fontSize: '0.875rem',
        }}>
          No figures found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  )
}

function resultMonogram(name: string): string {
  const words = name.replace(/[^a-zA-Z0-9 ]/g, '').split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'FP'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

// Bold the matched portion of the result name
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

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--muted)', flexShrink: 0, animation: 'hero-spin 0.7s linear infinite' }}>
      <style>{`@keyframes hero-spin { to { transform: rotate(360deg); } }`}</style>
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
        color: 'var(--muted)', display: 'flex', padding: '4px 0 4px 8px', flexShrink: 0,
        fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-ui)',
      }}
    >
      Clear
    </button>
  )
}
