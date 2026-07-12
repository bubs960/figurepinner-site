'use client'

// ClaimRitual.tsx — Session 1 de-risk gate spike for the Claiming Ritual.
//
// SCOPE (hard boundary, per product spec): bare photo-flight ONLY. No
// nameplate, no particles, no sound, no brass corner pin, no Shelf page
// changes, no share cards — "hard stop, judge's condition" until this gate
// passes. Do not extend this component beyond that without a new spec pass.
//
// Mounted ONCE, globally, via next/dynamic({ ssr:false }) in src/app/layout.tsx.
// Listens for a window CustomEvent('figure:claimed') (dispatched by
// FigureActions.tsx on a successful "Add to Collection") and flies the
// figure's own photo from its on-screen position to a small fixed "Vault"
// placeholder anchor (top-right — the future nav icon doesn't exist yet).
//
// Flight technique:
//   - document.startViewTransition() when the browser supports it (feature-
//     detected via `typeof document.startViewTransition === 'function'`,
//     never UA-sniffed).
//   - Otherwise a hand-rolled FLIP: clone the image node, position it fixed
//     at the source rect, then on the next two rAFs animate transform+opacity
//     to the target rect via a CSS transition (cubic-bezier(.34,1.56,.64,1) —
//     the spec's weighted-settle curve). This is the same clone/rAF/transform
//     technique ShelfCase.tsx's flyToTray() already proves in production,
//     reimplemented here for a single detail-page photo + a fixed anchor
//     instead of a shelf grid + tray — not a verbatim copy.
//   - A manual `?flight=flip` / `?flight=svt` query param (read once on
//     mount) lets a human tester force either path on any browser for a
//     side-by-side comparison — the actual de-risk-gate deliverable of this
//     session. Forcing `svt` on a browser that lacks it still falls back to
//     FLIP rather than throwing.
//   - prefers-reduced-motion: reduce skips the flight entirely and just
//     does a quick ~200ms opacity fade at the target anchor.
//
// collection_claim_ritual_played fires once the flight actually completes
// (not on event receipt) — see src/app/_lib/funnelClient.ts's FunnelEvent
// union and src/app/api/funnel/route.ts's ALLOWED_EVENTS. Both sides were
// updated together in this change (documented "two-layer allowlist trap":
// an event added to only one side silently 400s forever).

import { useEffect, useRef } from 'react'
import { trackFunnel } from '@/app/_lib/funnelClient'

type ClaimedRect = { left: number; top: number; width: number; height: number }

type ClaimedDetail = {
  figureId?: string
  imgSrc?: string | null
  rect?: ClaimedRect | null
}

type FlightMode = 'flip' | 'svt'

// `ViewTransition` and `Document#startViewTransition` are already declared by
// TypeScript's bundled DOM lib (5.9+) — no ambient augmentation needed for
// those. We only need to teach TS about our own custom event's detail shape.
declare global {
  interface WindowEventMap {
    'figure:claimed': CustomEvent<ClaimedDetail>
  }
}

const ANCHOR_SIZE = 24
const ANCHOR_IDLE_OPACITY = 0.28
const ANCHOR_ACTIVE_OPACITY = 0.95
const FLIGHT_MS = 620
const VIEW_TRANSITION_NAME = 'fp-claim-photo'

