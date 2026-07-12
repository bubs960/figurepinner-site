'use client'

// LiquidSparkline.tsx — Liquid Gold Sparkline, P2.2 spec (webaudit 2026-07-08,
// FABLE-WEBAUDIT-P2-DESIGN-2026-07-08.md). Path is computed server-side by
// sparklinePath.ts and baked into static HTML at ISR time.
//
// Session 1 (surface, commit 8f60a31): static gold/gradient stroke, mounted
// in MarketPanel.tsx's placard.
// Session 2 (d036bc2 — the liquid treatment): pour-in draw, shimmer sheen,
// SVG-filter wobble, momentum-pulsing droplet, prefers-reduced-motion branch,
// sparkline_drawn funnel event.
// Fix-first round (webaudit verdict, WEBAUDIT-TO-WEB-SPARKLINE-VERDICT-
// 2026-07-11.md) — FIX-2..5 + S1/S2, this pass:
//   FIX-2: killed getTotalLength()/--len entirely. pathLength={1} normalizes
//     the path so a LITERAL dasharray/dashoffset of 1 always means "fully
//     hidden" regardless of real geometric length — no JS measurement, no
//     race with mount timing. The UNARMED default (no special class) has NO
//     dasharray override at all, so pre-hydration/no-JS visitors see the
//     real, honest, SOLID line — never a blank box. Arming (the class that
//     switches to the hidden 1/1 state) happens in useLayoutEffect, which
//     commits synchronously before the browser's next paint, so hydration
//     hides-then-the-IO-reveal-redraws within one frame for in-view mounts,
//     and invisibly for below-fold ones. A slow connection may show the
//     solid SSR line for a beat before it arms — that's honest content
//     during a real network wait, not a defect, and not worth fighting.
//   FIX-3: the droplet now fades in only once actually drawn — it used to
//     float alone, fully opaque, inside the hidden pre-reveal window.
//   FIX-4: the fallback timer only fires the reveal if IntersectionObserver
//     has NEVER responded at all (not even a non-intersecting callback) by
//     2s — MarketPanel renders below HeroBand/BidCheck/LoreBand/
//     FigureEnrichment/SellerCard, off-screen at load for essentially every
//     visitor, so an unconditional 2s timer was playing the signature
//     moment off-screen for everyone who scrolls slower than that. Once IO
//     has responded even once, it's proven to work and the timer is
//     redundant. sparkline_drawn now only fires on the IO-driven reveal, so
//     the event means "revealed in view" — combined with FIX-1 (server
//     allowlist) it's both delivered and true.
//   FIX-5: never unobserve. The shimmer/droplet loop animations now pause
//     via animation-play-state while scrolled off-screen (battery/jank tax
//     otherwise ran forever on the vault's most-trafficked page, exactly
//     the low-end phones the R1 audience uses) and resume on return.
//   S1: role="img" + aria-label from real data only (pointCount), never a
//     trend adjective the data can't back.
//   S2: forced-colors fallback — a gradient paint server can survive
//     forced-colors mode while its background context gets repainted flat.
//
// Perf guardrail (spec item 9): this treatment mounts on exactly ONE element
// per page (MarketPanel renders once), so the fixed SVG filter/gradient ids
// below are safe — never reused for search minis or ticker chips.
//
// Momentum source: reuses valuePricing.trend_90d_pct (FigureDetailContent.tsx),
// the SAME number the page's own JSON-LD and SeoSummary already claim as this
// figure's trend, rather than importing vaultData.ts's differently-windowed,
// module-private computeTrend30d() and risking two disagreeing "trend"
// numbers on one page (webaudit-endorsed 2026-07-11).

import { useLayoutEffect, useRef, useState } from 'react'
import { buildSparklinePath, SPARKLINE_VIEW_BOX, SPARKLINE_END_X, type SparklinePoint } from '../_lib/sparklinePath'
import { trackFunnel } from '@/app/_lib/funnelClient'

interface LiquidSparklineProps {
  soldHistory: SparklinePoint[]
  trendPct?: number | null
}

const GRADIENT_ID = 'fp-ls-gradient'
const WOBBLE_FILTER_ID = 'fp-ls-wobble'

