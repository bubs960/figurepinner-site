'use client'

// ClaimRitual.tsx — the Claiming Ritual (P3 §3 Phase A).
//
// Session 1 (2026-07-12) shipped the de-risk gate: bare photo-flight only,
// real-device Safari/Firefox comparison, Steve-cleared. Session 2 adds the
// polish the gate unblocked — brass nameplate ("ACQUIRED <date>"), a few
// gold-dust particles, an optional (default-OFF) brass "clink" synth, and
// prefers-reduced-motion still gets a confirmation (just no flight/particles/
// wipe-reveal — a quick fade to the end-state). The Shelf (Phase B) and
// share-card module (Phase C) are separate work, not this file's concern.
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

const NAMEPLATE_HOLD_MS = 1900
const NAMEPLATE_HOLD_MS_REDUCED = 900
const GOLD_DUST_COUNT = 7
// Spec: "Optional brass clink (Web Audio synth), default OFF." Left as a
// literal so a future settings toggle can flip it without touching the synth
// itself — no dead-code-behind-a-flag ambiguity, just off by default.
const ENABLE_CLINK_SOUND = false

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

/** Brass "clink" — a short percussive pitch-drop, synthesized so there's no
 *  audio asset to ship. Default OFF (see ENABLE_CLINK_SOUND); guarded so a
 *  browser without Web Audio, or any runtime hiccup, just stays silent
 *  rather than breaking the ritual it's decorating. */
function playClink() {
  if (!ENABLE_CLINK_SOUND) return
  try {
    const AudioCtxCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtxCtor) return
    const ctx = new AudioCtxCtor()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.09)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.18)
    osc.onended = () => ctx.close()
  } catch {
    // Decorative and default-off — never let a synth failure surface.
  }
}

let brushedMetalFilterInjected = false
/** Injects the feTurbulence brushed-metal filter def once (idempotent —
 *  cheap to call from every nameplate reveal). Zero-size <svg>, filter only
 *  referenced by url(#...), never rendered as visible content itself. */
