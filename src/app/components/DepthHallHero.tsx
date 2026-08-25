'use client'

/**
 * Depth Hall hero — port of the approved design-chat prototype ("Homepage
 * Depth Hall", cowork project "Figurepinner homepage visual depth",
 * Steve-approved 2026-07-24 — WEB-EOC-2026-07-24-design.md).
 *
 * Server (page.tsx) resolves the cards from SHELF_POOL against the KB, so
 * every card is a real figure with a live pretty URL and a KB-verified
 * photo; the onError guard below removes any card whose photo still fails
 * at runtime (standing pattern from the design EOC: non-R2 fids 404 on
 * canonical.jpg). Ticker items are the page's real sold-comp tape — the
 * prototype's sample prices are NOT shipped.
 *
 * Progressive enhancement (vitrine lesson, 2026-07-23): everything a
 * no-JS/slow-hydration visitor needs — headline, sub, search, chips — is
 * server-rendered markup animated by CSS only; the cards fly on pure CSS
 * keyframes too. Only mouse tilt and the click-to-inspect panel need JS,
 * and both are additive (cards are decorative-plus-shortcut; every figure
 * stays reachable through search and the shelf section below the hero).
 */

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './DepthHallHero.module.css'

// Lets a nested HeroSearch report its takeover-open state up to the liquid
// background's animated filters (2026-08-23 INP investigation — see the
// gate below). No-op default: HeroSearch also renders standalone on
// SiteHeader and [genre] pages, outside any DepthHallHero provider, and
// must work unchanged there.
export const DepthHallSearchActiveContext = createContext<(active: boolean) => void>(() => {})

export type HallCard = {
  fid: string
  href: string
  name: string
  tag: string
  img: string
}

export type HallTickerItem = {
  label: string
  price: number
  href: string
}

