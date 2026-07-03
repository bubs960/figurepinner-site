'use client'
/**
 * QuickLookAnchor — large hover "quick-look" card for tile rails and compact
 * figure cards (S54 follow-up: rail/list thumbs are too small to read — on
 * desktop hover they blow up into a 340px variant-B card).
 *
 * Same visual language as HoverZoomCard (lab variant B) but a different
 * mechanism, because rails live inside overflow-x scroll containers that clip
 * any in-place absolute overlay (same trap as the homepage hero, S54): the
 * card renders through createPortal to document.body at a FIXED position
 * measured from the anchor on hover-intent. A CSS :hover chain can't reach a
 * body portal, so show/hide is JS-driven.
 *
 * Hygiene contract:
 *  - desktop pointers only ((hover:hover)+(pointer:fine) checked in JS);
 *  - 170ms hover-intent delay (scanning a rail doesn't strobe);
 *  - card is pointer-events:none — clicks pass through to the page;
 *  - any scroll hides it (fixed anchors drift under a scrolling page/rail);
 *  - median lazy-fetched once per figure from the edge-cached sparklines
 *    route, cached module-wide, honest-blank until it lands (D4 floor);
 *  - prefers-reduced-motion drops the pop animation (globals.css).
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SOLD_COUNT_CONFIDENCE_FLOOR } from '@/lib/searchDisplay'

type Price = { median: number | null; soldCount: number }

// Module-wide so hovering the same figure twice (or in two rails) never
// refetches. `null` doubles as the in-flight marker.
const priceCache = new Map<string, Price | null>()

const CARD_W = 340
const CARD_EST_H = 470 // pic 340 + caption + padding — used for viewport clamping

export default function QuickLookAnchor({
  href, className, style, image, name, sub, figureId, children,
}: {
  href: string
  className?: string
  style?: React.CSSProperties
  /** Best-available image URL for the card (pass a large rendition). null → no card. */
  image: string | null
  name: string
  sub?: string | null
  /** Enables the lazy median lookup on first hover. */
  figureId?: string
  children: React.ReactNode
}) {
  const anchorRef = useRef<HTMLAnchorElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number; flip: boolean } | null>(null)
  const [price, setPrice] = useState<Price | null>(null)

  function show() {
    const el = anchorRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const flip = r.left + CARD_W + 16 > window.innerWidth
    const left = Math.max(12, flip ? r.right - CARD_W + 8 : r.left - 8)
    const centerY = r.top + r.height / 2
    const half = CARD_EST_H / 2
    const top = Math.round(
      Math.min(Math.max(centerY, half + 12), window.innerHeight - half - 12) - half,
    )
    setPos({ top, left: Math.round(left), flip })

    if (!figureId) return
    if (priceCache.has(figureId)) {
      setPrice(priceCache.get(figureId) ?? null)
      return
    }
    priceCache.set(figureId, null) // in-flight marker
    fetch(`/api/sparklines?ids=${encodeURIComponent(figureId)}`)
      .then(res => (res.ok ? res.json() : {}))
      .then((data: Record<string, Price>) => {
        const p = data[figureId] ?? null
        priceCache.set(figureId, p)
        setPrice(p)
      })
      .catch(() => { priceCache.delete(figureId) })
  }

  function hide() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    setPos(null)
  }

  // Any scroll while open → hide (capture phase catches the rail's own
  // overflow-x scroll, not just the window).
  useEffect(() => {
    if (!pos) return
    const onScroll = () => hide()
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions)
  }, [pos])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  function desktopPointer(): boolean {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches
  }

  return (
    <a
      ref={anchorRef}
      href={href}
      className={className}
      style={style}
      onPointerEnter={() => {
        if (!image || !desktopPointer()) return
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(show, 170)
      }}
      onPointerLeave={hide}
      onFocus={() => { if (image && desktopPointer()) show() }}
      onBlur={hide}
    >
      {children}
      {pos && image && createPortal(
        <div
          className={'fp-ql-card' + (pos.flip ? ' fp-ql-flip' : '')}
          style={{ top: pos.top, left: pos.left }}
          aria-hidden
        >
          <div className="fp-ql-pic">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" decoding="async" />
          </div>
          <div className="fp-ql-cap">
            <div className="fp-ql-name">{name}</div>
            {sub && <div className="fp-ql-sub">{sub}</div>}
            {price?.median != null && price.median > 0 && (
              <div className="fp-ql-price">
                <span className="fp-ql-val">${Math.round(price.median)}</span>
                <span className="fp-ql-lbl">
                  {price.soldCount >= SOLD_COUNT_CONFIDENCE_FLOOR
                    ? `median · ${price.soldCount} sold`
                    : 'median'}
                </span>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </a>
  )
}
