// FigureEnrichment.tsx — per-figure enrichment (matcher's character-enrichment
// program): what match/moment/era this figure depicts + its key features.
// Server component — SSR'd so the unique per-figure text is crawlable (SEO) and
// shows on the page + feeds the same data used in eBay listings.
//
// Render-safe: returns null when neither field is present, so this ships before
// full KB coverage (~262 wrestling fids enriched today) and lights up per-figure
// as matcher syncs more into the live KB. Fields are plain text (no HTML) — we
// render as text/JSX, never dangerouslySetInnerHTML, so there's no injection sink.
//
// Design language: 2026-06-12 "agency" shelf spec — hairline borders, kicker
// labels, generous cream body copy, gold reserved for accents. Tokens come from
// the page root's --shelf-* vars (with fallbacks).

interface FigureEnrichmentProps {
  matchRepresented?: string | null
  keyFeatures?: string | null
}

const CREAM_DIM = 'var(--shelf-cream-dim, rgba(242,232,213,.60))'
const CREAM_MUT = 'var(--shelf-cream-mut, rgba(242,232,213,.38))'
const GOLD = 'var(--shelf-gold, #e0a83e)'
const LINE = 'var(--shelf-line, rgba(242,232,213,.08))'

const kickerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '11px',
}

const kickerDashStyle: React.CSSProperties = {
  flex: 'none',
  width: '24px',
  height: '1px',
  background: GOLD,
  opacity: 0.65,
}

const kickerTextStyle: React.CSSProperties = {
  fontFamily: 'var(--fp-font-body)',
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: CREAM_MUT,
  lineHeight: 1.4,
}

export default function FigureEnrichment({ matchRepresented, keyFeatures }: FigureEnrichmentProps) {
  const match = matchRepresented?.trim() || ''
  const features = (keyFeatures ?? '')
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean)

  if (!match && features.length === 0) return null

  return (
    <section
      className="fp-enrich"
      style={{
        maxWidth: '70ch',
        fontFamily: 'var(--fp-font-body)',
      }}
    >
      <style>{`
        @keyframes fpEnrichRise {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: none; }
        }
        .fp-enrich .fp-enrich-rise {
          animation: fpEnrichRise .7s cubic-bezier(.22,.61,.36,1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .fp-enrich .fp-enrich-rise { animation: none; }
        }
      `}</style>

      {match && (
        <div className="fp-enrich-rise">
          <div style={{ ...kickerRowStyle, marginBottom: '0.9rem' }}>
            <span aria-hidden="true" style={kickerDashStyle} />
            <span style={kickerTextStyle}>What This Figure Represents</span>
          </div>
          <p
            style={{
              fontSize: '18px',
              fontWeight: 400,
              color: CREAM_DIM,
              lineHeight: 1.7,
              margin: 0,
              maxWidth: '58ch',
            }}
          >
            {match}
          </p>
        </div>
      )}

      {features.length > 0 && (
        <div
          className="fp-enrich-rise"
          style={{ animationDelay: match ? '.12s' : '0s' }}
        >
          <div
            style={{
              ...kickerRowStyle,
              margin: match ? '2.2rem 0 0.35rem' : '0 0 0.35rem',
            }}
          >
            <span aria-hidden="true" style={kickerDashStyle} />
            <span style={kickerTextStyle}>Key Features</span>
          </div>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}
          >
            {features.map((f, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '11px 0',
                  borderTop: i === 0 ? 'none' : `1px solid ${LINE}`,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flex: 'none',
                    width: '13px',
                    height: '1px',
                    background: GOLD,
                    opacity: 0.7,
                    marginTop: '0.72em',
                  }}
                />
                <span
                  style={{
                    fontSize: '15.5px',
                    fontWeight: 400,
                    color: CREAM_DIM,
                    lineHeight: 1.6,
                  }}
                >
                  {f}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