/** Deterministic PRNG (mulberry32) — star/mote layouts must be identical
 *  between server render and client hydration, so Math.random() is banned
 *  here. Seed is fixed: the layout is a texture, not content. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Star = { left: string; top: string; size: string; color: string; twinkle: string; delay: string }
type Mote = { left: string; bottom: string; size: string; delay: string; duration: string }

function seedStars(rand: () => number, n: number): Star[] {
  const stars: Star[] = []
  for (let i = 0; i < n; i++) {
    const gold = rand() < 0.12
    stars.push({
      left: (rand() * 100).toFixed(2),
      top: (rand() * 100).toFixed(2),
      size: (0.8 + rand() * 1.6).toFixed(2),
      color: gold ? 'rgba(245,196,98,.85)' : 'rgba(226,232,255,.75)',
      twinkle: (2.5 + rand() * 4).toFixed(2),
      delay: (rand() * 5).toFixed(2),
    })
  }
  return stars
}

function seedMotes(rand: () => number, n: number): Mote[] {
  const arr: Mote[] = []
  for (let i = 0; i < n; i++) {
    arr.push({
      left: (6 + rand() * 88).toFixed(1),
      bottom: (4 + rand() * 30).toFixed(1),
      size: (1.6 + rand() * 2.4).toFixed(1),
      delay: (rand() * 6).toFixed(2),
      duration: (6 + rand() * 5).toFixed(2),
    })
  }
  return arr
}

const HALL_DURATION_S = 17

export default function DepthHallHero({
  cards,
  ticker,
  children,
}: {
  cards: HallCard[]
  ticker: HallTickerItem[]
  /** Search + hint chips block, rendered by the server page so HeroSearch
   *  keeps its existing server-fed props (placeholder examples etc.). */
  children?: React.ReactNode
}) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, px: 0, py: 0 })
  const [broken, setBroken] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<HallCard | null>(null)
  // SMIL <animate> nodes ignore CSS animation:none, so reduced-motion must
  // also be React state that unmounts them (review finding, 2026-07-24).
  const [reduced, setReduced] = useState(false)
  // Paused (not unmounted, unlike `reduced`) while the search takeover is
  // open: the takeover's own backdrop fully covers this hero, so the
  // animation is invisible but still costing continuous SMIL/filter
  // recompute on the main thread -- exactly the paint-cost competitor the
  // 2026-08-13 startTransition mitigation couldn't reach (that only
  // reprioritizes React's own scheduling, not browser paint work).
  const [searchActive, setSearchActive] = useState(false)
  // Phase 9 lazy-load (2026-08-24, WEBAUDIT-TO-WEB-CURRENT-STATE-AND-NEXT-STEPS):
  // every card previously forced `loading="eager"` unconditionally, so all 12
  // fired their image fetch on the very first paint even though only a couple
  // are near the camera at any moment in the loop. Native `loading="lazy"`
  // can't fix this (still the 2026-07-24 finding below — 3D transform breaks
  // the browser's own viewport check), so this reuses the scene-level
  // IntersectionObserver's signal instead: cards past the first couple per
  // side stay `src`-less (no fetch) until the hero itself is confirmed
  // on-screen, then all load together. Trade-off stated per R16: a no-JS
  // visitor never gets these deferred images (only the first-couple-per-side
  // eager set) — acceptable because every card is already aria-hidden/
  // tabIndex=-1 decoration, and every figure stays reachable via search and
  // the shelf section below regardless.
  const [heroInView, setHeroInView] = useState(false)
  const reducedRef = useRef(false)
  const tickingRef = useRef(false)
  const mouseRef = useRef({ mx: 0, my: 0 })
  const panelRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const sceneRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    reducedRef.current = prefersReduced
    if (prefersReduced) setReduced(true)
  }, [])

  // Scroll-jank fix (Steve report, 2026-08-14 — stutter at the hero/shelf
  // seam): pause the hero's decorative animation stack while the page is
  // actively scrolling, and keep it paused whenever the hero is fully
  // off-screen. CSS layers pause via the scrollCalm class; the SMIL
  // turbulence filters must be paused via svg.pauseAnimations() because
  // SMIL ignores CSS animation-play-state.
  //
  // Search-takeover extension (2026-08-23 INP investigation): the takeover's
  // own backdrop fully covers this hero when open, so `searchActive` reuses
  // the SAME pause path -- the animation is invisible either way, but
  // pausing it here removes continuous filter-recompute paint work from
  // competing with the takeover's own reflow. The startTransition mitigation
  // (2026-08-13, HeroSearch.tsx) only reprioritizes React's scheduling; it
  // can't touch this, which is why CF RUM showed no improvement.
  useEffect(() => {
    if (reduced) {
      // Reduced-motion renders everything static (no loop to defer against),
      // so every card image should just load like a normal page.
      setHeroInView(true)
      return
    }
    const scene = sceneRef.current
    if (!scene) return
    const svgs = scene.querySelectorAll('svg')

    let scrolling = false
    let offscreen = false
    let idleTimer: ReturnType<typeof setTimeout> | undefined
    const apply = () => {
      const calm = scrolling || offscreen || searchActive
      scene.classList.toggle(styles.scrollCalm, calm)
      svgs.forEach(s => { calm ? s.pauseAnimations() : s.unpauseAnimations() })
    }
    const onScroll = () => {
      if (!scrolling) { scrolling = true; apply() }
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => { scrolling = false; apply() }, 150)
    }
    const io = new IntersectionObserver(
      entries => {
        offscreen = !entries[0].isIntersecting
        apply()
        if (entries[0].isIntersecting) setHeroInView(true)
      },
      { threshold: 0 },
    )
    io.observe(scene)
    window.addEventListener('scroll', onScroll, { passive: true })
    apply() // searchActive can already be true on mount of this effect's deps change
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(idleTimer)
      io.disconnect()
    }
  }, [reduced, searchActive])

  // Inspect panel focus management (review finding, 2026-07-24): dialog
  // semantics need initial focus, a Tab trap, and focus restoration —
  // role="dialog" alone does none of that. Escape closes.
  useEffect(() => {
    if (!selected) return
    const panel = panelRef.current
    const focusables = () =>
      panel
        ? [...panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
        : []
    focusables()[0]?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelected(null)
        return
      }
      if (e.key !== 'Tab') return
      const els = focusables()
      if (!els.length) return
      const first = els[0]
      const last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      openerRef.current?.focus?.()
      openerRef.current = null
    }
  }, [selected])

  const { starLayers, motes } = useMemo(() => {
    const rand = mulberry32(0xf1663)
    return {
      starLayers: [
        { duration: 44, delay: -22, stars: seedStars(rand, 55) },
        { duration: 44, delay: 0, stars: seedStars(rand, 55) },
      ],
      motes: seedMotes(rand, 9),
    }
  }, [])

  // Left/right colonnades with the prototype's stagger: ONE shared step
  // (computed from the left side, exactly like the prototype's
  // `step = 17 / LEFT.length`) spreads both sides across the loop, with the
  // right side offset by half that same step so the columns interleave.
  // Per-side steps break the interleave on uneven splits (review finding).
  const laidOut = useMemo(() => {
    const half = Math.ceil(cards.length / 2)
    const left = cards.slice(0, half)
    const right = cards.slice(half)
    const out: Array<HallCard & { side: 'L' | 'R'; delay: string }> = []
    const step = HALL_DURATION_S / Math.max(1, left.length)
    left.forEach((c, i) => out.push({ ...c, side: 'L', delay: (-i * step).toFixed(2) }))
    right.forEach((c, i) => out.push({ ...c, side: 'R', delay: (-(i * step + step / 2)).toFixed(2) }))
    return out
  }, [cards])

  const onMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (reducedRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    mouseRef.current.mx = (e.clientX - rect.left) / rect.width - 0.5
    mouseRef.current.my = (e.clientY - rect.top) / rect.height - 0.5
    if (tickingRef.current) return
    tickingRef.current = true
    requestAnimationFrame(() => {
      tickingRef.current = false
      const { mx, my } = mouseRef.current
      setTilt({ rx: my * -3.4, ry: mx * 5.5, px: mx * -14, py: my * -10 })
    })
  }, [])

  const onLeave = useCallback(() => setTilt({ rx: 0, ry: 0, px: 0, py: 0 }), [])

  const visibleCards = laidOut.filter(c => !broken[c.fid])

  return (
    <section
      ref={sceneRef}
      className={styles.scene}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ '--fp-dur': `${HALL_DURATION_S}s` } as React.CSSProperties}
    >
      <div className={styles.viewport}>
        {/* starfield */}
        {starLayers.map((layer, li) => (
          <div
            className={styles.starLayer}
            key={li}
            style={{ animationDuration: `${layer.duration}s`, animationDelay: `${layer.delay}s` }}
            aria-hidden
          >
            {layer.stars.map((s, si) => (
              <div
                className={styles.star}
                key={si}
                style={{
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  background: s.color,
                  animationDuration: `${s.twinkle}s`,
                  animationDelay: `${s.delay}s`,
                }}
              />
            ))}
          </div>
        ))}

        {/* liquid background */}
        <div className={`${styles.blob} ${styles.blobA}`} aria-hidden />
        <div className={`${styles.blob} ${styles.blobB}`} aria-hidden />
        <div className={`${styles.blob} ${styles.blobC}`} aria-hidden />
        <div className={styles.liquid} aria-hidden>
          <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <filter id="fpLiquidSheen" x="-20%" y="-20%" width="140%" height="140%">
                {/* SMIL <animate> ignores CSS animation:none — under reduced
                    motion these nodes must not render at all (review finding). */}
                <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.008" numOctaves={3} seed={11} result="noise">
                  {!reduced && <animate attributeName="baseFrequency" values="0.0035 0.008;0.0055 0.012;0.0035 0.008" dur="26s" repeatCount="indefinite" />}
                </feTurbulence>
                <feSpecularLighting in="noise" surfaceScale={5} specularConstant={0.85} specularExponent={16} lightingColor="#8f9dd8" result="spec">
                  <feDistantLight azimuth={235} elevation={60}>
                    {!reduced && <animate attributeName="azimuth" values="235;255;235" dur="30s" repeatCount="indefinite" />}
                  </feDistantLight>
                </feSpecularLighting>
                <feComposite in="spec" in2="SourceAlpha" operator="in" />
              </filter>
              <filter id="fpLiquidGold" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.0022 0.005" numOctaves={2} seed={4} result="noise2">
                  {!reduced && <animate attributeName="baseFrequency" values="0.0022 0.005;0.0034 0.0075;0.0022 0.005" dur="34s" repeatCount="indefinite" />}
                </feTurbulence>
                <feSpecularLighting in="noise2" surfaceScale={6} specularConstant={0.6} specularExponent={22} lightingColor="#e0a83e" result="spec2">
                  <feDistantLight azimuth={120} elevation={55} />
                </feSpecularLighting>
                <feComposite in="spec2" in2="SourceAlpha" operator="in" />
              </filter>
              <linearGradient id="fpLiquidMask" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity=".9" />
                <stop offset=".45" stopColor="#fff" stopOpacity=".35" />
                <stop offset="1" stopColor="#fff" stopOpacity=".75" />
              </linearGradient>
              <mask id="fpLiquidFade">
                <rect width="100%" height="100%" fill="url(#fpLiquidMask)" />
              </mask>
            </defs>
            <g mask="url(#fpLiquidFade)">
              <rect width="100%" height="100%" fill="#000" filter="url(#fpLiquidSheen)" opacity=".55" />
              <rect width="100%" height="100%" fill="#000" filter="url(#fpLiquidGold)" opacity=".4" />
            </g>
          </svg>
        </div>

        {/* ceiling light shaft */}
        <div className={styles.shaft} aria-hidden />

        {/* the hall */}
        <div className={styles.stage}>
          <div
            className={styles.camera}
            style={{ '--fp-rx': `${tilt.rx}deg`, '--fp-ry': `${tilt.ry}deg` } as React.CSSProperties}
          >
            {/* Cards are aria-hidden + tabIndex -1 (review findings,
                2026-07-24): they're mouse/touch shortcuts — 12 flying
                buttons in tab order before the search input is a keyboard
                trap, and each spends 25% of its loop focusable-but-
                invisible. Every figure stays reachable via search and the
                shelf below. */}
            {visibleCards.map((c, i) => {
              // First card per side (delay 0, closest to the front of the
              // loop on mount) stays eager; the rest wait on heroInView.
              const eager = i < 2
              const showImg = eager || heroInView
              return (
              <button
                type="button"
                className={`${styles.card} ${c.side === 'L' ? styles.cardL : styles.cardR}`}
                key={`${c.side}-${c.fid}`}
                style={{
                  animationDelay: `${c.delay}s`,
                  animationPlayState: selected ? 'paused' : 'running',
                }}
                onClick={e => {
                  openerRef.current = e.currentTarget
                  setSelected(c)
                }}
                aria-hidden="true"
                tabIndex={-1}
              >
                <span className={styles.cardSpot} aria-hidden />
                <span className={styles.cardBody}>
                  <span className={styles.cardGlow} aria-hidden />
                  <span className={styles.cardImgBox}>
                    {/* Not `loading="lazy"`: these ride 3D-transformed cards
                        that start at translateZ(-4400px)/opacity 0 — Chrome's
                        native lazy-load viewport check never fires there, so
                        a lazy image simply never loads (live incident,
                        2026-07-24). Deferred instead via `showImg` (Phase 9,
                        2026-08-24): only the first card per side renders
                        `src` immediately; the rest wait for the scene-level
                        IntersectionObserver above to confirm the hero is
                        actually on-screen before starting their fetch, so a
                        dozen images don't all compete for bandwidth on the
                        very first paint. */}
                    {showImg && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className={styles.cardImg}
                      src={c.img}
                      alt=""
                      loading="eager"
                      fetchPriority="low"
                      decoding="async"
                      onError={() => setBroken(b => ({ ...b, [c.fid]: true }))}
                    />
                    )}
                  </span>
                  <span className={styles.cardPlacard}>
                    <span className={styles.cardName}>{c.name}</span>
                    <span className={styles.cardTag}>{c.tag}</span>
                  </span>
                </span>
              </button>
              )
            })}
          </div>
        </div>

        {/* floor grid + motes + vignette */}
        <div className={styles.floor} aria-hidden />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
          {motes.map((m, i) => (
            <div
              className={styles.mote}
              key={i}
              style={{
                left: `${m.left}%`,
                bottom: `${m.bottom}%`,
                width: `${m.size}px`,
                height: `${m.size}px`,
                animationDelay: `${m.delay}s`,
                animationDuration: `${m.duration}s`,
              }}
            />
          ))}
        </div>
        <div className={styles.vignetteSoft} aria-hidden />
        <div className={styles.vignetteHard} aria-hidden />

        {/* centered content — server-rendered, readable without JS */}
        <div className={styles.content}>
          <div
            className={styles.parallax}
            style={{ transform: `translate3d(${tilt.px}px, ${tilt.py}px, 0)` }}
          >
            <DepthHallSearchActiveContext.Provider value={setSearchActive}>
              {children}
            </DepthHallSearchActiveContext.Provider>
          </div>
        </div>

        {/* live comps ticker — real tape solds only; hidden when empty */}
        {ticker.length >= 4 && (
          <div className={styles.ticker}>
            <div className={styles.tickerLabel}>
              <span className={styles.tickerDot} />
              LIVE COMPS
            </div>
            <div className={styles.tickerWindow}>
              <div className={styles.tickerTrack}>
                {ticker.map((t, i) => (
                  <a className={styles.tickerItem} href={t.href} key={i}>
                    SOLD · <span className={styles.tickerName}>{t.label}</span>{' '}
                    <span className={styles.tickerPrice}>${t.price.toFixed(2)}</span>
                  </a>
                ))}
                {/* Marquee clone — visual only; hidden from AT and tab order
                    so users don't hit every sold comp twice (review finding). */}
                {ticker.map((t, i) => (
                  <a className={styles.tickerItem} href={t.href} key={`c-${i}`} aria-hidden="true" tabIndex={-1}>
                    SOLD · <span className={styles.tickerName}>{t.label}</span>{' '}
                    <span className={styles.tickerPrice}>${t.price.toFixed(2)}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* inspect panel */}
        {selected && (
          <div
            className={styles.inspectOverlay}
            onClick={() => setSelected(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.name} — from the guide`}
          >
            <div className={styles.inspectPanel} onClick={e => e.stopPropagation()} ref={panelRef}>
              <div className={styles.inspectStage}>
                <div className={styles.inspectShaft} aria-hidden />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.inspectImg} src={selected.img} alt={`${selected.name} action figure`} />
              </div>
              <div className={styles.inspectBody}>
                <div className={styles.inspectKicker}>From the guide</div>
                <div className={styles.inspectName}>{selected.name}</div>
                <div className={styles.inspectTag}>{selected.tag}</div>
                <div className={styles.inspectCopy}>
                  Live value, sold comps, and variant checklist — priced from real eBay solds.
                </div>
                <div className={styles.inspectActions}>
                  <a className={styles.inspectCta} href={selected.href}>
                    View price guide
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#09090F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                  <button type="button" className={styles.inspectBack} onClick={() => setSelected(null)}>
                    Back to the hall
                  </button>
                </div>
              </div>
              <button
                type="button"
                className={styles.inspectClose}
                title="Close"
                aria-label="Close"
                onClick={() => setSelected(null)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EEEEF5" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                  <path d="M5 5l14 14M19 5L5 19" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* entrance curtain */}
        <div className={styles.curtain} aria-hidden />
      </div>
    </section>
  )
}
