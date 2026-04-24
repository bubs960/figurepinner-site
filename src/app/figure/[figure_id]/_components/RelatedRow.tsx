// RelatedRow.tsx — Zone 6 + 7: Series companions / Character thread
// Server component — pure SSR, no client JS needed
// Used for both "others in this series" and "other versions of this character"

interface RelatedFigure {
  figure_id: string
  href: string
  name: string           // display name shown on card
  imageUrl: string | null
}

interface RelatedRowProps {
  label: string          // e.g. "Others In This Series" or "More John Cena Figures"
  figures: RelatedFigure[]
  accentColor?: string
}

export default function RelatedRow({ label, figures, accentColor = 'var(--fp-accent)' }: RelatedRowProps) {
  if (figures.length === 0) return null

  return (
    <section style={{ marginBottom: '2rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        marginBottom: '0.875rem',
        paddingBottom: '0.625rem',
        borderBottom: '1px solid var(--fp-border)',
      }}>
        <div style={{ width: '3px', height: '1rem', background: accentColor, borderRadius: '2px', flexShrink: 0 }} />
        <span style={{
          fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.1em',
          color: 'var(--fp-dim)', textTransform: 'uppercase',
        }}>
          {label}
        </span>
        <span style={{ fontSize: '0.68rem', color: 'var(--fp-dim)', marginLeft: 'auto' }}>
          {figures.length} figure{figures.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Scrollable row */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem',
        /* Hide scrollbar but allow scroll */
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {figures.map(fig => (
          <a
            key={fig.figure_id}
            href={fig.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              flexShrink: 0,
              width: '90px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            {/* Thumbnail */}
            <div style={{
              width: '90px',
              height: '90px',
              background: 'var(--fp-surface-0)',
              border: '1px solid var(--fp-border)',
              borderRadius: 'var(--fp-radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {fig.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fig.imageUrl}
                  alt={fig.name}
                  width={90}
                  height={90}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--fp-dim)" strokeWidth="1.5" opacity="0.4">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              )}
            </div>

            {/* Name */}
            <span style={{
              fontSize: '0.68rem',
              color: 'var(--fp-muted)',
              textAlign: 'center',
              lineHeight: '1.3',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
            }}>
              {fig.name}
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
