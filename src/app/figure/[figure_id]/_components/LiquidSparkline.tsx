'use client'

// LiquidSparkline.tsx — Liquid Gold Sparkline, P2.2 spec (webaudit 2026-07-08,
// FABLE-WEBAUDIT-P2-DESIGN-2026-07-08.md). Path is computed server-side by
// sparklinePath.ts and baked into static HTML at ISR time.
//
// Session 1 (surface, commit 8f60a31): static gold/gradient stroke, mounted
// in MarketPanel.tsx's placard.
// Session 2 (this pass — the liquid treatment): pour-in draw, shimmer sheen,
// SVG-filter wobble, momentum-pulsing droplet, prefers-reduced-motion branch,
// sparkline_drawn funnel event. Full liquid treatment gates on
// data-treatment="full" (>=4 real sold points) AND motion allowed — the
// fallback tier (<4 points) and the reduced-motion branch both render the
// SAME static gradient stroke, zero animation, per the spec's own wording for
// both cases ("static gradient stroke" / "static gradient-filled line").
//
// Perf guardrail (spec item 9): this treatment mounts on exactly ONE element
// per page (MarketPanel renders once), so the fixed SVG filter/gradient ids
// below are safe — never reused for search minis or ticker chips.
//
// Momentum source: reuses valuePricing.trend_90d_pct (FigureDetailContent.tsx),
// the SAME number the page's own JSON-LD and SeoSummary already claim as this
// figure's trend, rather than importing vaultData.ts's differently-windowed,
// module-private computeTrend30d() and risking two disagreeing "trend"
// numbers on one page.

import { useEffect, useRef, useState } from 'react'
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
  const pathRef = useRef<SVGPathElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    if (!built?.fullTreatment) return
    const path = pathRef.current
    const container = containerRef.current
    if (!path || !container) return

    container.style.setProperty('--len', String(path.getTotalLength()))

    let fired = false
    const reveal = () => {
      if (fired) return
      fired = true
      setDrawn(true)
      trackFunnel('sparkline_drawn', { point_count: built.pointCount })
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          reveal()
          io.unobserve(entry.target)
        }
      },
      { threshold: 0.4 },
    )
    io.observe(container)

    // Safety net: IntersectionObserver has near-universal support, but a real
    // sold-comp line must never stay permanently hidden if it somehow fails to
    // fire (a blocking extension, an unusual embed context) -- "never fake a
    // line" cuts both ways, it must also never silently hide a real one.
    const fallback = window.setTimeout(reveal, 2000)

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

  return (
    <div
      ref={containerRef}
      data-treatment={built.fullTreatment ? 'full' : 'fallback'}
      data-point-count={built.pointCount}
      className={`fp-liquid-sparkline${drawn ? ' fp-liquid-sparkline--drawn' : ''}`}
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
          .fp-liquid-sparkline[data-treatment="full"] .fp-ls-stroke {
            stroke: var(--shelf-gold, #e0a83e);
          }
          /* Hidden (dash-offset = full length) is the default full-treatment
             state -- unconditional, not dependent on a transition firing off
             a custom property becoming defined (that path is unreliable: a
             transition only animates a change between two already-rendered
             frames, and --len can go from unset to set within the same
             pre-paint window on mount, which some browsers don't animate).
             Only the class toggle below drives the actual reveal. */
          .fp-liquid-sparkline[data-treatment="full"]:not(.fp-liquid-sparkline--drawn) .fp-ls-stroke {
            stroke-dasharray: var(--len, 0);
            stroke-dashoffset: var(--len, 0);
          }
          .fp-liquid-sparkline--drawn[data-treatment="full"] .fp-ls-stroke {
            stroke-dasharray: var(--len, 0);
            stroke-dashoffset: 0;
            transition: stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1);
          }
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
          .fp-liquid-sparkline--drawn[data-treatment="full"] .fp-ls-sheen {
            display: block;
            animation: fpLsShimmer 3.5s linear infinite;
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
          .fp-liquid-sparkline--drawn[data-treatment="full"] .fp-ls-droplet {
            animation: fpLsDropletPulse var(--pulse-speed, 3s) ease-in-out infinite;
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
          ref={pathRef}
          className="fp-ls-stroke"
          d={built.d}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
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
