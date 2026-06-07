// FigureEnrichment.tsx — per-figure enrichment (matcher's character-enrichment
// program): what match/moment/era this figure depicts + its key features.
// Server component — SSR'd so the unique per-figure text is crawlable (SEO) and
// shows on the page + feeds the same data used in eBay listings.
//
// Render-safe: returns null when neither field is present, so this ships before
// full KB coverage (~262 wrestling fids enriched today) and lights up per-figure
// as matcher syncs more into the live KB. Fields are plain text (no HTML) — we
// render as text/JSX, never dangerouslySetInnerHTML, so there's no injection sink.

interface FigureEnrichmentProps {
  matchRepresented?: string | null
  keyFeatures?: string | null
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
      style={{
        borderLeft: '3px solid var(--fp-accent-warm)',
        background: 'var(--fp-surface-0)',
        borderRadius: `0 var(--fp-radius) var(--fp-radius) 0`,
        padding: '1.75rem 2rem',
        maxWidth: '70ch',
      }}
    >
      {match && (
        <>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'var(--fp-accent-warm)',
              textTransform: 'uppercase',
              marginBottom: '0.875rem',
            }}
          >
            What This Figure Represents
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--fp-text)', lineHeight: 1.7, margin: 0 }}>
            {match}
          </p>
        </>
      )}

      {features.length > 0 && (
        <>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'var(--fp-accent-warm)',
              textTransform: 'uppercase',
              margin: match ? '1.5rem 0 0.875rem' : '0 0 0.875rem',
            }}
          >
            Key Features
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            {features.map((f, i) => (
              <li key={i} style={{ fontSize: '0.9rem', color: 'var(--fp-muted)', lineHeight: 1.6 }}>
                {f}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
