'use client'
/**
 * HoverZoomCard — the "Quick-Look" hover overlay (S53 lab variant B, ported
 * S54 per WEB-SEARCH-WOW-PLAN-2026-07-03 D1: B everywhere, C reserved for
 * grail-tier rows later).
 *
 * Renders a floating card (big image + name + line + live median in gold)
 * that appears when the parent row is hovered or keyboard-focused. The parent
 * row supplies the trigger: give it className="fp-hz-row" and
 * position:relative — all show/hide styling lives in globals.css under
 * `@media (hover:hover) and (pointer:fine)`, so touch devices never render
 * or animate it (base rule is display:none).
 *
 * Hygiene contract (from the lab, keep intact):
 *  - overlay only: absolutely positioned, pointer-events:none → zero CLS,
 *    clicks pass through to the row.
 *  - the base image reuses the row thumb's exact CDN rendition URL (cache
 *    hit, no extra fetch); the 480px rendition is fetched once, only after
 *    the parent flips `hot` on first pointerenter (one fetch per row max).
 *  - transform/opacity transitions only, ~170ms intent delay via
 *    transition-delay; prefers-reduced-motion collapses to a fade.
 */

import { useEffect, useState } from 'react'
import { thumb } from '@/lib/imageUrl'
import { SOLD_COUNT_CONFIDENCE_FLOOR } from '@/lib/searchDisplay'

export default function HoverZoomCard({
  image,
  name,
  line,
  median,
  soldCount,
  baseWidth = 176,
  hot = false,
  flip = false,
}: {
  image: string | null | undefined
  name: string
  line: string
  median?: number | null
  soldCount?: number
  /** CDN width the row thumb already fetched — reuse it so the base paint is a cache hit. */
  baseWidth?: number
  /** Parent sets true on first pointerenter → triggers the one-time 480px sharpen. */
  hot?: boolean
  /** Anchor to the row's right edge (viewport-edge flip on right-column cards). */
  flip?: boolean
}) {
  const base = thumb(image, baseWidth)
  const [src, setSrc] = useState(base)

  // Progressive sharpen: preload the 480px rendition off-DOM, swap when ready.
  // The low-res base is already painted underneath, so the swap is a sharpen,
  // never a blank frame.
  useEffect(() => {
    if (!hot || !image) return
    const big = thumb(image, 480)
    if (!big || big === base) return
    const hi = new window.Image()
    hi.onload = () => setSrc(big)
    hi.src = big
  }, [hot, image, base])

  if (!base) return null // no photo → no zoom card (honest blank, monogram rows stay quiet)

  return (
    <div className={'fp-hz-card' + (flip ? ' fp-hz-flip' : '')} aria-hidden>
      <div className="fp-hz-pic">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src ?? undefined} alt="" decoding="async" />
      </div>
      <div className="fp-hz-cap">
        <div className="fp-hz-name">{name}</div>
        <div className="fp-hz-line">{line}</div>
        {median != null && median > 0 && (
          <div className="fp-hz-price">
            <span className="fp-hz-val">${Math.round(median)}</span>
            <span className="fp-hz-sub">
              {(soldCount ?? 0) >= SOLD_COUNT_CONFIDENCE_FLOOR
                ? `median · ${soldCount} sold`
                : 'median'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
