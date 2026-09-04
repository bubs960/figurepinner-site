'use client'
/**
 * QuickLookDelegate — ONE per page. Gives server-rendered anchors the same
 * quick-look hover card QuickLookAnchor provides, without a client component
 * per card.
 *
 * Release N (2026-09-04, speed program S3): the character hub rendered every
 * card as a client QuickLookAnchor, so React shipped each card twice — once
 * as HTML, once as serialized props in the RSC flight (webaudit hub deep-dive
 * breakthrough 3, 2026-09-02). Same architecture as ThumbLoadDelegate: a
 * single capture-phase listener pair on `document` covers every anchor on
 * the page, including ones that stream in later.
 *
 * Anchor contract (server markup):
 *   <a href=… data-ql data-ql-image="…" data-ql-name="…" data-ql-sub="…" data-ql-fid="…">
 * `data-ql-image` empty/absent → no card (mirrors `image: null`).
 *
 * Hygiene contract is quickLookCore's, verbatim: desktop pointers only
 * (desktopPointer gate, do not loosen), HOVER_INTENT_MS delay on pointer,
 * immediate on keyboard focus, beside-not-over placement with viewport
 * clamp, hide on any scroll, pointer-events:none card, honest-blank median.
 *
 * Renders nothing until a card is open. Safe on pages with no `[data-ql]`.
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SOLD_COUNT_CONFIDENCE_FLOOR } from '@/lib/searchDisplay'
import {
  computeCardPosition, desktopPointer, fetchQuickLookPrice, peekQuickLookPrice,
  HOVER_INTENT_MS, type QuickLookPrice,
} from './quickLookCore'

type Open = {
  anchor: HTMLElement
  image: string
  name: string
  sub: string | null
  figureId: string | null
  pos: { top: number; left: number }
}

function readAnchor(el: HTMLElement) {
  const image = el.getAttribute('data-ql-image') || ''
  return {
    image,
    name: el.getAttribute('data-ql-name') || '',
    sub: el.getAttribute('data-ql-sub') || null,
    figureId: el.getAttribute('data-ql-fid') || null,
  }
}

export default function QuickLookDelegate() {
  const [open, setOpen] = useState<Open | null>(null)
  const [price, setPrice] = useState<QuickLookPrice | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null } }
    const hide = () => { clear(); pending.current = null; setOpen(null) }

    const show = (el: HTMLElement) => {
      const a = readAnchor(el)
      if (!a.image) return
      const r = el.getBoundingClientRect()
      setImgLoaded(false)
      setOpen({ anchor: el, ...a, pos: computeCardPosition(r, window.innerWidth, window.innerHeight) })
      setPrice(null)
      if (!a.figureId) return
      const known = peekQuickLookPrice(a.figureId)
      if (known) { setPrice(known); return }
      const fid = a.figureId
      fetchQuickLookPrice(fid).then(p => {
        // Only apply if this anchor is still the open one.
        if (pending.current === el) setPrice(p)
      })
    }

    const anchorOf = (t: EventTarget | null): HTMLElement | null =>
      t instanceof Element ? (t.closest('[data-ql]') as HTMLElement | null) : null

    const onOver = (e: PointerEvent) => {
      const el = anchorOf(e.target)
      if (!el || el === pending.current) return
      if (!desktopPointer()) return
      clear()
      pending.current = el
      timer.current = setTimeout(() => { if (pending.current === el) show(el) }, HOVER_INTENT_MS)
    }
    const onOut = (e: PointerEvent) => {
      const el = anchorOf(e.target)
      if (!el || el !== pending.current) return
      // Moving between children of the same anchor is not a leave.
      if (e.relatedTarget instanceof Node && el.contains(e.relatedTarget)) return
      hide()
    }
    const onFocusIn = (e: FocusEvent) => {
      const el = anchorOf(e.target)
      if (!el || !desktopPointer()) return
      clear()
      pending.current = el
      show(el)
    }
    const onFocusOut = (e: FocusEvent) => {
      const el = anchorOf(e.target)
      if (el && el === pending.current) hide()
    }
    const onScroll = () => { if (pending.current) hide() }

    document.addEventListener('pointerover', onOver, true)
    document.addEventListener('pointerout', onOut, true)
    document.addEventListener('focusin', onFocusIn, true)
    document.addEventListener('focusout', onFocusOut, true)
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => {
      clear()
      document.removeEventListener('pointerover', onOver, true)
      document.removeEventListener('pointerout', onOut, true)
      document.removeEventListener('focusin', onFocusIn, true)
      document.removeEventListener('focusout', onFocusOut, true)
      window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions)
    }
  }, [])

  if (!open) return null
  return createPortal(
    <div className="fp-ql-card" style={{ top: open.pos.top, left: open.pos.left }} aria-hidden>
      <div className="fp-ql-pic">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={open.image}
          alt=""
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.2s ease' }}
        />
      </div>
      <div className="fp-ql-cap">
        <div className="fp-ql-name">{open.name}</div>
        {open.sub && <div className="fp-ql-sub">{open.sub}</div>}
        {price?.median != null && price.median > 0 && (
          <div className="fp-ql-price">
            <span className="fp-ql-val">${Math.round(price.median)}</span>
            <span className="fp-ql-lbl">
              {price.soldCount >= SOLD_COUNT_CONFIDENCE_FLOOR
                ? `${price.stat ?? 'median'} · ${price.soldCount} sold`
                : (price.stat ?? 'median')}
            </span>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
