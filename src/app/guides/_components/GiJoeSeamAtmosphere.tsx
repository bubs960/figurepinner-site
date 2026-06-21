/**
 * GiJoeSeamAtmosphere — the G.I. Joe analog of MOTU's seam hero (S40, first
 * templatized centerpiece). A "Cobra threat board" split down a glowing vertical
 * seam: the Joe command side LEFT (olive-drab → brass), the Cobra threat side
 * RIGHT (gunmetal-black → Cobra-red), a faint console grid across both, and the
 * DUAL SIGILS confronting on the seam — Joe emblem left, serpent sigil right.
 *
 * Where MOTU's two sword-halves UNITE, here the two sigils CONFRONT: the seam is
 * the front line. All of this is DECORATIVE + aria-hidden, layered OVER the SSR'd
 * hero copy (which stays the LCP). Pure CSS gradients + inline-SVG (zero raster).
 *
 * RIGHTS (legal-compliance gate, section 4.1): both glyphs are ORIGINAL homage
 * shapes — a star/shield command emblem and a front-facing flared-hood serpent —
 * NOT Hasbro's registered G.I. Joe wordmark or the trademarked Cobra-head logo.
 * No trademarked wordmarks anywhere in the centerpiece.
 *
 * MOTION (globals.css, all reduced-motion-gated):
 *  - boot-up: the board ignites + a brass/red scanline sweeps once + the sigils
 *    fade/scale in, settling at their "apart" rest positions (--rise 0).
 *  - scroll-lock: SeamScrollDriver writes --rise (0→1) on .fh-hero--seam; the two
 *    <g> groups translateX from apart → locked on the seam, the clash spark blooms.
 *  Under reduced-motion --rise defaults to 1, so the sigils arrive locked + static.
 */

function GiJoeSigils() {
  return (
    <svg className="fh-gjsigils" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="gjBrass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe7a6" />
          <stop offset="0.5" stopColor="#c8a24a" />
          <stop offset="1" stopColor="#7a5e22" />
        </linearGradient>
        <linearGradient id="gjRed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff6a6f" />
          <stop offset="0.5" stopColor="#c0202a" />
          <stop offset="1" stopColor="#6e0f15" />
        </linearGradient>
        <radialGradient id="gjDisc" cx="0.5" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#23271a" />
          <stop offset="1" stopColor="#0d0f0a" />
        </radialGradient>
        <linearGradient id="gjSeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8a24a" stopOpacity="0" />
          <stop offset="0.22" stopColor="#e7b53c" />
          <stop offset="0.5" stopColor="#ffd27a" />
          <stop offset="0.78" stopColor="#c0202a" />
          <stop offset="1" stopColor="#c0202a" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="gjClash" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff1c4" stopOpacity="0.95" />
          <stop offset="0.4" stopColor="#e7b53c" stopOpacity="0.45" />
          <stop offset="1" stopColor="#c0202a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* the front line — vertical split bar + clash spark on the seam */}
      <rect className="fh-gj-split" x="158.5" y="32" width="3" height="136" rx="1.5" fill="url(#gjSeam)" />
      <circle className="fh-gj-spark" cx="160" cy="100" r="34" fill="url(#gjClash)" />

      {/* JOE command emblem (LEFT) — original star-on-disc, brass */}
      <g className="fh-sigil fh-sigil-joe">
        <circle cx="110" cy="100" r="60" fill="url(#gjDisc)" stroke="url(#gjBrass)" strokeWidth="3" />
        <circle cx="110" cy="100" r="50" fill="none" stroke="url(#gjBrass)" strokeWidth="1.1" opacity="0.55" />
        <path
          d="M110 63 L118.8 87.9 L145.2 88.6 L124.3 104.6 L131.7 129.9 L110 115 L88.3 129.9 L95.7 104.6 L74.8 88.6 L101.2 87.9 Z"
          fill="url(#gjBrass)"
        />
        {/* stencil ticks at the cardinal points */}
        <path d="M110 44 V52 M110 148 V156 M54 100 H62 M158 100 H166" stroke="url(#gjBrass)" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      </g>

      {/* COBRA serpent sigil (RIGHT) — ORIGINAL side-profile STRIKING cobra: a coiled
          body rising in an S into a reared, flared hood with the head turned in profile
          toward the seam, forked tongue flicking out. The S-curve + flared hood + tongue
          are the silhouette cues that read "cobra" (the prior front-facing version read as
          a skull). Deliberately NOT Hasbro's trademarked Cobra-head mark — no front-facing
          face, no down-turned-hood-+-fang-+-letterform lockup. Fills the disc for balance
          with the Joe star opposite. */}
      <g className="fh-sigil fh-sigil-cobra">
        <circle cx="210" cy="100" r="60" fill="url(#gjDisc)" stroke="url(#gjRed)" strokeWidth="3" />
        <circle cx="210" cy="100" r="50" fill="none" stroke="url(#gjRed)" strokeWidth="1.1" opacity="0.55" />
        {/* coiled lower body — S-rises from a coil that fills the lower disc up to the hood */}
        <path d="M214 96 C214 116 236 118 232 132 C229 143 206 146 196 137 C189 131 193 121 203 123" fill="none" stroke="url(#gjRed)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        {/* flared hood — two flares spreading from the neck (the defining cobra cue) */}
        <path d="M214 98 C201 96 191 88 192 78 L198 66 C201 60 207 57 214 58 C220 58 225 62 227 68 L231 80 C231 90 224 97 214 98 Z" fill="url(#gjRed)" />
        {/* profile head, snout turned toward the seam (LEFT), confronting the Joe star */}
        <path d="M214 60 C204 56 192 58 184 66 C190 71 200 71 208 68 C212 66 214 63 214 60 Z" fill="url(#gjRed)" />
        {/* one profile eye, a fang notch, and a forked tongue flicking at the seam */}
        <circle cx="201" cy="64" r="1.8" fill="#1a0a0a" />
        <path d="M184 66 L189 70 L191 67 Z" fill="#1a0a0a" />
        <path d="M184 66 L173 69 M173 69 L168 67 M173 69 L168 71" stroke="url(#gjRed)" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  )
}

export default function GiJoeSeamAtmosphere() {
  return (
    <div className="fh-gj-atmos" aria-hidden="true">
      <div className="fh-gj-sky fh-gj-sky-left" />
      <div className="fh-gj-sky fh-gj-sky-right" />
      <div className="fh-gj-board" />
      <div className="fh-gj-scan" />
      <div className="fh-gj-seam" />
      <GiJoeSigils />
    </div>
  )
}
