/**
 * FactionSeamAtmosphere — the Transformers centerpiece (S41, hub #3 of the consolidated
 * web rollout). The seam-clash skeleton (cf. GiJoeSeamAtmosphere) re-cast as the
 * AUTOBOT vs DECEPTICON faction war: the Autobot side LEFT (azure/brass guardian visor),
 * the Decepticon side RIGHT (violet/crimson predatory mask), the two faction GLYPHS
 * confronting across the glowing vertical seam — the front line of the Cybertronian war.
 *
 * Decorative + aria-hidden, layered OVER the SSR'd hero copy (h1 stays LCP). Pure CSS
 * gradients + inline SVG (zero raster). Faction colors are CSS vars (`--fac-*`) set under
 * [data-fandom="transformers"] in globals.css.
 *
 * RIGHTS (legal-compliance gate): both glyphs are ORIGINAL angular MASK silhouettes — a
 * heroic crested visor and a horned predatory mask — deliberately NOT Hasbro's
 * trademarked Autobot face or Decepticon-head insignia (no exact replica of either
 * registered mark). No wordmarks anywhere. Same original-homage pattern as the GI Joe
 * Cobra serpent.
 *
 * MOTION (globals.css, reduced-motion-gated): boot-up ignites the board + a scanline
 * sweep + the glyphs fade/scale in; scroll-lock (SeamScrollDriver writes --rise 0→1)
 * slides the two glyphs from apart → confronting on the seam, the clash spark blooms.
 * Reduced-motion → --rise defaults to 1, glyphs arrive locked + static.
 */

function FactionGlyphs() {
  return (
    <svg className="fh-tfglyphs" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="tfBot" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bfe0ff" />
          <stop offset="0.5" stopColor="#4d90d8" />
          <stop offset="1" stopColor="#1e3f66" />
        </linearGradient>
        <linearGradient id="tfCon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e9b6ff" />
          <stop offset="0.5" stopColor="#a23fd0" />
          <stop offset="1" stopColor="#5a1240" />
        </linearGradient>
        <radialGradient id="tfDisc" cx="0.5" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#1a1f2a" />
          <stop offset="1" stopColor="#0a0d13" />
        </radialGradient>
        <linearGradient id="tfSeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5aa0ff" stopOpacity="0" />
          <stop offset="0.22" stopColor="#5aa0ff" />
          <stop offset="0.5" stopColor="#ffffff" />
          <stop offset="0.78" stopColor="#c04ddd" />
          <stop offset="1" stopColor="#c04ddd" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="tfClash" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.4" stopColor="#9ec8ff" stopOpacity="0.4" />
          <stop offset="1" stopColor="#c04ddd" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* the front line — split bar + clash spark on the seam */}
      <rect className="fh-tf-split" x="158.5" y="32" width="3" height="136" rx="1.5" fill="url(#tfSeam)" />
      <circle className="fh-tf-spark" cx="160" cy="100" r="34" fill="url(#tfClash)" />

      {/* AUTOBOT guardian visor (LEFT) — ORIGINAL crested helmet/visor, azure.
          Rounded-top helm + central fin crest + a horizontal visor slit. NOT the
          trademarked Autobot face. */}
      <g className="fh-faction fh-faction-bot">
        <circle cx="110" cy="100" r="60" fill="url(#tfDisc)" stroke="url(#tfBot)" strokeWidth="3" />
        <circle cx="110" cy="100" r="50" fill="none" stroke="url(#tfBot)" strokeWidth="1.1" opacity="0.5" />
        {/* helm dome with a central crest fin */}
        <path d="M84 118 C84 92 95 74 110 74 C125 74 136 92 136 118 L128 122 L122 112 L110 118 L98 112 L92 122 Z" fill="url(#tfBot)" />
        <path d="M110 64 L116 86 L104 86 Z" fill="url(#tfBot)" />
        {/* horizontal visor slit (the "eyes") */}
        <rect x="95" y="100" width="30" height="6" rx="3" fill="#0a0d13" />
        <rect x="98" y="101.5" width="9" height="3" rx="1.5" fill="#bfe0ff" />
        <rect x="113" y="101.5" width="9" height="3" rx="1.5" fill="#bfe0ff" />
      </g>

      {/* DECEPTICON predatory mask (RIGHT) — ORIGINAL horned/angular face, violet.
          Down-swept horns + sharp brow + slit eyes + a fanged lower jaw. NOT the
          trademarked Decepticon-head mark. */}
      <g className="fh-faction fh-faction-con">
        <circle cx="210" cy="100" r="60" fill="url(#tfDisc)" stroke="url(#tfCon)" strokeWidth="3" />
        <circle cx="210" cy="100" r="50" fill="none" stroke="url(#tfCon)" strokeWidth="1.1" opacity="0.5" />
        {/* swept horns + angular brow */}
        <path d="M186 78 L210 70 L234 78 L226 92 L210 86 L194 92 Z" fill="url(#tfCon)" />
        <path d="M186 78 L180 64 L192 76 Z" fill="url(#tfCon)" />
        <path d="M234 78 L240 64 L228 76 Z" fill="url(#tfCon)" />
        {/* slit eyes */}
        <path d="M192 98 L208 102 L200 106 Z" fill="#e9b6ff" />
        <path d="M228 98 L212 102 L220 106 Z" fill="#e9b6ff" />
        {/* fanged lower jaw */}
        <path d="M196 116 L210 112 L224 116 L218 124 L210 120 L202 124 Z" fill="url(#tfCon)" />
        <path d="M204 122 L206 130 L208 122 Z M212 122 L214 130 L216 122 Z" fill="#e9b6ff" />
      </g>
    </svg>
  )
}

export default function FactionSeamAtmosphere() {
  return (
    <div className="fh-tf-atmos" aria-hidden="true">
      <div className="fh-tf-sky fh-tf-sky-left" />
      <div className="fh-tf-sky fh-tf-sky-right" />
      <div className="fh-tf-board" />
      <div className="fh-tf-scan" />
      <div className="fh-tf-seam" />
      <FactionGlyphs />
    </div>
  )
}
