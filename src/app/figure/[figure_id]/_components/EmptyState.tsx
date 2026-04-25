// EmptyState.tsx — shown when pricing is null or comp_count < 1
// Server component

interface EmptyStateProps {
  figureName: string
  ebaySearchUrl: string
}

export default function EmptyState({ figureName, ebaySearchUrl }: EmptyStateProps) {
  return (
    <div style={{
      background: 'var(--fp-surface-0)',
      border: '1px solid var(--fp-border)',
      borderRadius: 'var(--fp-radius)',
      padding: '2rem',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
    }}>
      {/* Icon */}
      <div style={{ opacity: 0.3 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="var(--fp-muted)" strokeWidth="1.5">
          <circle cx="20" cy="20" r="16" />
          <path d="M20 12v10M20 28h.01" strokeLinecap="round" />
        </svg>
      </div>

      <div>
        <div style={{
          fontSize: '1rem', fontWeight: '700', color: 'var(--fp-text)',
          marginBottom: '0.375rem',
        }}>
          No pricing data yet
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--fp-dim)', maxWidth: '34ch', margin: '0 auto', lineHeight: 1.6 }}>
          We haven&apos;t captured recent sales for {figureName}. Check eBay for live listings.
        </div>
      </div>

      <a
        href={ebaySearchUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--fp-ebay)', color: '#fff',
          padding: '0.7rem 1.25rem',
          borderRadius: 'var(--fp-radius-sm)',
          fontSize: '0.875rem', fontWeight: '700', textDecoration: 'none',
        }}
      >
        Find It on eBay
        <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2.5 6.5h8M6.5 2.5l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      <div style={{ fontSize: '0.7rem', color: 'var(--fp-muted)', maxWidth: '32ch', lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--fp-text)', fontWeight: 600 }}>Free for you</strong>
        {' · '}We earn a small commission from eBay
      </div>
    </div>
  )
}
