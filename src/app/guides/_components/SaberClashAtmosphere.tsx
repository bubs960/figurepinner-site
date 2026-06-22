/**
 * SaberClashAtmosphere — the Star Wars centerpiece (S41, hub #2 of the consolidated
 * web rollout). The seam-clash skeleton (cf. GiJoeSeamAtmosphere) re-cast as a
 * LIGHTSABER CLASH: the LIGHT side LEFT (blue blade, Jedi/Rebellion), the DARK side
 * RIGHT (red blade, Sith/Empire), the two blades meeting ON the glowing vertical
 * seam — the front line of the war. Where GI Joe's two sigils CONFRONT, here the two
 * blades CROSS.
 *
 * Decorative + aria-hidden, layered OVER the SSR'd hero copy (h1 stays LCP). Pure CSS
 * gradients + inline SVG (zero raster). All blade colors are CSS vars (`--saber-*`) set
 * under [data-fandom="star-wars-black-series"] in globals.css.
 *
 * RIGHTS (legal-compliance gate): the hilts are ORIGINAL emitter/grip geometry — NOT a
 * traced replica of any specific screen prop — and there are no trademarked wordmarks or
 * logos anywhere. A glowing-blade clash is a generic genre motif, not a protected mark.
 *
 * MOTION (globals.css, reduced-motion-gated): boot-up ignites the board + a scanline
 * sweep + the blades extend/scale in; scroll-lock (SeamScrollDriver writes --rise 0→1)
 * slides the two blades from slightly-apart → crossed on the seam, the clash spark blooms.
 * Reduced-motion → --rise defaults to 1, blades arrive crossed + static.
 */

function SaberClash() {
  return (
    <svg className="fh-saberclash" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="swClash" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="0.35" stopColor="#dfeaff" stopOpacity="0.5" />
          <stop offset="0.7" stopColor="#ff5a5f" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ff5a5f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="swSeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5aa0ff" stopOpacity="0" />
          <stop offset="0.22" stopColor="#5aa0ff" />
          <stop offset="0.5" stopColor="#ffffff" />
          <stop offset="0.78" stopColor="#ff4d52" />
          <stop offset="1" stopColor="#ff4d52" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="swHiltL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a4150" />
          <stop offset="0.5" stopColor="#c5ccd6" />
          <stop offset="1" stopColor="#2c323d" />
        </linearGradient>
        <linearGradient id="swHiltR" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2c323d" />
          <stop offset="0.5" stopColor="#c5ccd6" />
          <stop offset="1" stopColor="#3a4150" />
        </linearGradient>
      </defs>

      {/* the front line — blue→white→red seam down the center */}
      <rect className="fh-sw-split" x="158.5" y="24" width="3" height="152" rx="1.5" fill="url(#swSeam)" />

      {/* LIGHT saber (LEFT) — blue blade rising from a lower-left hilt to the seam */}
      <g className="fh-saber fh-saber-light">
        {/* outer bloom */}
        <line x1="64" y1="172" x2="170" y2="58" stroke="var(--saber-light)" strokeWidth="13" strokeLinecap="round" opacity="0.28" />
        {/* blade */}
        <line x1="70" y1="170" x2="166" y2="62" stroke="var(--saber-light)" strokeWidth="7" strokeLinecap="round" />
        {/* white-hot core */}
        <line x1="70" y1="170" x2="166" y2="62" stroke="var(--saber-light-core)" strokeWidth="2.6" strokeLinecap="round" />
        {/* hilt — original emitter/grip cylinder at the blade base */}
        <g transform="rotate(47 64 176)">
          <rect x="50" y="170" width="30" height="12" rx="3" fill="url(#swHiltL)" />
          <rect x="74" y="169" width="7" height="14" rx="2" fill="#aeb6c2" />
          <rect x="56" y="170" width="2" height="12" fill="#11151c" opacity="0.6" />
          <rect x="62" y="170" width="2" height="12" fill="#11151c" opacity="0.6" />
          <rect x="46" y="172" width="6" height="8" rx="2" fill="#1c2128" />
        </g>
      </g>

      {/* DARK saber (RIGHT) — red blade rising from a lower-right hilt to the seam */}
      <g className="fh-saber fh-saber-dark">
        <line x1="256" y1="172" x2="150" y2="58" stroke="var(--saber-dark)" strokeWidth="13" strokeLinecap="round" opacity="0.28" />
        <line x1="250" y1="170" x2="154" y2="62" stroke="var(--saber-dark)" strokeWidth="7" strokeLinecap="round" />
        <line x1="250" y1="170" x2="154" y2="62" stroke="var(--saber-dark-core)" strokeWidth="2.6" strokeLinecap="round" />
        <g transform="rotate(-47 256 176)">
          <rect x="240" y="170" width="30" height="12" rx="3" fill="url(#swHiltR)" />
          <rect x="239" y="169" width="7" height="14" rx="2" fill="#aeb6c2" />
          <rect x="256" y="170" width="2" height="12" fill="#11151c" opacity="0.6" />
          <rect x="262" y="170" width="2" height="12" fill="#11151c" opacity="0.6" />
          <rect x="268" y="172" width="6" height="8" rx="2" fill="#1c2128" />
        </g>
      </g>

      {/* clash bloom where the blades meet on the seam */}
      <circle className="fh-sw-spark" cx="160" cy="74" r="34" fill="url(#swClash)" />
    </svg>
  )
}

export default function SaberClashAtmosphere() {
  return (
    <div className="fh-sw-atmos" aria-hidden="true">
      <div className="fh-sw-sky fh-sw-sky-left" />
      <div className="fh-sw-sky fh-sw-sky-right" />
      <div className="fh-sw-board" />
      <div className="fh-sw-scan" />
      <div className="fh-sw-seam" />
      <SaberClash />
    </div>
  )
}