function ensureBrushedMetalFilter() {
  if (brushedMetalFilterInjected || document.getElementById('fp-brushed-metal-defs')) {
    brushedMetalFilterInjected = true
    return
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('id', 'fp-brushed-metal-defs')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.style.position = 'absolute'
  svg.innerHTML = `
    <filter id="fp-brushed-metal">
      <feTurbulence type="fractalNoise" baseFrequency="0.9 0.02" numOctaves="2" seed="7" result="noise" />
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 0.9  0 0 0 0 0.6  0 0 0 0.5 0" />
    </filter>
  `
  document.body.appendChild(svg)
  brushedMetalFilterInjected = true
}

/** A handful of SVG-rendered gold-dust motes burst from the nameplate corner
 *  and fade — no confetti library, just CSS keyframes (defined once in this
 *  component's <style> block) driven by randomized per-particle custom
 *  properties. Self-removing after its animation ends. */
function spawnGoldDust(container: HTMLElement) {
  for (let i = 0; i < GOLD_DUST_COUNT; i++) {
    const angle = (Math.random() * 150 - 75) * (Math.PI / 180)
    const dist = 20 + Math.random() * 28
    const dx = Math.sin(angle) * dist
    const dy = -Math.cos(angle) * dist - 4
    const size = 2 + Math.random() * 2.5
    const delay = i * 22

    const mote = document.createElement('span')
    mote.style.position = 'absolute'
    mote.style.top = '6px'
    mote.style.right = `${8 + Math.random() * 20}px`
    mote.style.width = `${size}px`
    mote.style.height = `${size}px`
    mote.style.borderRadius = '50%'
    mote.style.background = 'radial-gradient(circle, #fff2cf, #e0a83e 70%)'
    mote.style.boxShadow = '0 0 4px rgba(245,196,98,.8)'
    mote.style.setProperty('--fp-dust-dx', `${dx}px`)
    mote.style.setProperty('--fp-dust-dy', `${dy}px`)
    mote.style.animation = `fp-gold-dust 760ms cubic-bezier(.22,.61,.36,1) ${delay}ms both`
    container.appendChild(mote)
    window.setTimeout(() => mote.remove(), 900 + delay)
  }
}

/** The engraving reveal: a brass nameplate wipes in near the Vault anchor,
 *  reads "ACQUIRED <today>", and fades out on its own after a hold. Built
 *  the same way the flight clones are — imperative DOM, cleans up after
 *  itself — rather than React state, so it never fights the flight
 *  animations running in parallel. Reduced-motion still shows the plate (the
 *  confirmation matters) but skips the wipe, particles, and clink. */
function showNameplate(reduced: boolean) {
  ensureBrushedMetalFilter()

  const wrap = document.createElement('div')
  wrap.setAttribute('aria-hidden', 'true')
  wrap.style.position = 'fixed'
  wrap.style.top = '44px'
  wrap.style.right = '14px'
  wrap.style.zIndex = '2147483000'
  wrap.style.pointerEvents = 'none'

  const plate = document.createElement('div')
  plate.style.position = 'relative'
  plate.style.overflow = 'hidden'
  plate.style.borderRadius = '5px'
  plate.style.padding = '7px 12px'
  plate.style.background = 'linear-gradient(155deg, #fff2d4, #e8b34e 45%, #b9822b)'
  plate.style.boxShadow = '0 6px 18px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,244,216,.35)'
  if (reduced) {
    plate.style.opacity = '0'
    plate.style.transition = 'opacity 200ms ease'
  } else {
    plate.style.clipPath = 'inset(0 100% 0 0)'
    plate.style.transition = 'clip-path 620ms cubic-bezier(.65,0,.35,1) 60ms'
  }

  const texture = document.createElement('div')
  texture.style.position = 'absolute'
  texture.style.inset = '0'
  texture.style.filter = 'url(#fp-brushed-metal)'
  texture.style.mixBlendMode = 'overlay'
  texture.style.opacity = '0.45'
  plate.appendChild(texture)

  const label = document.createElement('div')
  label.textContent = 'ACQUIRED'
  label.style.position = 'relative'
  label.style.fontFamily = 'var(--fp-font-display, serif)'
  label.style.fontSize = '10px'
  label.style.fontWeight = '600'
  label.style.letterSpacing = '.16em'
  label.style.color = '#3a2405'
  label.style.textShadow = '0 1px 0 rgba(255,255,255,.4)'
  label.style.whiteSpace = 'nowrap'
  plate.appendChild(label)

  const dateEl = document.createElement('div')
  // Local date, not UTC (webaudit FIX-3, 2026-07-12 verdict) — .toISOString()
  // engraves TOMORROW's date on any claim after ~8pm ET. en-CA formats as
  // YYYY-MM-DD in the browser's own local timezone.
  dateEl.textContent = new Date().toLocaleDateString('en-CA')
  dateEl.style.position = 'relative'
  dateEl.style.fontFamily = 'var(--fp-font-display, serif)'
  dateEl.style.fontSize = '9px'
  dateEl.style.color = '#4a3008'
  dateEl.style.marginTop = '1px'
  dateEl.style.whiteSpace = 'nowrap'
  plate.appendChild(dateEl)

  wrap.appendChild(plate)
  document.body.appendChild(wrap)

  if (reduced) {
    requestAnimationFrame(() => { plate.style.opacity = '1' })
  } else {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      plate.style.clipPath = 'inset(0 0 0 0)'
    }))
    spawnGoldDust(wrap)
    playClink()
  }

  const holdMs = reduced ? NAMEPLATE_HOLD_MS_REDUCED : NAMEPLATE_HOLD_MS
  window.setTimeout(() => {
    wrap.style.transition = 'opacity 320ms ease'
    wrap.style.opacity = '0'
    window.setTimeout(() => wrap.remove(), 340)
  }, holdMs)
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
        showNameplate(true)
        window.setTimeout(() => {
          anchor.style.opacity = String(ANCHOR_IDLE_OPACITY)
          settle(mode)
        }, 200)
        return
      }

      const onFlightDone = () => {
        pulseAnchor()
        showNameplate(false)
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
        @keyframes fp-gold-dust {
          0% { opacity: 0; transform: translate(0, 0) scale(0.6); }
          18% { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--fp-dust-dx), var(--fp-dust-dy)) scale(0.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes fp-gold-dust { 0%, 100% { opacity: 0; } }
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
