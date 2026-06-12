// CtaRail.tsx — Zone 8: Three bottom CTA cards
// Server component
// 2026-06-12: restyled to the agency shelf language (design-explorations/
// 2026-06-12-agency/figure-shelf.html) — hairline panels on the dark page,
// cream Bebas headings, cream-dim body, gold arrow links. Presentation only;
// props, hrefs, and copy unchanged.

import Link from 'next/link'

interface CtaRailProps {
  genre: string
  brand: string
  line: string
  /** Raw product_line slug — builds the /[genre]/[line] hub URL. */
  lineSlug?: string
}

interface CtaCard {
  label: string
  headline: string
  body: string
  href: string
  cta: string
  accentVar: string
}

export default function CtaRail({ genre, brand, line, lineSlug }: CtaRailProps) {
  const genreSlug = (genre ?? '').toLowerCase().replace(/\s+/g, '-')
  const genreLabel = genre.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  // 2026-04-30 unlock: third card retired its "Upgrade to Pro" pitch.
  // Pro is being rebuilt as a seller tier; collector workflows are uncapped
  // and free. The "Track" card now points at /sign-up because the value prop
  // ("Own it, want it, track it") is genuinely free, not gated.
  // 2026-06-11 (S20 audit): Browse card now targets the LINE hub, not the
  // genre page — a visitor on one Elite figure wants the rest of the line,
  // and line hubs were getting near-zero internal link equity. Third slot
  // (empty since the Pro card was pulled 2026-06-06) is now the guides
  // funnel: 21k figure pages previously had zero links to the 25 guides.
  // Shelf language: gold is reserved for actions — all three accents are the
  // brand gold now, applied only to the arrow link.
  const cards: CtaCard[] = [
    {
      label: 'Browse',
      headline: `More ${line} Figures`,
      body: `Every ${line} figure by series, with real sold pricing on each.`,
      href: lineSlug ? `/${genreSlug}/${lineSlug}` : `/${genreSlug}`,
      cta: `Browse ${line} →`,
      accentVar: 'var(--shelf-gold, #e0a83e)',
    },
    {
      label: 'Track',
      headline: 'Build Your Collection',
      body: 'Own it, want it, track it. Unlimited vault, alerts, and price history. Free, forever.',
      href: '/sign-up',
      cta: 'Sign Up Free →',
      accentVar: 'var(--shelf-gold, #e0a83e)',
    },
    {
      label: 'Learn',
      headline: `How to Price ${genreLabel} Figures`,
      body: `Guides on reading comps, condition premiums, spotting fakes, and when to sell — by ${brand} collectors, not content farms.`,
      href: '/guides',
      cta: 'Read the Guides →',
      accentVar: 'var(--shelf-gold, #e0a83e)',
    },
  ]

  return (
    <div className="fp-cta-rail" style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cards.length}, 1fr)`,
      gap: '16px',
      alignItems: 'stretch',
    }}>
      <style>{`
        .fp-cta-card {
          transition: border-color .25s ease, transform .3s cubic-bezier(.22,.61,.36,1);
        }
        .fp-cta-card:hover {
          border-color: var(--shelf-line-gold, rgba(224,168,62,.20)) !important;
          transform: translateY(-2px);
        }
        .fp-cta-card:hover .fp-cta-card-link {
          color: var(--shelf-gold-hi, #f5c462) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .fp-cta-card { transition: none; }
          .fp-cta-card:hover { transform: none; }
        }
      `}</style>
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          style={{ textDecoration: 'none', display: 'block' }}
        >
          <div className="fp-cta-card" style={{
            border: '1px solid var(--shelf-line, rgba(242,232,213,.08))',
            borderRadius: '14px',
            background: 'transparent',
            padding: '26px 26px 22px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: 500, letterSpacing: '0.22em',
              color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))',
              textTransform: 'uppercase',
            }}>
              {card.label}
            </div>
            <div style={{
              fontFamily: 'var(--fp-font-display)', fontWeight: 400,
              fontSize: '24px', lineHeight: 1.05, letterSpacing: '0.02em',
              color: 'var(--shelf-cream, #f2e8d5)',
            }}>
              {card.headline}
            </div>
            <div style={{
              fontSize: '14px', fontWeight: 400, lineHeight: 1.65,
              color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))',
              flex: 1,
            }}>
              {card.body}
            </div>
            <div className="fp-cta-card-link" style={{
              fontSize: '13px', fontWeight: 500, letterSpacing: '0.01em',
              color: card.accentVar, marginTop: '6px',
              transition: 'color .2s',
            }}>
              {card.cta}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
