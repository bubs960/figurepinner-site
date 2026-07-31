'use client'
/**
 * Quick-look hover card — THE single hover-enlarge mechanism for every figure
 * surface (search dropdown rows, /search cards, figure-page rails, character
 * hub cards). S54 follow-ups: rail thumbs too small → 340px hover card; then
 * Steve found top-of-viewport hovers clipped the image — cards near the top
 * of the screen (and inside the takeover panel's own scroll clip) cut off.
 *
 * Mechanism: body-portaled FIXED card, measured from the hovered element on
 * hover-intent and CLAMPED to the viewport on both axes — the image is always
 * fully visible no matter where the anchor sits. In-place absolute overlays
 * are unusable here: rails/panels are overflow scrollers and the homepage
 * hero has overflow:hidden (all three clipped in practice).
 *
 * Hygiene contract:
 *  - desktop pointers only ((hover:hover)+(pointer:fine) checked in JS);
 *  - 450ms hover-intent delay (S56: 170ms fired while merely scanning — the
 *    card must feel deliberate, not ambush the pointer);
 *  - card sits BESIDE the anchor (right, flipping left at the viewport edge)
 *    so the rest of the list stays visible while it's open;
 *  - card is pointer-events:none — clicks pass through;
 *  - any scroll hides it (fixed anchors drift under a scrolling page/rail);
 *  - median honest-blank per the D4 sold-count floor; callers with batched
 *    price data pass `price`, callers without pass `figureId` for a lazy
 *    per-figure fetch from the edge-cached sparklines route (module cache);
 *  - prefers-reduced-motion drops the pop animation (globals.css).
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SOLD_COUNT_CONFIDENCE_FLOOR } from '@/lib/searchDisplay'

// `stat` = which aggregate `median` holds ('avg' when the snapshot had no
// median_sold and the sparklines route fell back) — labels must not call an
// average a median (S55 FTC audit).
export type QuickLookPrice = { median: number | null; soldCount: number; stat?: 'median' | 'avg' }

// Module-wide so hovering the same figure twice (or in two rails) never
// refetches. `null` doubles as the in-flight marker.
const priceCache = new Map<string, QuickLookPrice | null>()

const CARD_W = 340
const CARD_EST_H = 470 // pic 340 + clamped caption + padding — viewport clamp basis
const EDGE = 12        // minimum gap to every viewport edge

export interface QuickLookOptions {
  /** Best-available image URL for the card (pass a large rendition). null → no card. */
  image: string | null
  name: string
  sub?: string | null
  /** Lazy per-figure median fetch on first hover. Ignored when `price` is provided. */
  figureId?: string
  /** Caller-supplied price (e.g. search's batched sparklines). Passing this —
   *  even as null — disables the hook's own fetch. */
  price?: QuickLookPrice | null
}

