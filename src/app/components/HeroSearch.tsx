'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { trackFunnel } from '@/app/_lib/funnelClient'
import { thumb } from '@/lib/imageUrl'
import { useQuickLook } from '@/app/components/QuickLookAnchor'
import { SOLD_COUNT_CONFIDENCE_FLOOR, fandomName } from '@/lib/searchDisplay'

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

// `stat` = which aggregate `median` holds (route falls back to avg_sold when
// a snapshot has no median_sold) — the label must say what the number is.
type SparkPrice = { median: number | null; soldCount: number; stat?: 'median' | 'avg' }

// Dropdown thumb rendition — 64px box, 2× for retina.
const THUMB_SIZE = 64
const THUMB_CDN_WIDTH = 128

/**
 * Desktop-pointer gate for the takeover + hover zoom (D3: touch keeps the plain
 * dropdown). `(hover: hover) and (pointer: fine)` alone is NOT a reliable touch
 * exclusion — it can report true on devices/browsers that also have touch
 * (hybrid laptops, some Android/embedded-webview combinations), letting a
 * touch user into the desktop takeover: a fixed, viewport-locking dark
 * backdrop (`.fp-search-backdrop`) with no visible close affordance beyond
 * "tap outside it," which on a touch device with no cursor reads as the
 * whole screen going dark with no way out (2026-07-25, Steve-relayed user
 * report: "when you click search the box goes dark... x is too small to
 * hit"). Explicitly requiring NO touch capability closes that gap — a
 * device reporting touch of any kind gets the plain dropdown, full stop.
 */
function isDesktopPointer(): boolean {
  if (typeof window === 'undefined') return false
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  return hasFinePointer && !hasTouch
}

function resultHref(r: SearchResult): string {
  return r.figure_id
    ? `/figure/${r.figure_id}`
    : (r.fandom_slug && r.line_slug && r.character_slug)
      ? `/${r.fandom_slug}/${r.line_slug}/${r.character_slug}`
      : `/search?q=${encodeURIComponent(r.name)}`
}

