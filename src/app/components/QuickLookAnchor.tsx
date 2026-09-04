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
// Release N (2026-09-04): position/gate/price-cache rules live in
// quickLookCore.ts, shared with QuickLookDelegate (the character hub's
// one-per-page consumer). This hook's behaviour is unchanged.
import {
  computeCardPosition, desktopPointer, fetchQuickLookPrice, peekQuickLookPrice,
  HOVER_INTENT_MS, type QuickLookPrice,
} from './quickLookCore'

// `stat` = which aggregate `median` holds ('avg' when the snapshot had no
// median_sold and the sparklines route fell back) — labels must not call an
// average a median (S55 FTC audit).
export type { QuickLookPrice }

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
    // Beside-not-over placement + viewport clamp (S54/S56) — see quickLookCore.
    setPos(computeCardPosition(el.getBoundingClientRect(), window.innerWidth, window.innerHeight))

    if (price !== undefined || !figureId) return
    const known = peekQuickLookPrice(figureId)
    if (known !== undefined) {
      setFetched(known ?? null)
      if (known !== null) return
    }
    fetchQuickLookPrice(figureId).then(p => setFetched(p))
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

  // desktopPointer() (7/25 search-takeover / 7/26 overlay-audit gate) is
  // quickLookCore's — the same function the delegate uses.
  const anchorHandlers = {
    onPointerEnter(e: React.PointerEvent<HTMLElement>) {
      if (!image || !desktopPointer()) return
      hoverEl.current = e.currentTarget
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(show, HOVER_INTENT_MS)
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
