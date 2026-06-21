/**
 * WweRingAtmosphere — the shared 3/4-perspective wrestling-RING centerpiece for the
 * wrestling hub family (WWE Elite + Jakks, S40). A ring straddling the seam: the LEFT
 * corner one color, the RIGHT corner another, the seam down the CENTER of the ring.
 *   - WWE Elite: FACE blue+gold LEFT / HEEL crimson RIGHT.
 *   - Jakks:     VINTAGE gold LEFT / MODERN steel RIGHT.
 * SAME component both times — all themeable colors are CSS vars (`--ring-*`), set per
 * `[data-fandom]` block in globals.css (base defaults = Elite). Posts + seam + spark stay
 * gold→crimson for both. The ring shape signals "same family"; palette carries the story.
 *
 * Decorative + aria-hidden, OVER the SSR'd hero copy (h1 stays LCP). Pure CSS gradients +
 * inline SVG (zero raster). RIGHTS: generic ring — no promotion/arena/apron marks, no
 * wordmark. MOTION (globals.css, reduced-motion-gated): boot-up "lights up" + scroll-lock
 * corner-glow/seam intensify on --rise. Reduced-motion → fully lit, static.
 */

const v = (name: string) => ({ stopColor: `var(${name})` })

function WweRing() {
  return (
    <svg className="fh-wwering" viewBox="0 0 360 210" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="wweMatFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={v('--ring-face')} />
          <stop offset="1" style={v('--ring-face-dk')} />
        </linearGradient>
        <linearGradient id="wweMatHeel" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" style={v('--ring-heel')} />
          <stop offset="1" style={v('--ring-heel-dk')} />
        </linearGradient>
        <linearGradient id="wweApronFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={v('--ring-apron-face')} />
          <stop offset="1" style={v('--ring-apron-face-dk')} />
        </linearGradient>
        <linearGradient id="wweApronHeel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={v('--ring-apron-heel')} />
          <stop offset="1" style={v('--ring-apron-heel-dk')} />
        </linearGradient>
        <linearGradient id="wweGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe39a" />
          <stop offset="0.5" stopColor="#e8b94e" />
          <stop offset="1" stopColor="#9c7a2a" />
        </linearGradient>
        <linearGradient id="wweSeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe39a" stopOpacity="0" />
          <stop offset="0.18" stopColor="#ffd76a" />
          <stop offset="0.5" stopColor="#fff1c4" />
          <stop offset="0.82" stopColor="#d3464b" />
          <stop offset="1" stopColor="#d3464b" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="wweGlowFace" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopOpacity="0.9" style={v('--ring-glow-face')} />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wweGlowHeel" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopOpacity="0.9" style={v('--ring-glow-heel')} />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wweSpark" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff4d2" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#e8b94e" stopOpacity="0.4" />
          <stop offset="1" stopColor="#d3464b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* corner light blooms (left / right) — intensify on scroll-lock */}
      <ellipse className="fh-ring-glow fh-ring-glow-face" cx="62" cy="112" rx="70" ry="48" fill="url(#wweGlowFace)" />
      <ellipse className="fh-ring-glow fh-ring-glow-heel" cx="298" cy="112" rx="70" ry="48" fill="url(#wweGlowHeel)" />

      {/* APRON (outer skirt) under the two front edges — left / right */}
      <path d="M60 112 L180 152 L180 176 L60 136 Z" fill="url(#wweApronFace)" />
      <path d="M180 152 L300 112 L300 136 L180 176 Z" fill="url(#wweApronHeel)" />
      <path d="M60 136 L180 176 L300 136" fill="none" stroke="#0a0c10" strokeWidth="1.4" opacity="0.5" />

      {/* MAT (canvas) — top diamond, split down the seam */}
      <path d="M180 80 L60 112 L180 152 Z" fill="url(#wweMatFace)" />
      <path d="M180 80 L300 112 L180 152 Z" fill="url(#wweMatHeel)" />
      <path d="M60 112 L180 80 L300 112" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.18" />

      {/* one-shot spotlight sweep across the mat (boot-up) */}
      <path className="fh-ring-spot" d="M180 80 L60 112 L180 152 L300 112 Z" fill="#fff8e6" opacity="0" />

      {/* ROPES — three per back side, converging on the center-rear seam post */}
      <g className="fh-ring-ropes-face" style={{ stroke: 'var(--ring-rope-face)' }} strokeWidth="2" strokeLinecap="round" opacity="0.92">
        <path d="M60 90 L180 60" />
        <path d="M60 98 L180 68" />
        <path d="M60 106 L180 76" />
      </g>
      <g className="fh-ring-ropes-heel" style={{ stroke: 'var(--ring-rope-heel)' }} strokeWidth="2" strokeLinecap="round" opacity="0.92">
        <path d="M300 90 L180 60" />
        <path d="M300 98 L180 68" />
        <path d="M300 106 L180 76" />
      </g>

      {/* POSTS — left + right + center-rear on the seam (posts stay gold both themes) */}
      <rect x="56" y="86" width="7" height="28" rx="1.5" fill="url(#wweGold)" />
      <rect x="53" y="86" width="13" height="11" rx="2.5" style={{ fill: 'var(--ring-pad-face)' }} />
      <rect x="297" y="86" width="7" height="28" rx="1.5" fill="url(#wweGold)" />
      <rect x="294" y="86" width="13" height="11" rx="2.5" style={{ fill: 'var(--ring-pad-heel)' }} />
      <rect x="176" y="54" width="4" height="28" fill="url(#wweGold)" />
      <rect x="180" y="54" width="4" height="28" style={{ fill: 'var(--ring-heel)' }} />
      <rect x="172" y="52" width="8" height="10" rx="2" style={{ fill: 'var(--ring-pad-face)' }} />
      <rect x="180" y="52" width="8" height="10" rx="2" style={{ fill: 'var(--ring-pad-heel)' }} />

      {/* the front line — hot gold→crimson seam down the center of the ring */}
      <rect className="fh-ring-seam" x="178.6" y="50" width="2.8" height="128" rx="1.4" fill="url(#wweSeam)" />
      <circle className="fh-ring-spark" cx="180" cy="116" r="30" fill="url(#wweSpark)" />
    </svg>
  )
}

export default function WweRingAtmosphere() {
  return (
    <div className="fh-wwe-atmos" aria-hidden="true">
      <div className="fh-wwe-sky fh-wwe-sky-left" />
      <div className="fh-wwe-sky fh-wwe-sky-right" />
      <div className="fh-wwe-board" />
      <div className="fh-wwe-scan" />
      <div className="fh-wwe-seam" />
      <WweRing />
    </div>
  )
}