export default function HeroSearch({
  totalLabel = '18,000+',
  placeholder,
  placeholderExamples,
  showButton = false,
  buttonLabel = 'Price it',
  disableTakeover = false,
}: {
  totalLabel?: string
  placeholder?: string
  /** Optional rotating example names — cycles "Try ..." hints while empty. */
  placeholderExamples?: string[]
  /** Render a visible submit button so search reads as THE action. */
  showButton?: boolean
  /** Button text — Depth Hall hero says "Search" (Steve, 2026-07-24). */
  buttonLabel?: string
  /**
   * Skip the desktop takeover (fixed backdrop + portaled results panel)
   * entirely and always use the plain in-place dropdown, regardless of
   * pointer type. For mounting HeroSearch inside another already-modal
   * surface (SiteHeader's search overlay, 2026-07-25) — nesting the
   * takeover's own backdrop/portal inside a different overlay's backdrop
   * is untested, avoidable complexity for zero benefit when the parent
   * surface already provides the "focused" framing this was built for.
   */
  disableTakeover?: boolean
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [facets, setFacets] = useState<Record<string, number> | null>(null)
  const [prices, setPrices] = useState<Record<string, SparkPrice>>({})
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [takeover, setTakeover] = useState(false)
  // Real focus state, tracked on the WRAPPER not the input, so focus moving
  // between the input, the Clear button and the Submit button (all inside the
  // same visual box) doesn't flicker the lit state off. Drives the "search is
  // focused" brightening — which was previously keyed to `showResults`, i.e.
  // 2+ typed chars AND returned results, so clicking an empty box changed
  // nothing at all while the takeover backdrop darkened everything around it
  // (2026-07-26, Steve: "when you click it goes dark... limiting focus").
  const [focused, setFocused] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [exampleIdx, setExampleIdx] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const priceAbortRef = useRef<AbortController | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Takeover panel anchor, measured from the wrapper. The panel PORTALS to
  // document.body with position:fixed — an in-place absolute panel gets
  // clipped by ancestor overflow (homepage .fph-hero has overflow:hidden and
  // cut the panel off below the first row) and is at the mercy of transformed
  // reveal wrappers. Scroll is locked while open, so a fixed anchor is stable;
  // re-measured on window resize.
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null)
  // Plain-dropdown max height (keyboard-avoidance, touch path) — null until measured.
  const [plainMaxH, setPlainMaxH] = useState<number | null>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setNote(null)
      setFacets(null)
      setOpen(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}&limit=8`)
        if (res.ok) {
          const data = await res.json() as {
            figures: SearchResult[]
            note?: string | null
            facets?: Record<string, number>
          }
          setResults(data.figures ?? [])
          setNote(data.note ?? null)
          setFacets(data.facets ?? null)
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

  // Prices for the visible rows: ONE batch sparklines call after results
  // settle (the route reads r2proxy price-summaries server-side, 5-min edge
  // cache). Names paint first, prices pop in a beat later — the latency IS
  // the animation. AbortController prevents a stale query's prices landing
  // on newer rows (same pattern as SearchInterface).
  useEffect(() => {
    priceAbortRef.current?.abort()
    setActiveIdx(-1)
    const ids = results.map(r => r.figure_id).filter(Boolean) as string[]
    if (!ids.length) { setPrices({}); return }
    const ctrl = new AbortController()
    priceAbortRef.current = ctrl
    fetch(`/api/sparklines?ids=${encodeURIComponent(ids.join(','))}`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : {})
      .then(data => setPrices(data as Record<string, SparkPrice>))
      .catch(() => { /* honest blank — rows simply show no price */ })
  }, [results])

  // Close on outside click. The takeover panel lives in a body portal, so
  // "inside" means the wrapper OR the portaled panel.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node
      if (wrapperRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setOpen(false)
      setTakeover(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Measure the panel anchor while the takeover is open; re-measure on resize.
  useEffect(() => {
    if (!takeover) { setPanelPos(null); return }
    function measure() {
      const el = wrapperRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setPanelPos({
        top: r.bottom + 8,
        left: r.left + r.width / 2,
        // Wrapper width + 48 keeps the ±24px overhang from poking past the
        // viewport edge when the hero column sits off-center.
        width: Math.min(720, r.width + 48, window.innerWidth * 0.92),
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [takeover])

  // Keyboard-avoidance for the plain (non-takeover) dropdown — the mobile
  // path (S55 item 3). 8 rows ≈ 700px with no cap: on a phone the on-screen
  // keyboard buries all but the first row. The keyboard shrinks the VISUAL
  // viewport, not the layout viewport, so cap the panel to the space between
  // the input and the visual viewport's bottom and let it scroll internally.
  // Also correct on short desktop windows; the takeover branch has its own
  // maxHeight and ignores this.
  useEffect(() => {
    if (!open || takeover) { setPlainMaxH(null); return }
    function measure() {
      const el = wrapperRef.current
      if (!el) return
      const vv = window.visualViewport
      const viewBottom = vv ? vv.offsetTop + vv.height : window.innerHeight
      setPlainMaxH(Math.max(160, Math.round(viewBottom - el.getBoundingClientRect().bottom - 12)))
    }
    measure()
    const vv = window.visualViewport
    vv?.addEventListener('resize', measure)
    vv?.addEventListener('scroll', measure)
    window.addEventListener('resize', measure)
    // Layout scroll moves the absolute-attached panel with the page — the
    // wrapper's viewport-relative bottom changes, so the cap must re-measure.
    window.addEventListener('scroll', measure, { passive: true })
    return () => {
      vv?.removeEventListener('resize', measure)
      vv?.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
    }
  }, [open, takeover])

  // Scroll-lock while the takeover is open. Compensate for the vanishing
  // scrollbar with padding-right so the page behind does not shift (the
  // plan's acceptance check measures hero getBoundingClientRect unchanged).
  useEffect(() => {
    if (!takeover) return
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    const prevOverflow = document.body.style.overflow
    const prevPadding = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPadding
    }
  }, [takeover])

  // Escape closes the takeover from ANYWHERE on the page, not just from inside
  // the input (overlay/trap audit, 2026-07-26).
  //
  // The input's own onKeyDown (handleKeyDown below) was the ONLY Escape handler
  // in this file, so it only fired while focus sat in the field. One press of
  // Tab moved focus out and left the 62%-black backdrop AND the scroll-lock
  // above it with no keyboard exit at all — the only way out was a mouse click
  // on the backdrop.
  //
  // That is the same failure shape as the touch bug this component already
  // carries a comment about (see isDesktopPointer above, and the user report it
  // quotes): a full-screen dark lock whose only remaining exit requires a
  // modality the user might not have. That fix covered the touch case; this
  // covers the keyboard case. DepthHallHero.tsx does the same thing for its own
  // inspect panel — this is that pattern, not a new one.
  //
  // Focus returns to the input on close so a keyboard user isn't dumped
  // somewhere arbitrary, matching handleKeyDown's own "focus stays in the
  // input" behaviour.
  useEffect(() => {
    if (!takeover) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape' || e.isComposing) return
      close()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [takeover])

  // "/" focuses the search from anywhere on the page (homepage copy promises
  // this — keep the hotkey and the micro-line in sync). Cmd+K / Ctrl+K is an
  // alias (S54 Phase 5 — the full palette UI stays out of scope). Ignored
  // while typing in any form control or during IME composition so it never
  // eats real input.
  useEffect(() => {
    function handleHotkey(e: KeyboardEvent) {
      const isSlash = e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey
      const isCmdK = e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey) && !e.altKey
      if ((!isSlash && !isCmdK) || e.isComposing) return
      if (isSlash) {
        const t = e.target as HTMLElement | null
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      }
      e.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', handleHotkey)
    return () => document.removeEventListener('keydown', handleHotkey)
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

  function close() {
    setOpen(false)
    setTakeover(false)
    // Backstop against a stuck-lit box if the wrapper's onBlur relatedTarget
    // check misfires (it can be null on some virtual keyboards/extensions).
    // Guarded on real DOM focus because Escape deliberately KEEPS focus in the
    // input (see handleKeyDown) — a blinking caret in a box that renders as
    // inactive would be its own bug, so only drop the lit state once focus has
    // genuinely left the box.
    if (!wrapperRef.current?.contains(document.activeElement)) setFocused(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      close() // focus stays in the input — no blur on Esc
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!results.length) return
      e.preventDefault()
      if (!open) { setOpen(true); return }
      setActiveIdx(i => e.key === 'ArrowDown'
        ? Math.min(i + 1, results.length - 1)
        : Math.max(i - 1, -1))
      return
    }
    if (e.key === 'Enter') {
      if (open && activeIdx >= 0 && activeIdx < results.length) {
        const r = results[activeIdx]
        trackFunnel('search_result_click', { query, figureId: r.figure_id ?? '', target: 'hero_dropdown' })
        window.location.href = resultHref(r)
        return
      }
      submit()
    }
  }

  const basePlaceholder = placeholder ?? `Search ${totalLabel} figures by name or character...`
  const liveHint = placeholderExamples?.length
    ? `Try "${placeholderExamples[exampleIdx % placeholderExamples.length]}"`
    : basePlaceholder

  const showResults = open && results.length > 0
  // The lit state. Deliberately NOT `showResults` alone — an empty focused box
  // is exactly the case that had zero feedback on every device.
  const isActive = focused || takeover || showResults
  // Takeover: a body-portaled FIXED panel floating detached under the input
  // (immune to ancestor overflow/transform — the homepage hero clips in-place
  // absolutes). Plain dropdown stays attached-absolute (unchanged mobile/touch
  // behavior; scroll isn't locked there, so fixed anchoring would drift).
  // Longhand border props in BOTH branches — switching between the `border`
  // shorthand and a `borderTop` override across rerenders trips React's
  // conflicting-style warning and mangles the border.
  const inTakeover = takeover && panelPos !== null
  const panelStyle: React.CSSProperties = inTakeover
    ? {
        position: 'fixed',
        top: panelPos.top,
        left: panelPos.left,
        transform: 'translateX(-50%)',
        width: panelPos.width,
        // Short windows: the panel scrolls instead of running off-screen
        // (scroll-lock means the page can't scroll to reveal it).
        maxHeight: `calc(100vh - ${panelPos.top + 16}px)`,
        overflowY: 'auto',
        background: 'var(--s1)',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'var(--blue)',
        borderRadius: 12,
        zIndex: 200,
        boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
      }
    : {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        background: 'var(--s1)',
        borderWidth: '0 1px 1px 1px',
        borderStyle: 'solid',
        borderColor: 'var(--blue)',
        borderRadius: '0 0 10px 10px',
        zIndex: 200,
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        // Keyboard-avoidance cap (see the plainMaxH effect) — scrolls
        // internally instead of running under the on-screen keyboard.
        ...(plainMaxH !== null ? { maxHeight: plainMaxH, overflowY: 'auto' as const } : {}),
      }

  const facetEntries = facets
    ? Object.entries(facets).sort((a, b) => b[1] - a[1]).slice(0, 6)
    : []

  return (
    <>
      {takeover && createPortal(
        <div className="fp-search-backdrop" aria-hidden onMouseDown={close} />,
        document.body,
      )}
      <div
        ref={wrapperRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 720,
          margin: '0 auto 32px',
          zIndex: takeover ? 200 : undefined,
        }}
      >
      {/* Focus bloom — a soft gold wash behind the whole box. Deliberately
          focus-only rather than always-on like the source design: it's a
          blur(24px) layer sitting on the LCP region, and making it arrive on
          click is both cheaper and a bigger delta for the thing that was
          actually reported. */}
      {isActive && <span className="fp-search-bloom" aria-hidden />}
      <div
        className="fp-search-box"
        onFocus={() => setFocused(true)}
        onBlur={e => {
          // Only unlight when focus leaves the box entirely — tabbing from the
          // input to Clear/Submit keeps it lit.
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false)
        }}
        style={{
          position: 'relative',
          zIndex: 1,
          // The 3px pad IS the ring band — the panel below sits at inset:3px,
          // so the spinning conic behind it only shows through as a border.
          padding: 3,
          borderRadius: showResults && !takeover ? '14px 14px 0 0' : '14px',
          overflow: 'hidden',
        }}
      >
        {/* Ambient ring — slow and dim, keeps the box alive at rest. */}
        <span className="fp-search-ring" aria-hidden />
        {/* Lit ring — brighter, 2.4x faster, STACKED on the ambient one rather
            than replacing it, so focus reads as more light arriving rather
            than a swap. This is the change Steve asked for. */}
        {isActive && <span className="fp-search-ring fp-search-ring-lit" aria-hidden />}
        {/* Inner panel — masks the conic down to a band and carries the
            surface channel. Kept as a sibling element rather than a background
            on the box itself, because the box has to stay overflow:hidden to
            clip the spinning ring.

            The surface goes DARKER on focus (--s1 -> --bg), not lighter. The
            first cut stepped it up to --s3 on the theory that "focused = a
            brighter box", but measuring it showed that lifting the surface
            toward the text DROPS text contrast 15.8:1 -> 14.9:1, which is what
            made the box read washed-out mid-typing (Steve, 2026-07-26: "the
            text and area is just darker"). Light belongs on the ring and the
            text; the surface should recede so they separate. */}
        <span
          className="fp-search-panel"
          aria-hidden
          style={{
            borderRadius: showResults && !takeover ? '11px 11px 0 0' : '11px',
            background: isActive ? 'var(--bg)' : 'var(--s1)',
          }}
        />
        <div style={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
        padding: '0 8px 0 16px',
        gap: 10,
      }}>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showResults}
          aria-controls="hero-search-listbox"
          aria-autocomplete="list"
          aria-activedescendant={activeIdx >= 0 ? `hero-search-opt-${activeIdx}` : undefined}
          placeholder={query.length === 0 ? liveHint : basePlaceholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => {
            setFocused(true)
            if (!disableTakeover && isDesktopPointer()) setTakeover(true)
            if (query.length >= 2 && results.length) setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          aria-label="Search figures"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            // Pure white while engaged, not --text (#EEEEF5). Paired with the
            // panel receding to --bg this takes what you're typing from
            // 15.8:1 to ~19.7:1 against its own surface — the text gets
            // CRISPER as you type instead of washing out.
            color: isActive ? '#FFFFFF' : 'var(--text)',
            transition: 'color 0.15s ease',
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
            className="fpdh-search-submit"
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
            {buttonLabel}
          </button>
        )}
      </div>
      </div>

      {/* Results panel — plain dropdown in place, or the rich takeover panel
          portaled to <body> (fixed) so no ancestor overflow can clip it. */}
      {showResults && renderPanel(
        <div ref={panelRef} id="hero-search-listbox" role="listbox" style={panelStyle}>
          {/* Genre count pills (takeover only) — aggregated over the FULL
              scored pool by the API, so counts are the real match landscape,
              not the 8 visible rows. Clickable per D2 → /search prefiltered. */}
          {takeover && facetEntries.length > 1 && (
            <div style={{
              display: 'flex',
              gap: 8,
              padding: '10px 14px',
              overflowX: 'auto',
              borderBottom: '1px solid var(--border)',
            }}>
              {facetEntries.map(([slug, count]) => (
                <a
                  key={slug}
                  href={`/search?q=${encodeURIComponent(query)}&genre=${encodeURIComponent(slug)}`}
                  onClick={() => trackFunnel('search_submit', { query: query.trim(), target: 'hero_genre_pill' })}
                  style={{
                    flexShrink: 0,
                    padding: '4px 11px',
                    borderRadius: 9999,
                    border: '1px solid var(--border)',
                    background: 'var(--s2)',
                    color: 'var(--text)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'border-color 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  {fandomName(slug)} <span style={{ color: 'var(--muted)', fontWeight: 500 }}>· {count}</span>
                </a>
              ))}
            </div>
          )}

          {/* Forgiveness note — the API already computed it ("Showing results
              for …" on typo repair / relaxed match); surfacing it was the
              missing client half (S54 Phase 1). */}
          {note && (
            <div
              className="fp-note-shimmer"
              style={{
                padding: '9px 16px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text)',
                background: 'var(--s2)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {note}
            </div>
          )}

          {results.map((r, i) => (
            <DropdownRow
              key={r.figure_id ?? i}
              r={r}
              i={i}
              query={query}
              active={i === activeIdx}
              price={r.figure_id ? prices[r.figure_id] : undefined}
              isLast={i === results.length - 1}
              onActivate={() => setActiveIdx(i)}
            />
          ))}
          <a
            href={`/search?q=${encodeURIComponent(query)}`}
            onClick={() => trackFunnel('search_submit', { query: query.trim(), target: 'hero_all_results' })}
            style={{
              display: 'block',
              // Touch gets a taller tap target (S55 mobile pass).
              padding: isDesktopPointer() ? '10px 16px' : '14px 16px',
              fontSize: '0.8rem',
              color: 'var(--blue)',
              textDecoration: 'none',
              fontWeight: 600,
              background: 'var(--s2)',
              borderRadius: takeover ? '0 0 12px 12px' : '0 0 10px 10px',
              transition: 'opacity 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            See all results for &ldquo;{query}&rdquo; →
          </a>
        </div>,
      )}

      {/* Empty state */}
      {open && query.length >= 2 && !loading && results.length === 0 && renderPanel(
        <div ref={panelRef} style={{
          ...panelStyle,
          padding: '16px',
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: '0.875rem',
        }}>
          No figures found for &ldquo;{query}&rdquo;
        </div>,
      )}
      </div>
    </>
  )

  /** In-place for the plain dropdown; body portal for the fixed takeover panel. */
  function renderPanel(node: React.ReactElement) {
    return inTakeover ? createPortal(node, document.body) : node
  }
}

function DropdownRow({
  r, i, query, active, price, isLast, onActivate,
}: {
  r: SearchResult
  i: number
  query: string
  active: boolean
  price?: SparkPrice
  isLast: boolean
  onActivate: () => void
}) {
  // Quick-look hover card — body-portaled + viewport-clamped, so top rows
  // aren't clipped by the takeover panel's own scroll box. Prices come from
  // the dropdown's batch fetch (passing `price` disables the hook's fetch).
  const { anchorHandlers, quickLook } = useQuickLook({
    image: thumb(r.image, 640),
    name: r.name,
    sub: `${r.brand} ${r.line}${r.series ? ` · Series ${r.series}` : ''}`,
    price: price ?? null,
  })

  // Touch rows get taller padding (S55 mobile pass) — comfort on thumbs;
  // rows only render client-side (post-fetch), so no hydration concern.
  const touch = !isDesktopPointer()

  return (
    <a
      id={`hero-search-opt-${i}`}
      href={resultHref(r)}
      role="option"
      aria-selected={active}
      onClick={() => trackFunnel('search_result_click', {
        query,
        figureId: r.figure_id ?? '',
        target: 'hero_dropdown',
      })}
      {...anchorHandlers}
      onPointerEnter={e => {
        onActivate()
        anchorHandlers.onPointerEnter(e)
      }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: touch ? '13px 16px' : '9px 16px',
        color: 'var(--text)',
        textDecoration: 'none',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        fontSize: '0.9rem',
        background: active ? 'var(--s2)' : 'transparent',
        // Glow only (no lift/tilt) for WP2 — this row sits in a tightly
        // packed list with hairline border-bottom separators; a translateY
        // lift here would visually detach the row from its own separator
        // line, unlike the card-grid surfaces (search results, line/char
        // cards) where the ShelfCase lift+tilt+glow recipe was ported as-is.
        // Driven off `active` (not a bare :hover) so keyboard roving-focus
        // gets the identical treatment mouse-hover does — today both already
        // share the same active-driven background swap; this keeps that
        // parity rather than introducing a new mouse-only effect.
        boxShadow: active ? 'inset 0 0 0 1px rgba(232,182,76,.35), 0 0 14px rgba(232,182,76,.16)' : 'none',
        transition: 'background 0.1s, box-shadow 0.2s',
      }}
    >
      {/* Image or monogram placeholder */}
      <div style={{
        width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 8, flexShrink: 0,
        background: 'var(--s2)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem', overflow: 'hidden',
      }}>
        {r.image
          ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb(r.image, THUMB_CDN_WIDTH) ?? undefined}
              alt=""
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )
          : <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text)' }}>{resultMonogram(r.name)}</span>
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

      {/* Median price — right-aligned gold, honest-blank when no comps (S16
          rule: no comps = show NOTHING, never a placeholder). Sub-label per
          D4: "· N sold" only above the confidence floor. */}
      {price?.median != null && price.median > 0 && (
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <CountUpPrice value={price.median} />
          <div style={{ fontSize: '0.62rem', color: 'var(--muted)', marginTop: 1 }}>
            {price.soldCount >= SOLD_COUNT_CONFIDENCE_FLOOR
              ? `${price.stat ?? 'median'} · ${price.soldCount} sold`
              : (price.stat ?? 'median')}
          </div>
        </div>
      )}

      {quickLook}
    </a>
  )
}

/** ~350ms ease-out count-up for the price pop-in; reduced-motion renders instantly. */
function CountUpPrice({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    // Skip the theater when it can't play: reduced-motion, or a hidden tab
    // (rAF is paused there — without this the price would sit at $0).
    if (document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }
    let raf: number
    const start = performance.now()
    const DURATION = 350
    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1)
      setDisplay(value * (1 - Math.pow(1 - t, 3)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    // Failsafe: if rAF gets throttled mid-animation (tab switch), land on the
    // real value anyway — a stuck "$0" is a price-wrongness bug, not polish.
    const failsafe = setTimeout(() => setDisplay(value), DURATION + 200)
    return () => { cancelAnimationFrame(raf); clearTimeout(failsafe) }
  }, [value])
  return (
    <span style={{
      fontFamily: 'var(--font-display)',
      fontSize: '1.05rem',
      color: 'var(--gold)',
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '0.02em',
    }}>
      ${Math.round(display)}
    </span>
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
