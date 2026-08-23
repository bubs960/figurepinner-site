'use client'
// HeroCtaRail.tsx — v4 Phase 2 (build plan §2, design source
// design-explorations/figure-page-v4/desktop.dc.html CTA row): the 2:1 hero
// CTA pair under the price block. Primary CTA (gold gradient, flex 2);
// secondary SOLD LISTINGS ON EBAY ↗ (gold outline, flex 1.4) → the
// parent-built affiliate search URL. Affiliate disclosure line below, per
// design.
//
// Primary CTA fix (2026-08-23, Steve live-testing report): was a hardcoded
// `href="/sign-up"` regardless of auth state, so a SIGNED-IN visitor -- the
// population most likely to actually want this -- got sent to a page they
// didn't need instead of anything useful. That's why "hard to find where to
// add a figure" happened: the obvious top CTA did nothing for a signed-in
// visitor, so the real control (FigureActions, inside CollectionPanel,
// id="figure-actions") could only be found by scrolling past several
// sections. Now client-side-checks `hasClientClerkSession()`: anon visitor
// keeps the original /sign-up link (correct there); signed-in visitor gets
// a same-page anchor to #figure-actions instead, with a matching label so
// it isn't misleading either way. Plain `href="#figure-actions"` is the
// real navigation (works with zero JS); the onClick only upgrades it to a
// smooth scroll.
//
// REVENUE-CRITICAL (same contract as MobileActionBar): the eBay href is the
// `ebaySearchUrl` PROP, built once by FigureDetailContent via
// buildEbaySearchUrl() with the EPN campid guard. This component MUST NOT
// construct an eBay URL itself (bceb185 lesson).

import { useEffect, useState } from 'react'
import TrackedLink from '@/app/components/TrackedLink'
import { hasClientClerkSession } from '@/app/_lib/clientAuth'

interface Props {
  figureId: string
  ebaySearchUrl: string
  figureName: string
}

export default function HeroCtaRail({ figureId, ebaySearchUrl, figureName }: Props) {
  // Defaults to the anon behavior (matches SSR output exactly, no
  // hydration-mismatch risk) and upgrades after mount if a session cookie
  // is present -- same pattern as AdSlot's Pro check.
  const [signedIn, setSignedIn] = useState(false)
  useEffect(() => { setSignedIn(hasClientClerkSession()) }, [])

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
        <TrackedLink
          href={signedIn ? '#figure-actions' : '/sign-up'}
          onClick={e => {
            if (!signedIn) return
            const target = document.getElementById('figure-actions')
            if (!target) return // no-op fallback -- the plain anchor href still navigates correctly
            e.preventDefault()
            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
          aria-label={signedIn ? `Add ${figureName} to your collection` : `Track ${figureName} in your free collection`}
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
          {signedIn ? 'ADD TO COLLECTION' : 'TRACK THIS FIGURE — FREE'}
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
