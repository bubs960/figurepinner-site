// SectionH2.tsx — v4 Phase 5 shared section heading (build plan §5, design
// spec: Bebas 26px, letter-spacing .02em, two-tone with a gold tail).
// One primitive instead of per-component inline copies — the 8/8 audit's
// drifted-heading lesson applied preemptively. Server component.
//
// Styling only by design: this deliberately CHANGES how section headings
// look (the old 10px kicker style), but must never change h2 count or order
// — Phase 5's structural re-verify checks exactly that.

import type { CSSProperties } from 'react'

interface SectionH2Props {
  /** Cream lead text (rendered uppercase by the display face styling). */
  lead: string
  /** Optional gold tail — the design's two-tone accent. */
  accent?: string
  style?: CSSProperties
}

export default function SectionH2({ lead, accent, style }: SectionH2Props) {
  return (
    <h2 style={{
      fontFamily: 'var(--fp-font-display)',
      fontWeight: 400,
      fontSize: '26px',
      letterSpacing: '0.02em',
      lineHeight: 1,
      textTransform: 'uppercase',
      color: 'var(--shelf-cream, #f2e8d5)',
      margin: 0,
      ...style,
    }}>
      {lead}
      {accent && <> <span style={{ color: 'var(--shelf-gold-hi, #f5c462)' }}>{accent}</span></>}
    </h2>
  )
}
