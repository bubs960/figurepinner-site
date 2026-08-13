// HeroCtaRail.tsx — v4 Phase 2 (build plan §2, design source
// design-explorations/figure-page-v4/desktop.dc.html CTA row): the 2:1 hero
// CTA pair under the price block. Primary TRACK THIS FIGURE — FREE (gold
// gradient, flex 2) → /sign-up; secondary SOLD LISTINGS ON EBAY ↗ (gold
// outline, flex 1.4) → the parent-built affiliate search URL. Affiliate
// disclosure line below, per design.
//
// REVENUE-CRITICAL (same contract as MobileActionBar): the eBay href is the
// `ebaySearchUrl` PROP, built once by FigureDetailContent via
// buildEbaySearchUrl() with the EPN campid guard. This component MUST NOT
// construct an eBay URL itself (bceb185 lesson).

import TrackedLink from '@/app/components/TrackedLink'

interface Props {
  figureId: string
  ebaySearchUrl: string
  figureName: string
}

export default function HeroCtaRail({ figureId, ebaySearchUrl, figureName }: Props) {
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
        <TrackedLink
          href="/sign-up"
          aria-label={`Track ${figureName} in your free collection`}
          funnelEvent="figure_track_cta_click"
          funnelDetail={{ figureId, target: 'hero_cta' }}
          style={{
            flex: 2, minWidth: '200px', textAlign: 'center',
            background: 'linear-gradient(180deg, #f5c462, #dd9f2e)',
            color: '#141414', fontWeight: 800, fontSize: '14px',
            letterSpacing: '.03em', borderRadius: '10px',
            padding: '15px 18px', textDecoration: 'none',
          }}
        >
          TRACK THIS FIGURE — FREE
        </TrackedLink>
        <TrackedLink
          href={ebaySearchUrl}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          aria-label={`Search eBay sold listings for ${figureName}`}
          funnelEvent="ebay_exit"
          funnelDetail={{ figureId, target: 'hero_cta' }}
          style={{
            flex: 1.4, minWidth: '180px', textAlign: 'center',
            border: '1px solid rgba(224,168,62,.5)',
            color: '#f5c462', fontWeight: 700, fontSize: '13.5px',
            letterSpacing: '.03em', borderRadius: '10px',
            padding: '15px 18px', textDecoration: 'none',
          }}
        >
          SOLD LISTINGS ON EBAY ↗
        </TrackedLink>
      </div>
      <div style={{
        fontSize: '10px', color: 'rgba(242,232,213,.35)', marginTop: '8px',
        letterSpacing: '.02em',
      }}>
        eBay link is an affiliate link — costs you nothing, keeps the data free.
      </div>
    </div>
  )
}
