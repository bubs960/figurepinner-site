'use client'

// LiquidSparkline.tsx — Session 1 (surface) of the Liquid Gold Sparkline,
// P2.2 spec (webaudit 2026-07-08, FABLE-WEBAUDIT-P2-DESIGN-2026-07-08.md).
// Path is computed server-side by sparklinePath.ts and baked into static
// HTML at ISR time — this component just renders it. Session 2 (liquid
// treatment: pour-in, shimmer, wobble, momentum droplet, reduced-motion
// branch, sparkline_drawn funnel event) lands as a follow-up build; today's
// version is a static gold stroke, `data-treatment` tagged for that hook.

import { buildSparklinePath, SPARKLINE_VIEW_BOX, type SparklinePoint } from '../_lib/sparklinePath'

interface LiquidSparklineProps {
  soldHistory: SparklinePoint[]
}

export default function LiquidSparkline({ soldHistory }: LiquidSparklineProps) {
  const built = buildSparklinePath(soldHistory)
  // 0 valid points -> nothing honest to draw; caller already gates on
  // pricing.recent_comps.length > 0, but a corrupt-date-only history could
  // still slip through that gate, so this stays defensive.
  if (!built) return null

  return (
    <div
      data-treatment={built.fullTreatment ? 'full' : 'fallback'}
      data-point-count={built.pointCount}
      style={{
        width: '100%',
        height: '64px',
        marginBottom: '0.75rem',
      }}
    >
      <svg
        viewBox={SPARKLINE_VIEW_BOX}
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        aria-hidden="true"
      >
        <path
          d={built.d}
          fill="none"
          stroke="var(--shelf-gold, #e0a83e)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
