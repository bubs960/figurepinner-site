// EmptyState.tsx — shown when pricing is null or comp_count < 1
// Server component
import TrackedLink from '@/app/components/TrackedLink'

interface EmptyStateProps {
  figureId: string
  figureName: string
  ebaySearchUrl: string
}

export default function EmptyState({ figureId, figureName, ebaySearchUrl }: EmptyStateProps) {
  const soldListingsUrl = `${ebaySearchUrl}&LH_Sold=1&LH_Complete=1`

  return (
    <div style={{
      position: 'relative',
      border: '1px solid var(--shelf-line, rgba(242,232,213,.08))',
      borderRadius: '16px',
      background: 'linear-gradient(180deg, rgba(242,232,213,.03), rgba(242,232,213,.008) 60%, transparent)',
      padding: '2.75rem 2rem 2.25rem',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.1rem',
      overflow: 'hidden',
    }}>
      {/* thin lit edge, echoes the case light strip */}
      <span aria-hidden="true" style={{
        position: 'absolute', top: 0, left: '12%', right: '12%', height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--shelf-line-gold, rgba(224,168,62,.20)), transparent)',
      }} />

      {/* Icon */}
      <div style={{ opacity: 0.55 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="var(--shelf-cream-mut, rgba(242,232,213,.38))" strokeWidth="1">
          <circle cx="20" cy="20" r="16" />
          <path d="M20 12v10M20 28h.01" strokeLinecap="round" />
        </svg>
      </div>

      <div>
        <div style={{
          fontFamily: 'var(--fp-font-display)',
          fontWeight: 400,
          fontSize: 'clamp(26px, 3vw, 34px)',
          lineHeight: 1,
          letterSpacing: '.015em',
          color: 'var(--shelf-cream, #f2e8d5)',
          marginBottom: '0.6rem',
        }}>
          No pricing data yet
        </div>
        <div style={{
          fontSize: '17px',
          fontWeight: 400,
          color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))',
          maxWidth: '46ch',
          margin: '0 auto',
          lineHeight: 1.7,
        }}>
          We haven&apos;t captured recent sold comps for {figureName} yet, so we won&apos;t invent a price. Check completed eBay sales directly before you bid or list.
        </div>
      </div>

      <TrackedLink
        href={soldListingsUrl}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        className="fp-empty-cta"
        funnelEvent="ebay_exit"
        funnelDetail={{ figureId, target: 'empty_state' }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'transparent',
          color: 'var(--shelf-gold, #e0a83e)',
          border: '1px solid var(--shelf-line-gold, rgba(224,168,62,.20))',
          padding: '11px 24px',
          borderRadius: '99px',
          fontSize: '13px', fontWeight: 500, letterSpacing: '.02em',
          textDecoration: 'none',
        }}
      >
        Check Sold Listings
        <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2.5 6.5h8M6.5 2.5l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </TrackedLink>
      <div style={{
        fontSize: '11px',
        fontWeight: 300,
        color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))',
        maxWidth: '36ch',
        lineHeight: 1.6,
        letterSpacing: '.02em',
      }}>
        <strong style={{ color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))', fontWeight: 400 }}>Free for you</strong>
        {' · '}We earn a small commission from eBay
      </div>

      <style>{`
        .fp-empty-cta{
          transition: border-color .2s, background .2s, color .2s, transform .2s;
        }
        .fp-empty-cta:hover{
          border-color: rgba(224,168,62,.5);
          background: rgba(224,168,62,.06);
          color: var(--shelf-gold-hi, #f5c462);
          transform: translateY(-1px);
        }
        @media (prefers-reduced-motion: reduce){
          .fp-empty-cta{ transition: none; }
          .fp-empty-cta:hover{ transform: none; }
        }
      `}</style>
    </div>
  )
}
