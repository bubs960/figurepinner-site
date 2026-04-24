// SellerCard.tsx — Zone: In-Store Availability
// Server component — rendered only when inventory exists for this figure.
// Shows "Buy from [seller]" with price, condition, and direct Shopify link.

import type { SellerListing } from '@/data/bubs-inventory'

interface SellerCardProps {
  listings: SellerListing[]
}

export default function SellerCard({ listings }: SellerCardProps) {
  if (listings.length === 0) return null

  return (
    <section style={{ marginBottom: '1.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        marginBottom: '0.75rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--fp-border)',
      }}>
        <div style={{
          width: '3px', height: '1rem',
          background: 'var(--fp-accent-warm)',
          borderRadius: '2px',
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: 'var(--fp-dim)',
          textTransform: 'uppercase',
        }}>
          Available In Store
        </span>
        {/* Live dot */}
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          marginLeft: 'auto',
          fontSize: '0.6rem',
          fontWeight: 700,
          color: '#00C870',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          <span style={{
            width: '5px', height: '5px',
            borderRadius: '50%',
            background: '#00C870',
            display: 'inline-block',
          }} />
          In Stock
        </span>
      </div>

      {/* Listing cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {listings.map((listing, i) => (
          <div
            key={i}
            style={{
              background: 'var(--fp-surface-1)',
              border: '1px solid var(--fp-border)',
              borderRadius: 'var(--fp-radius)',
              overflow: 'hidden',
            }}
          >
            {/* Top: store name + badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 0.875rem 0',
            }}>
              {/* Store avatar */}
              <div style={{
                width: 22, height: 22,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF5F00, #CC3300)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.625rem', fontWeight: 800, color: '#fff',
                flexShrink: 0,
              }}>
                B
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--fp-text)',
                flex: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {listing.seller_name}
              </span>
              {listing.badge && (
                <span style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  background: 'rgba(255,95,0,0.12)',
                  color: 'var(--fp-accent-warm)',
                  border: '1px solid rgba(255,95,0,0.25)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  {listing.badge}
                </span>
              )}
            </div>

            {/* Title */}
            <div style={{
              padding: '0.25rem 0.875rem 0',
              fontSize: '0.75rem',
              color: 'var(--fp-muted)',
              lineHeight: 1.4,
            }}>
              {listing.title}
            </div>

            {/* Price row + CTA */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.875rem 0.75rem',
            }}>
              {/* Price */}
              <div>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--fp-text)',
                  letterSpacing: '-0.01em',
                }}>
                  ${listing.price.toFixed(2)}
                </span>
              </div>

              {/* Condition pill */}
              <span style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                padding: '0.1875rem 0.5rem',
                borderRadius: '9999px',
                background: conditionBg(listing.condition),
                color: conditionColor(listing.condition),
                border: `1px solid ${conditionBorder(listing.condition)}`,
                whiteSpace: 'nowrap',
              }}>
                {listing.condition}
              </span>

              {/* CTA */}
              <a
                href={listing.buy_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 1rem',
                  background: 'var(--fp-accent-warm)',
                  color: '#fff',
                  borderRadius: 'var(--fp-radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Buy Now
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 10L10 2M10 2H4M10 2v6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* "More from this store" footer */}
      <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
        <a
          href={listings[0]?.seller_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.68rem',
            color: 'var(--fp-dim)',
            textDecoration: 'none',
          }}
        >
          Browse more at {listings[0]?.seller_name} →
        </a>
      </div>
    </section>
  )
}

// ─── Condition color helpers ──────────────────────────────────────────────────

function conditionBg(condition: string): string {
  if (condition.startsWith('New')) return 'rgba(0,200,112,0.08)'
  if (condition.includes('Like New')) return 'rgba(0,200,112,0.06)'
  return 'rgba(255,184,0,0.08)'
}

function conditionColor(condition: string): string {
  if (condition.startsWith('New')) return '#00C870'
  if (condition.includes('Like New')) return '#00C870'
  return '#FFB800'
}

function conditionBorder(condition: string): string {
  if (condition.startsWith('New')) return 'rgba(0,200,112,0.25)'
  if (condition.includes('Like New')) return 'rgba(0,200,112,0.2)'
  return 'rgba(255,184,0,0.25)'
}
