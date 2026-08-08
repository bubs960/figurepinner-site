// RelatedRow.tsx — Zone 6 + 7: Series companions / Character thread
// Server component; tiles render through the QuickLookAnchor client island
// (S54: rail thumbs are too small to read — desktop hover blows each tile up
// into a large quick-look card, portaled past this row's overflow-x clip).
// Used for both "others in this series" and "other versions of this character"
// Visual language: 2026-06-12 agency shelf spec — cream mounts, hairline borders, gold accents

import type { CSSProperties } from 'react'
import WaveProgress from './WaveProgress'
import QuickLookAnchor from '@/app/components/QuickLookAnchor'

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
  /** When set, renders a client "You own N of M" badge in the header,
   *  intersecting the signed-in vault with these wave fids (incl. the current
   *  figure). Only "Complete the Wave" passes this; omit elsewhere. */
  ownershipFids?: string[]
  /** When set, renders a link in the header (e.g. to the character hub page —
   *  P2 distribution, character pages otherwise have zero inbound links). */
  headerLink?: { href: string; label: string }
}

export default function RelatedRow({ label, figures, accentColor = 'var(--shelf-gold, #e0a83e)', ownershipFids, headerLink }: RelatedRowProps) {
  if (figures.length === 0) return null

  return (
    <section
      className="fp-relrow"
      style={{ marginBottom: '2rem', '--relrow-accent': accentColor } as CSSProperties}
    >
      <style>{`
        .fp-relrow-scroll{scrollbar-width:none;-ms-overflow-style:none}
        .fp-relrow-scroll::-webkit-scrollbar{display:none}
        @keyframes fpRelrowIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .fp-relrow-card{animation:fpRelrowIn .55s cubic-bezier(.22,.61,.36,1) both}
        .fp-relrow-card:nth-child(1){animation-delay:.03s}
        .fp-relrow-card:nth-child(2){animation-delay:.08s}
        .fp-relrow-card:nth-child(3){animation-delay:.13s}
        .fp-relrow-card:nth-child(4){animation-delay:.18s}
        .fp-relrow-card:nth-child(5){animation-delay:.23s}
        .fp-relrow-card:nth-child(6){animation-delay:.28s}
        .fp-relrow-card:nth-child(7){animation-delay:.33s}
        .fp-relrow-card:nth-child(8){animation-delay:.38s}
        .fp-relrow-mount{transition:transform .35s cubic-bezier(.22,.61,.36,1),border-color .35s ease,box-shadow .35s ease}
        .fp-relrow-name{transition:color .25s ease}
        .fp-relrow-card:hover .fp-relrow-mount{
          transform:translateY(-4px);
          border-color:var(--relrow-accent,var(--shelf-gold,#e0a83e));
          box-shadow:0 16px 26px rgba(0,0,0,.5),0 0 16px var(--shelf-line-gold,rgba(224,168,62,.20));
        }
        .fp-relrow-card:hover .fp-relrow-name{color:var(--shelf-gold-hi,#f5c462)}
        @media (prefers-reduced-motion: reduce){
          .fp-relrow-card{animation:none}
          .fp-relrow-mount,.fp-relrow-name{transition:none}
          .fp-relrow-card:hover .fp-relrow-mount{transform:none}
        }
      `}</style>

      {/* Header — kicker label with gold dash */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: '0.75rem',
        marginBottom: '1rem',
      }}>
        <span aria-hidden="true" style={{
          width: '26px', height: '1px', background: accentColor,
          flexShrink: 0, alignSelf: 'center',
        }} />
        <h2 style={{
          fontSize: '0.625rem', fontWeight: 500, letterSpacing: '0.22em',
          color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))', textTransform: 'uppercase',
          margin: 0,
        }}>
          {label}
        </h2>
        {headerLink && (
          <a
            href={headerLink.href}
            style={{
              fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.02em',
              color: accentColor, textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            {headerLink.label}
          </a>
        )}
        <span style={{
          display: 'inline-flex', alignItems: 'baseline', gap: '0.85rem',
          marginLeft: 'auto', whiteSpace: 'nowrap',
        }}>
          {ownershipFids && ownershipFids.length > 0 && (
            <WaveProgress fids={ownershipFids} />
          )}
          <span style={{
            fontSize: '0.59rem', fontWeight: 400, letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))',
          }}>
            {figures.length} figure{figures.length !== 1 ? 's' : ''}
          </span>
        </span>
      </div>

      {/* Scrollable shelf row */}
      <div
        className="fp-relrow-scroll"
        style={{
          display: 'flex',
          gap: '0.75rem',
          overflowX: 'auto',
          paddingTop: '0.5rem',
          marginTop: '-0.5rem',
          paddingBottom: '0.75rem',
          /* Hide scrollbar but allow scroll */
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {figures.map(fig => (
          <QuickLookAnchor
            key={fig.figure_id}
            href={fig.href}
            className="fp-relrow-card"
            image={fig.imageUrl}
            name={fig.name}
            figureId={fig.figure_id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              flexShrink: 0,
              width: '96px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            {/* Cream photo mount */}
            <div
              className="fp-relrow-mount"
              style={{
                background: 'var(--shelf-mount, linear-gradient(180deg,#fbf7ee 0%,#efe5d0 100%))',
                border: '1px solid var(--shelf-line, rgba(242,232,213,.08))',
                borderRadius: '6px 6px 3px 3px',
                padding: '5px 5px 6px',
                boxShadow: '0 10px 18px rgba(0,0,0,.35), 0 2px 4px rgba(0,0,0,.3)',
              }}
            >
              <div style={{
                width: '100%',
                aspectRatio: '4 / 5',
                background: '#e9e0cd',
                borderRadius: '3px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {fig.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fig.imageUrl}
                    alt={`${fig.name} action figure`}
                    width={90}
                    height={90}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                  />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8a7c5e" strokeWidth="1.5" opacity="0.6">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                )}
              </div>
            </div>

            {/* Name */}
            <span
              className="fp-relrow-name"
              style={{
                fontSize: '0.78rem',
                fontWeight: 500,
                color: 'var(--shelf-cream, #f2e8d5)',
                lineHeight: '1.3',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word',
              }}
            >
              {fig.name}
            </span>
          </QuickLookAnchor>
        ))}
      </div>
    </section>
  )
}
