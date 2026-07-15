'use client'

// ConditionShineBox.tsx — HeroBand condition-population disambiguation fix
// (webaudit work order 2026-07-15, WEBAUDIT-TO-WEB-HEROBAND-RANGE-BAR-FIX-
// 2026-07-15.md). Steve's live-flagged finding: the loose secondary row and
// the sealed-only range bar sat stacked with identical visual weight and no
// label distinguishing them -- a reader (correctly) read $20 as if it were
// part of the $65-$625 range bar directly below it, when they're two
// unrelated populations (range bar = sealed bucket p10/p90 only, verified
// mathematically correct by web 2026-07-15 -- this is a LABELING fix, not a
// data fix).
//
// Steve's requirements (two rounds of live feedback, both binding):
//   1. Color-coded, not just text-labeled: gold = sealed, RED = loose. A
//      caption alone wasn't enough -- two boxes in identical gray need a
//      color cue before anyone reads text.
//   2. BOTH boxes must be the same graphic resolution/polish. A shine on one
//      and a flat box on the other reads as "sealed is real data, loose is
//      an afterthought" -- defeats the whole point of the fix.
//
// Shine pattern reused from LiquidSparkline.tsx (same directory) rather than
// hand-rolled: linear-gradient sweep via animated background-position,
// gated behind prefers-reduced-motion: no-preference, paused off-screen via
// an --inview class (IntersectionObserver, same threshold/never-unobserve
// pattern), forced-colors fallback. Reusing this exact mechanism instead of
// a parallel implementation specifically to avoid re-introducing the
// animation-shorthand/animation-play-state bug webaudit found and fixed
// there 2026-07-11 (shorthand silently resets animation-play-state,
// defeating the pause rule -- this component uses the same longhand-only
// pattern LiquidSparkline's fix established).
//
// This is a CSS background-sweep on a solid container, not an SVG stroke
// sweep (LiquidSparkline draws a path) -- the range bar and the loose row
// are boxes, not lines, so the treatment is ported to that shape rather
// than copy-pasted verbatim.

import { useLayoutEffect, useRef, useState } from 'react'

export type ShineTone = 'gold' | 'red'

interface ConditionShineBoxProps {
  tone: ShineTone
  children: React.ReactNode
  /** Unique-per-mount id suffix for the keyframe/class names, so two boxes
   *  on the same page (sealed + loose) don't collide if either is ever
   *  rendered more than once per page (not currently the case, but cheap
   *  insurance -- LiquidSparkline could skip this because it's spec'd to
   *  mount exactly once per page; this component has no such guarantee). */
  instanceKey: string
}

const TONE_VARS: Record<ShineTone, { base: string; hi: string; glow: string }> = {
  gold: {
    base: 'var(--shelf-gold, #e0a83e)',
    hi: 'var(--shelf-gold-hi, #f5c462)',
    glow: 'rgba(245,196,98,0.28)',
  },
  red: {
    // --fp-danger is the correct semantic-neutral red per webaudit's token
    // audit (NOT --fp-ebay, which is reserved for eBay-branded elements and
    // would make the loose price read as an affiliate link). --fp-danger-hi
    // is new -- computed to match --shelf-gold → --shelf-gold-hi's own
    // lightness/saturation lift ratio (not a hue-rotation guess), defined
    // alongside --fp-danger in globals.css.
    base: 'var(--fp-danger, #E5484D)',
    hi: 'var(--fp-danger-hi, #F97075)',
    glow: 'rgba(249,112,117,0.28)',
  },
}

export default function ConditionShineBox({ tone, children, instanceKey }: ConditionShineBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const t = TONE_VARS[tone]
  const cls = `fp-cshine-${instanceKey}`

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setInView(entry.isIntersecting)
        // Deliberately never unobserve -- same rationale as LiquidSparkline
        // FIX-5: continued tracking is what drives the off-screen pause.
      },
      { threshold: 0.4 },
    )
    io.observe(container)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className={`${cls}${inView ? ` ${cls}--inview` : ''}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '10px',
        padding: '14px 16px',
        background: 'var(--fp-surface-1, #181B23)',
        border: '1px solid var(--fp-border-bright, rgba(255,255,255,0.12))',
        boxShadow: `inset 0 0 24px ${t.glow}`,
      }}
    >
      <style>{`
        .${cls}::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(110deg,
            transparent 20%,
            ${t.hi} 40%,
            #fff8 50%,
            ${t.hi} 60%,
            transparent 80%);
          background-size: 250% 100%;
          opacity: 0.16;
          display: none;
        }
        @media (prefers-reduced-motion: no-preference) {
          .${cls}::before {
            display: block;
            /* Longhand only -- the animation shorthand would silently reset
               animation-play-state to "running", defeating the pause rule
               below (the exact bug webaudit found in LiquidSparkline
               2026-07-11 and fixed the same way). */
            animation-name: fpCShineSweep${instanceKey};
            animation-duration: 3.5s;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
            animation-play-state: paused;
          }
          .${cls}--inview::before {
            animation-play-state: running;
          }
        }
        @keyframes fpCShineSweep${instanceKey} {
          from { background-position: 200% 0; }
          to { background-position: -50% 0; }
        }
        @media (forced-colors: active) {
          .${cls}::before { display: none !important; }
          .${cls} { border-color: CanvasText !important; }
        }
      `}</style>
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}
