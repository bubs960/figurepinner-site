// CtaRail.tsx — Zone 8: Three bottom CTA cards
// Server component

interface CtaRailProps {
  genre: string
  brand: string
  line: string
}

interface CtaCard {
  label: string
  headline: string
  body: string
  href: string
  cta: string
  accentVar: string
}

export default function CtaRail({ genre, brand, line }: CtaRailProps) {
  const genreSlug = genre.toLowerCase().replace(/\s+/g, '-')

  const cards: CtaCard[] = [
    {
      label: 'Browse',
      headline: `More ${brand} Figures`,
      body: `See all ${line} figures with pricing and market data.`,
      href: `/${genreSlug}`,
      cta: `Browse ${genre.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} →`,
      accentVar: 'var(--fp-accent)',
    },
    {
      label: 'Track',
      headline: 'Build Your Collection',
      body: 'Own it, want it, track it. Your collection in one place.',
      href: '/pro',
      cta: 'Get Started Free →',
      accentVar: 'var(--fp-accent-warm)',
    },
    {
      label: 'Pro',
      headline: 'Full Market Access',
      body: 'Unlock 90-day price history, all comps, and flip alerts.',
      href: '/pro',
      cta: 'Upgrade to Pro →',
      accentVar: 'var(--fp-accent-rare)',
    },
  ]

  return (
    <div className="fp-cta-rail" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1px',
      background: 'var(--fp-border)',
      border: '1px solid var(--fp-border)',
      borderRadius: 'var(--fp-radius)',
      overflow: 'hidden',
    }}>
      {cards.map((card) => (
        <a
          key={card.label}
          href={card.href}
          style={{ textDecoration: 'none' }}
        >
          <div style={{
            background: 'var(--fp-surface-0)',
            padding: '1.25rem',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            transition: 'background 0.15s',
          }}>
            <div style={{
              fontSize: '0.58rem', fontWeight: '700', letterSpacing: '0.12em',
              color: card.accentVar, textTransform: 'uppercase',
            }}>
              {card.label}
            </div>
            <div style={{
              fontSize: '0.9rem', fontWeight: '700',
              color: 'var(--fp-text)', lineHeight: '1.3',
            }}>
              {card.headline}
            </div>
            <div style={{
              fontSize: '0.78rem', color: 'var(--fp-muted)',
              lineHeight: '1.5', flex: 1,
            }}>
              {card.body}
            </div>
            <div style={{
              fontSize: '0.75rem', fontWeight: '700',
              color: card.accentVar, marginTop: '0.25rem',
            }}>
              {card.cta}
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
