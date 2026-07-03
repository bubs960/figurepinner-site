/**
 * ui.tsx — the three shared style primitives (S52 design-system extraction).
 *
 * Scope is deliberately tiny. An S52 audit of all 97 tsx files found the same
 * three patterns hand-copied with measurable drift:
 *   - uppercase eyebrow/section label: 32 sites, six different font sizes
 *   - card/tile surface:               22 sites, five different border radii
 *   - primary CTA:                     12 sites, only 3 using .btn-primary
 * These components ARE the canonical values. Rules of use:
 *   - New code uses these instead of hand-rolling the pattern.
 *   - Existing pages migrate only when touched for another reason — never a
 *     mass find-replace (22K ISR pages ride on 5 templates; churn is risk).
 *   - Canonical tokens: --s1 --border --text --muted --blue --font-display.
 *     Do not write new --fp-* aliases (legacy passthroughs, kept working).
 *
 * Pure presentational server-safe components — no state, no handlers. If you
 * need a tracked CTA, wrap TrackedLink around CtaButton's styles instead.
 */

import type { CSSProperties, ReactNode } from 'react'

/** Uppercase eyebrow label above a section or tile group. */
export function SectionLabel({
  children,
  color = 'var(--muted)',
  style,
}: {
  children: ReactNode
  /** Semantic override (e.g. an accent color on themed tiles). */
  color?: string
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Standard card/tile surface. Token-correct: radius comes from --r (10px). */
export function Card({
  children,
  as: As = 'div',
  href,
  style,
}: {
  children: ReactNode
  /** 'a' renders a link card (pass href). */
  as?: 'div' | 'a' | 'section' | 'article'
  href?: string
  style?: CSSProperties
}) {
  return (
    <As
      href={As === 'a' ? href : undefined}
      style={{
        background: 'var(--s1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r)',
        padding: '1.1rem',
        ...(As === 'a' ? { display: 'block', color: 'var(--text)', textDecoration: 'none' } : {}),
        ...style,
      }}
    >
      {children}
    </As>
  )
}

/** Primary call-to-action link. Secondary variant for the paired quiet action. */
export function CtaButton({
  href,
  children,
  variant = 'primary',
  style,
}: {
  href: string
  children: ReactNode
  variant?: 'primary' | 'secondary'
  style?: CSSProperties
}) {
  const base: CSSProperties = {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: 600,
    textDecoration: 'none',
  }
  const skin: CSSProperties =
    variant === 'primary'
      ? { background: 'var(--blue)', color: '#fff' }
      : { background: 'var(--s1)', border: '1px solid var(--border)', color: 'var(--text)' }
  return (
    <a href={href} style={{ ...base, ...skin, ...style }}>
      {children}
    </a>
  )
}