function rectOf(el: HTMLElement): ClaimedRect {
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

/** Clone the figure photo at its live source rect, fixed-positioned and
 *  appended to <body>, ready for either flight path to animate. Caller owns
 *  removing it once the flight finishes. */
function makeFlightClone(imgSrc: string, source: ClaimedRect): HTMLImageElement {
  const clone = document.createElement('img')
  clone.src = imgSrc
  clone.alt = ''
  clone.style.position = 'fixed'
  clone.style.left = `${source.left}px`
  clone.style.top = `${source.top}px`
  clone.style.width = `${source.width}px`
  clone.style.height = `${source.height}px`
  clone.style.margin = '0'
  clone.style.zIndex = '2147483000'
  clone.style.pointerEvents = 'none'
  clone.style.objectFit = 'cover'
  clone.style.borderRadius = '6px'
  clone.style.boxShadow = '0 10px 26px rgba(0,0,0,.5)'
  clone.style.willChange = 'transform, opacity'
  document.body.appendChild(clone)
  return clone
}

/** Hand-rolled FLIP path — adapted from ShelfCase.tsx's flyToTray(): clone at
 *  the source rect, double-rAF past a paint, then transition transform+opacity
 *  to the target (translate+scale, since the clone stays absolutely
 *  positioned at its original left/top rather than being re-measured). */
function flyFlip(imgSrc: string, source: ClaimedRect, target: ClaimedRect, onDone: () => void) {
  const clone = makeFlightClone(imgSrc, source)
  clone.style.transition =
    `transform ${FLIGHT_MS}ms cubic-bezier(.34,1.56,.64,1), opacity 480ms ease, border-radius 480ms ease`

  const tx = (target.left + target.width / 2) - (source.left + source.width / 2)
  const ty = (target.top + target.height / 2) - (source.top + source.height / 2)
  const scale = Math.max(target.width / source.width, 0.02)

  requestAnimationFrame(() => requestAnimationFrame(() => {
    clone.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`
    clone.style.opacity = '0'
    clone.style.borderRadius = '50%'
  }))

  window.setTimeout(() => {
    clone.remove()
    onDone()
  }, FLIGHT_MS + 60)
}

/** document.startViewTransition path. Same source/target contract as
 *  flyFlip() so the two are directly comparable on a real device. The
 *  browser captures the clone's "old" state before the callback runs and its
 *  "new" state after, then generates the morph itself; the scoped
 *  ::view-transition-* CSS in this component's render just aligns the
 *  duration with FLIGHT_MS for a fair side-by-side.
 *
 *  document.startViewTransition() can throw synchronously on a browser that
 *  feature-detects true but ships a buggy/partial implementation. Guard it
 *  and fall back to the FLIP path (removing the clone this function created
 *  first, since flyFlip makes its own) rather than letting the exception
 *  escape the 'figure:claimed' listener — an uncaught throw here would skip
 *  onDone() entirely, permanently wedging onClaimed's inFlightRef guard and
 *  leaking the cloned <img> in the DOM. */
function flySvt(imgSrc: string, source: ClaimedRect, target: ClaimedRect, onDone: () => void) {
  const clone = makeFlightClone(imgSrc, source)
  clone.style.viewTransitionName = VIEW_TRANSITION_NAME

  let transition: ViewTransition
  try {
    transition = document.startViewTransition(() => {
      clone.style.left = `${target.left}px`
      clone.style.top = `${target.top}px`
      clone.style.width = `${target.width}px`
      clone.style.height = `${target.height}px`
      clone.style.opacity = '0'
      clone.style.borderRadius = '50%'
    })
  } catch {
    clone.remove()
    flyFlip(imgSrc, source, target, onDone)
    return
  }

  transition.finished
    .catch(() => {
      // finished rejects if the transition is skipped (e.g. interrupted by
      // another transition or navigation) — the flight already visually
      // completed or was abandoned either way; onDone() still needs to run
      // so the in-flight guard clears, and this catch just keeps that
      // rejection from surfacing as an unhandled promise rejection.
    })
    .finally(() => {
      clone.style.viewTransitionName = ''
      clone.remove()
      onDone()
    })
}

export default function ClaimRitual() {
  const anchorRef = useRef<HTMLDivElement>(null)
  const inFlightRef = useRef(false)
  const forcedFlightRef = useRef<FlightMode | null>(null)

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const forced = params.get('flight')
      if (forced === 'flip' || forced === 'svt') forcedFlightRef.current = forced
    } catch {
      // Fail open to auto-detection — a malformed query string is not fatal.
    }

    function pulseAnchor() {
      const el = anchorRef.current
      if (!el) return
      el.style.transition = 'opacity .25s ease'
      el.style.opacity = String(ANCHOR_ACTIVE_OPACITY)
      window.setTimeout(() => {
        el.style.opacity = String(ANCHOR_IDLE_OPACITY)
      }, 650)
    }

    function settle(mode: FlightMode) {
      trackFunnel('collection_claim_ritual_played', { flight: mode })
      inFlightRef.current = false
    }

    function onClaimed(event: WindowEventMap['figure:claimed']) {
      // Guard against a double-fire (e.g. a fast double-click) stacking a
      // second flight on top of one already in progress.
      if (inFlightRef.current) return

      const detail = event.detail
      const anchor = anchorRef.current
      if (!detail?.imgSrc || !detail.rect || !anchor) return
      if (detail.rect.width <= 0 || detail.rect.height <= 0) return

      const supportsSvt = typeof document.startViewTransition === 'function'
      let mode: FlightMode = supportsSvt ? 'svt' : 'flip'
      if (forcedFlightRef.current === 'flip') mode = 'flip'
      else if (forcedFlightRef.current === 'svt') mode = supportsSvt ? 'svt' : 'flip'

      inFlightRef.current = true
      const target = rectOf(anchor)
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reduced) {
        anchor.style.transition = 'opacity 200ms ease'
        anchor.style.opacity = String(ANCHOR_ACTIVE_OPACITY)
        window.setTimeout(() => {
          anchor.style.opacity = String(ANCHOR_IDLE_OPACITY)
          settle(mode)
        }, 200)
        return
      }

      const onFlightDone = () => {
        pulseAnchor()
        settle(mode)
      }

      if (mode === 'svt') {
        flySvt(detail.imgSrc, detail.rect, target, onFlightDone)
      } else {
        flyFlip(detail.imgSrc, detail.rect, target, onFlightDone)
      }
    }

    window.addEventListener('figure:claimed', onClaimed)
    return () => window.removeEventListener('figure:claimed', onClaimed)
  }, [])

  return (
    <>
      <style>{`
        ::view-transition-group(${VIEW_TRANSITION_NAME}),
        ::view-transition-old(${VIEW_TRANSITION_NAME}),
        ::view-transition-new(${VIEW_TRANSITION_NAME}) {
          animation-duration: ${FLIGHT_MS}ms;
        }
      `}</style>
      {/* Placeholder "Vault" anchor — stands in for a future nav icon that
          doesn't exist yet. Deliberately minimal: a quiet dot, not a
          designed element. Always present so a flight always has somewhere
          to land. */}
      <div
        ref={anchorRef}
        aria-hidden
        style={{
          position: 'fixed',
          top: '14px',
          right: '14px',
          width: `${ANCHOR_SIZE}px`,
          height: `${ANCHOR_SIZE}px`,
          borderRadius: '50%',
          background: 'var(--shelf-gold-hi, #f5c462)',
          opacity: ANCHOR_IDLE_OPACITY,
          boxShadow: '0 0 10px rgba(245,196,98,.5)',
          pointerEvents: 'none',
          zIndex: 2147483000,
        }}
      />
    </>
  )
}