export function useQuickLook({ image, name, sub, figureId, price }: QuickLookOptions) {
  const hoverEl = useRef<HTMLElement | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [fetched, setFetched] = useState<QuickLookPrice | null>(null)
  // First paint of a not-yet-cached image is an instant full-size "pop" —
  // fades it in instead. Stays true after the first load (per-anchor, not
  // per-show) so a repeat hover of the same figure never re-fades.
  const [imgLoaded, setImgLoaded] = useState(false)

  const effectivePrice = price !== undefined ? price : fetched

  function show() {
    const el = hoverEl.current
    if (!el) return
    const r = el.getBoundingClientRect()
    // Horizontal: BESIDE the anchor, never on top of it (S56 — overlaying the
    // row's left edge hid the rest of the list while scanning). Prefer the
    // right side; flip to the left side when there's no room; clamp last.
    const GAP = 14
    const fitsRight = r.right + GAP + CARD_W + EDGE <= window.innerWidth
    const left = Math.min(
      Math.max(EDGE, fitsRight ? r.right + GAP : r.left - GAP - CARD_W),
      window.innerWidth - CARD_W - EDGE,
    )
    // Vertical: center on the anchor, clamped so the card never leaves the
    // viewport (the "image cut off at the top" fix — clamp, don't center).
    // Outer floor: on short viewports (innerHeight < CARD_EST_H + 2*EDGE) the
    // two inner clamp bounds invert and the naive result goes negative —
    // rendering the card above the viewport, overlapping whatever sits at
    // y=0 (search bar, nav). Never let it go above EDGE, even then.
    const centerY = r.top + r.height / 2
    const half = CARD_EST_H / 2
    const top = Math.round(
      Math.max(
        EDGE,
        Math.min(Math.max(centerY, half + EDGE), window.innerHeight - half - EDGE) - half,
      ),
    )
    setPos({ top, left: Math.round(left) })

    if (price !== undefined || !figureId) return
    if (priceCache.has(figureId)) {
      setFetched(priceCache.get(figureId) ?? null)
      return
    }
    priceCache.set(figureId, null) // in-flight marker
    fetch(`/api/sparklines?ids=${encodeURIComponent(figureId)}`)
      .then(res => (res.ok ? res.json() : {}))
      .then((data: Record<string, QuickLookPrice>) => {
        const p = data[figureId] ?? null
        priceCache.set(figureId, p)
        setFetched(p)
      })
      .catch(() => { priceCache.delete(figureId) })
  }

  function hide() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    setPos(null)
  }

  // Any scroll while open → hide (capture phase catches rail/panel scrollers,
  // not just the window).
  useEffect(() => {
    if (!pos) return
    const onScroll = () => hide()
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions)
  }, [pos])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  // Same gate as HeroSearch's isDesktopPointer(): fine pointer AND no touch
  // capability at all. matchMedia alone passes hybrid (touch-screen laptop)
  // devices, where a hover card can ambush a touch interaction — the exact
  // gate shape the 7/25 search-takeover bug came from (7/26 overlay audit).
  function desktopPointer(): boolean {
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    return hasFinePointer && !hasTouch
  }

  const anchorHandlers = {
    onPointerEnter(e: React.PointerEvent<HTMLElement>) {
      if (!image || !desktopPointer()) return
      hoverEl.current = e.currentTarget
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(show, 450)
    },
    onPointerLeave() { hide() },
    onFocus(e: React.FocusEvent<HTMLElement>) {
      if (!image || !desktopPointer()) return
      hoverEl.current = e.currentTarget
      show()
    },
    onBlur() { hide() },
  }

  const quickLook = pos && image
    ? createPortal(
        <div className="fp-ql-card" style={{ top: pos.top, left: pos.left }} aria-hidden>
          <div className="fp-ql-pic">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.2s ease' }}
            />
          </div>
          <div className="fp-ql-cap">
            <div className="fp-ql-name">{name}</div>
            {sub && <div className="fp-ql-sub">{sub}</div>}
            {effectivePrice?.median != null && effectivePrice.median > 0 && (
              <div className="fp-ql-price">
                <span className="fp-ql-val">${Math.round(effectivePrice.median)}</span>
                <span className="fp-ql-lbl">
                  {effectivePrice.soldCount >= SOLD_COUNT_CONFIDENCE_FLOOR
                    ? `${effectivePrice.stat ?? 'median'} · ${effectivePrice.soldCount} sold`
                    : (effectivePrice.stat ?? 'median')}
                </span>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )
    : null

  return { anchorHandlers, quickLook }
}

/** Anchor-shaped convenience wrapper (figure-page rails, character hub cards). */
export default function QuickLookAnchor({
  href, className, style, image, name, sub, figureId, children,
}: QuickLookOptions & {
  href: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const { anchorHandlers, quickLook } = useQuickLook({ image, name, sub, figureId })
  return (
    <a href={href} className={className} style={style} {...anchorHandlers}>
      {children}
      {quickLook}
    </a>
  )
}