export default function LiquidSparkline({ soldHistory, trendPct = null }: LiquidSparklineProps) {
  const built = buildSparklinePath(soldHistory)
  const containerRef = useRef<HTMLDivElement>(null)
  const [armed, setArmed] = useState(false)
  const [drawn, setDrawn] = useState(false)
  const [inView, setInView] = useState(false)

  useLayoutEffect(() => {
    if (!built?.fullTreatment) return
    const container = containerRef.current
    if (!container) return

    // Synchronous, pre-paint: arms the hidden (dasharray/dashoffset=1) state
    // before the browser paints this frame, so there's no flash of a solid
    // line snapping to hidden after the fact.
    setArmed(true)

    let fired = false
    let ioResponded = false
    const reveal = (viaIO: boolean) => {
      if (fired) return
      fired = true
      setDrawn(true)
      if (viaIO) trackFunnel('sparkline_drawn', { point_count: built.pointCount })
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ioResponded = true
          setInView(entry.isIntersecting)
          if (entry.isIntersecting) reveal(true)
          // Deliberately never unobserve (FIX-5) -- continued tracking is
          // what drives the off-screen animation-pause below.
        }
      },
      { threshold: 0.4 },
    )
    io.observe(container)

    // Safety net for the TRUE "IO never responds at all" case only (a
    // blocking extension, an unusual embed context). Once IO has responded
    // even once -- including a non-intersecting callback -- it's proven to
    // work and this timer becomes a no-op by design.
    const fallback = window.setTimeout(() => {
      if (!ioResponded) reveal(false)
    }, 2000)

    return () => {
      io.disconnect()
      window.clearTimeout(fallback)
    }
    // built.d changes only when soldHistory content changes; re-running per
    // render would re-fire the funnel event on every unrelated parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [built?.d])

  if (!built) return null

  // Real 30-90d momentum, never fabricated: a null trend (too few comps in
  // one of the windows) gets the calmest pulse, not a guessed number.
  const pulseSpeed = trendPct == null ? 3 : Math.max(0.8, 3 - Math.abs(trendPct) / 10)

  // encodeURIComponent() on the WHOLE embedded SVG string, never hand-escaped
  // — a hand-built %XX sequence is exactly the class of bug that silently
  // corrupts a data: URI one day and nobody notices until Safari renders a
  // blank sheen (see page.tsx style-block backtick trap for the sibling
  // lesson: don't hand-roll what a real encoder already does correctly).
  const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${SPARKLINE_VIEW_BOX}"><path d="${built.d}" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  const maskDataUri = `data:image/svg+xml,${encodeURIComponent(maskSvg)}`

  const stateClass = [
    'fp-liquid-sparkline',
    armed && 'fp-liquid-sparkline--armed',
    drawn && 'fp-liquid-sparkline--drawn',
    inView && 'fp-liquid-sparkline--inview',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={containerRef}
      data-treatment={built.fullTreatment ? 'full' : 'fallback'}
      data-point-count={built.pointCount}
      className={stateClass}
      role="img"
      aria-label={`Sold-price history: ${built.pointCount} real sale${built.pointCount === 1 ? '' : 's'} plotted.`}
      style={
        {
          width: '100%',
          height: '64px',
          marginBottom: '0.75rem',
          position: 'relative',
          '--pulse-speed': `${pulseSpeed}s`,
        } as React.CSSProperties
      }
    >
      <style>{`
        .fp-liquid-sparkline .fp-ls-stroke {
          stroke: url(#${GRADIENT_ID});
        }
        @media (prefers-reduced-motion: no-preference) {
          .fp-liquid-sparkline--armed[data-treatment="full"] .fp-ls-stroke {
            stroke: var(--shelf-gold, #e0a83e);
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
          }
          .fp-liquid-sparkline--armed.fp-liquid-sparkline--drawn[data-treatment="full"] .fp-ls-stroke {
            stroke-dashoffset: 0;
            transition: stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1);
          }
        }
        @media (forced-colors: active) {
          /* !important is the standard, spec-sanctioned pattern for forced-
             colors overrides (browsers' own forced-colors UA stylesheets use
             it internally) -- without it these lose the specificity fight
             against the --armed/--drawn rules below, which apply to nearly
             every full-treatment visitor within a frame of mount (webaudit
             verify, 2026-07-11: confirmed live via getComputedStyle that a
             non-!important override here is silently beaten). */
          .fp-liquid-sparkline .fp-ls-stroke { stroke: CanvasText !important; }
          .fp-liquid-sparkline .fp-ls-sheen { display: none !important; }
        }
        .fp-liquid-sparkline .fp-ls-sheen {
          position: absolute;
          inset: 0;
          -webkit-mask-image: var(--fp-ls-mask);
          mask-image: var(--fp-ls-mask);
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-size: 100% 100%;
          mask-size: 100% 100%;
          background: linear-gradient(110deg,
            transparent 20%,
            var(--shelf-gold-hi, #f5c462) 40%,
            #fff8 50%,
            var(--shelf-gold-hi, #f5c462) 60%,
            transparent 80%);
          background-size: 250% 100%;
          display: none;
        }
        @media (prefers-reduced-motion: no-preference) {
          .fp-liquid-sparkline--armed.fp-liquid-sparkline--drawn[data-treatment="full"] .fp-ls-sheen {
            display: block;
            /* Longhand, not the animation shorthand -- the shorthand
               implicitly resets EVERY sub-property it doesn't name,
               including animation-play-state, back to "running" at this
               rule's specificity, silently overriding the pause rule below
               regardless of which one wins the cascade (webaudit verify,
               2026-07-11: confirmed dead via getComputedStyle in a live
               browser). Naming only these four longhands leaves
               animation-play-state entirely unset here, so the pause rule
               is the sole author of that property and always applies. */
            animation-name: fpLsShimmer;
            animation-duration: 3.5s;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }
          .fp-liquid-sparkline:not(.fp-liquid-sparkline--inview) .fp-ls-sheen {
            animation-play-state: paused;
          }
        }
        @keyframes fpLsShimmer {
          from { background-position: 200% 0; }
          to { background-position: -50% 0; }
        }
        .fp-liquid-sparkline .fp-ls-droplet {
          transform-origin: center;
          transform-box: fill-box;
        }
        @media (prefers-reduced-motion: no-preference) {
          .fp-liquid-sparkline--armed[data-treatment="full"] .fp-ls-droplet {
            opacity: 0;
          }
          .fp-liquid-sparkline--armed.fp-liquid-sparkline--drawn[data-treatment="full"] .fp-ls-droplet {
            opacity: 1;
            transition: opacity 300ms ease;
            /* Longhand -- same reason as the sheen rule above: the
               animation shorthand would silently reset animation-play-
               state to "running" here, defeating the pause rule below. */
            animation-name: fpLsDropletPulse;
            animation-duration: var(--pulse-speed, 3s);
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
          }
          .fp-liquid-sparkline:not(.fp-liquid-sparkline--inview) .fp-ls-droplet {
            animation-play-state: paused;
          }
        }
        @keyframes fpLsDropletPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(224,168,62,0)); }
          50% { transform: scale(1.35); filter: drop-shadow(0 0 4px rgba(224,168,62,.65)); }
        }
      `}</style>

      <svg
        viewBox={SPARKLINE_VIEW_BOX}
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        aria-hidden="true"
      >
        <defs>
          {/* Static gradient stroke — the fallback tier AND the reduced-motion
              branch of the full tier both use this (never a plain flat gold
              line for either, per spec wording for both cases). */}
          <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--shelf-gold-mut, rgba(224,168,62,.72))" />
            <stop offset="50%" stopColor="var(--shelf-gold-hi, #f5c462)" />
            <stop offset="100%" stopColor="var(--shelf-gold-mut, rgba(224,168,62,.72))" />
          </linearGradient>
          {built.fullTreatment && (
            <filter id={WOBBLE_FILTER_ID}>
              <feTurbulence type="fractalNoise" baseFrequency="0.9 0.06" numOctaves={1} seed={3} result="fp-ls-noise" />
              <feDisplacementMap in="SourceGraphic" in2="fp-ls-noise" scale={1.5} />
            </filter>
          )}
        </defs>
        <path
          className="fp-ls-stroke"
          d={built.d}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={built.fullTreatment ? 1 : undefined}
          filter={built.fullTreatment ? `url(#${WOBBLE_FILTER_ID})` : undefined}
        />
        {built.fullTreatment && (
          <circle className="fp-ls-droplet" cx={SPARKLINE_END_X} cy={built.endY} r={4} fill="var(--shelf-gold-hi, #f5c462)" />
        )}
      </svg>

      {built.fullTreatment && (
        <div
          className="fp-ls-sheen"
          style={{ '--fp-ls-mask': `url("${maskDataUri}")` } as React.CSSProperties}
        />
      )}
    </div>
  )
}
