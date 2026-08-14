// v4 Phase 6 — liquid background (build plan §6: GATED, possibly never).
// Feature-flagged: renders only when NEXT_PUBLIC_LIQUID_BG === '1', so a deploy
// with the flag unset is a structural no-op (same build-time-inline caveat as
// MobileActionBar: NEXT_PUBLIC_* is inlined at build, flipping it requires a
// rebuild+deploy, not a runtime toggle — that's the point, it's a canary gate).
//
// Hard gate before any full enable (plan §6): this page class's real-user LCP is
// already "Needs Improvement" — measure paint cost locally AND via CF Web
// Analytics on a canary first. If it costs measurable LCP/INP, it dies.
//
// Perf posture: transform-only keyframes (translate/scale/rotate — compositable,
// no layout/paint per frame), willChange:transform, blur baked into each layer's
// static filter not animated, prefers-reduced-motion pauses every animation.
// Layer is fixed/inset-0/z-0/pointer-events-none/aria-hidden; page content sits
// in a z-1 wrapper (FigureDetailContent).

const BLOBS = [
  {
    anim: 'fpBlobA 46s ease-in-out infinite',
    style: {
      left: '-12%', top: '-6%', width: '55vw', height: '55vw',
      background: 'radial-gradient(circle at 38% 35%, rgba(224,168,62,.10), rgba(224,168,62,.03) 55%, transparent 72%)',
    },
  },
  {
    anim: 'fpBlobB 58s ease-in-out infinite',
    style: {
      right: '-15%', top: '14%', width: '48vw', height: '48vw',
      background: 'radial-gradient(circle at 60% 40%, rgba(78,205,230,.07), rgba(78,205,230,.02) 55%, transparent 72%)',
    },
  },
  {
    anim: 'fpBlobC 52s ease-in-out infinite',
    style: {
      left: '18%', bottom: '-14%', width: '60vw', height: '44vw',
      background: 'radial-gradient(circle at 50% 50%, rgba(90,60,160,.09), rgba(90,60,160,.025) 55%, transparent 75%)',
    },
  },
] as const

export default function LiquidBackground() {
  if (process.env.NEXT_PUBLIC_LIQUID_BG !== '1') return null

  return (
    <div
      aria-hidden
      className="fp-liquid-bg"
      style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <style>{`
        @keyframes fpBlobA { 0%,100% { transform:translate(-8%,-4%) scale(1) rotate(0deg); } 33% { transform:translate(6%,8%) scale(1.15) rotate(40deg); } 66% { transform:translate(-4%,12%) scale(.92) rotate(-30deg); } }
        @keyframes fpBlobB { 0%,100% { transform:translate(4%,6%) scale(1.05) rotate(0deg); } 50% { transform:translate(-10%,-6%) scale(.9) rotate(60deg); } }
        @keyframes fpBlobC { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(8%,-10%) scale(1.2); } }
        @keyframes fpSheen { 0%,100% { transform:translateX(-12%) skewX(-8deg); opacity:.5; } 50% { transform:translateX(10%) skewX(6deg); opacity:1; } }
        .fp-liquid-blob { position:absolute; border-radius:50%; filter:blur(90px); will-change:transform; }
        @media (max-width: 768px) { .fp-liquid-blob { filter:blur(70px); } }
        @media (prefers-reduced-motion: reduce) {
          .fp-liquid-bg * { animation-play-state: paused !important; }
        }
      `}</style>
      {BLOBS.map((b, i) => (
        <div key={i} className="fp-liquid-blob" style={{ ...b.style, animation: b.anim }} />
      ))}
      {/* caustic sheen bands — thin diagonal refractions, screen-blended */}
      <div style={{
        position: 'absolute', left: '10%', top: 0, width: '34%', height: '140%',
        background: 'linear-gradient(100deg, transparent 40%, rgba(245,196,98,.035) 48%, rgba(255,246,218,.06) 50%, rgba(245,196,98,.035) 52%, transparent 60%)',
        mixBlendMode: 'screen', animation: 'fpSheen 26s ease-in-out infinite', willChange: 'transform', filter: 'blur(6px)',
      }} />
      <div style={{
        position: 'absolute', right: '4%', top: '-10%', width: '26%', height: '140%',
        background: 'linear-gradient(80deg, transparent 42%, rgba(78,205,230,.04) 50%, transparent 58%)',
        mixBlendMode: 'screen', animation: 'fpSheen 38s ease-in-out infinite reverse', willChange: 'transform', filter: 'blur(8px)',
      }} />
      {/* vignette keeps edges dark so content stays readable over the drift */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(120% 90% at 50% 30%, transparent 55%, rgba(9,9,15,.85) 100%)',
      }} />
    </div>
  )
}
