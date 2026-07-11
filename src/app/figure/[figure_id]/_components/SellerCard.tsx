// SellerCard.tsx — Zone: In-Store Availability
// Server component — rendered only when inventory exists for this figure.
// Shows "Buy from [seller]" with price, condition, and direct Shopify link.
// Shelf design language (2026-06-12 agency port): hairline panel with a thin
// gold light strip, cream-mount monogram tile, condition chips (New Sealed =
// gold outline, others cream hairline), gold pill buy action, subordinate
// cream price in display numerals. GPU-only hover, reduced-motion safe.

import type { CSSProperties } from 'react'
import type { SellerListing } from '@/data/bubs-inventory'
import TrackedLink from '@/app/components/TrackedLink'

interface SellerCardProps {
  listings: SellerListing[]
}

const SC_CSS = `
.fp-sc-panel{position:relative;border:1px solid var(--shelf-line, rgba(242,232,213,.08));border-radius:14px;background:linear-gradient(180deg, rgba(242,232,213,.03), rgba(242,232,213,.008) 60%, transparent);overflow:hidden}
.fp-sc-panel::after{content:'';position:absolute;top:0;left:12%;right:12%;height:1px;background:linear-gradient(90deg,transparent,rgba(245,196,98,.55),transparent)}
.fp-sc-buy{transition:transform .2s, box-shadow .2s}
.fp-sc-buy:hover{transform:translateY(-1px);box-shadow:0 1px 0 rgba(255,255,255,.22) inset, 0 8px 22px rgba(224,168,62,.3)}
.fp-sc-more{transition:color .2s, border-color .2s}
.fp-sc-more:hover{color:var(--shelf-gold-hi, #f5c462);border-color:var(--shelf-gold-hi, #f5c462)}
@media (prefers-reduced-motion: reduce){
  .fp-sc-buy,.fp-sc-more{transition:none}
  .fp-sc-buy:hover{transform:none}
}
`

export default function SellerCard({ listings }: SellerCardProps) {
  if (listings.length === 0) return null

  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <style>{SC_CSS}</style>

      <div className="fp-sc-panel">
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.8rem 1.125rem 0.7rem',
        }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))',
          }}>
            Available In Store
          </span>
          {/* Live dot */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            marginLeft: 'auto',
            fontSize: '9.5px',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))',
          }}>
            <span style={{
              width: '5px', height: '5px',
              borderRadius: '50%',
              background: 'var(--shelf-gold, #e0a83e)',
              boxShadow: '0 0 8px rgba(224,168,62,.7)',
              display: 'inline-block',
              flexShrink: 0,
            }} />
            In Stock
          </span>
        </div>

        {/* Listing rows */}
        {listings.map((listing, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.875rem',
              padding: '0.875rem 1.125rem',
              borderTop: '1px solid var(--shelf-line, rgba(242,232,213,.08))',
            }}
          >
            {/* Cream-mount store tile */}
            <div style={{
              width: 46,
              flexShrink: 0,
              background: 'var(--shelf-mount, linear-gradient(180deg,#fbf7ee 0%,#efe5d0 100%))',
              borderRadius: '6px 6px 3px 3px',
              padding: '4px 4px 5px',
              boxShadow: '0 8px 16px rgba(0,0,0,.45), 0 1px 3px rgba(0,0,0,.4)',
            }}>
              <div style={{
                aspectRatio: '4 / 5',
                borderRadius: 3,
                background: '#e9e0cd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--fp-font-display)',
                fontSize: '1.25rem',
                lineHeight: 1,
                color: '#8a6a30',
              }}>
                B
              </div>
            </div>

            {/* Store name + badge + title */}
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: 0,
              }}>
                <span style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--shelf-cream, #f2e8d5)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {listing.seller_name}
                </span>
                {listing.badge && (
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 500,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    padding: '3px 9px',
                    borderRadius: '99px',
                    border: '1px solid var(--shelf-line-gold, rgba(224,168,62,.20))',
                    color: 'var(--shelf-gold-hi, #f5c462)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {listing.badge}
                  </span>
                )}
              </div>
              <div style={{
                marginTop: '0.2rem',
                fontSize: '0.84rem',
                fontWeight: 400,
                lineHeight: 1.55,
                color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))',
              }}>
                {listing.title}
              </div>
            </div>

            {/* Price + condition chip + CTA */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginLeft: 'auto',
            }}>
              <span style={{
                fontFamily: 'var(--fp-font-display)',
                fontSize: '1.25rem',
                fontWeight: 400,
                letterSpacing: '0.03em',
                lineHeight: 1,
                color: 'var(--shelf-cream, #f2e8d5)',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}>
                ${listing.price.toFixed(2)}
              </span>

              {listing.condition && (
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '99px',
                  whiteSpace: 'nowrap',
                  ...conditionChipStyle(listing.condition),
                }}>
                  {listing.condition}
                </span>
              )}

              <TrackedLink
                className="fp-sc-buy"
                href={listing.buy_url}
                target="_blank"
                rel="noopener noreferrer"
                funnelEvent="ebay_exit"
                funnelDetail={{ target: 'shop_module', price: listing.price }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1.05rem',
                  background: 'linear-gradient(180deg, var(--shelf-gold-hi, #f5c462), var(--shelf-gold, #e0a83e))',
                  color: '#1a1206',
                  borderRadius: '99px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: '0 1px 0 rgba(255,255,255,.22) inset, 0 4px 14px rgba(224,168,62,.18)',
                }}
              >
                Buy Now
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 10L10 2M10 2H4M10 2v6" stroke="#1a1206" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </TrackedLink>
            </div>
          </div>
        ))}
      </div>

      {/* "More from this store" footer — only when a real store URL is known
          (eBay-sourced listings don't carry one; never link to a guess) */}
      {listings[0]?.seller_url && (
        <div style={{ marginTop: '0.625rem', textAlign: 'center' }}>
          <a
            className="fp-sc-more"
            href={listings[0].seller_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.75rem',
              fontWeight: 400,
              color: 'var(--shelf-gold-hi, #f5c462)',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(224,168,62,.35)',
              paddingBottom: 1,
            }}
          >
            Browse more at {listings[0].seller_name} →
          </a>
        </div>
      )}
    </section>
  )
}

// ─── Condition chip style ─────────────────────────────────────────────────────
// Sealed conditions get the gold-outline chip; every other condition gets
// the quiet cream hairline. Chip text = raw condition string. Two vocabularies
// feed this: the manual Shopify seed ("New Sealed") and lister's
// condition_map.py export ("Factory Sealed") — check the substring, not an
// exact prefix, so either source's "sealed" state renders the same way.

function conditionChipStyle(condition: string): CSSProperties {
  if (condition.includes('Sealed')) {
    return {
      color: 'var(--shelf-gold-hi, #f5c462)',
      border: '1px solid rgba(224,168,62,.45)',
      background: 'rgba(224,168,62,.06)',
    }
  }
  return {
    color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))',
    border: '1px solid rgba(242,232,213,.18)',
    background: 'transparent',
  }
}
