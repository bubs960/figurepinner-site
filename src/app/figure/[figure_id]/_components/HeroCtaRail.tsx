'use client'
// HeroCtaRail.tsx — v4 Phase 2 (build plan §2, design source
// design-explorations/figure-page-v4/desktop.dc.html CTA row): the 2:1 hero
// CTA pair under the price block. Primary CTA (gold gradient, flex 2);
// secondary SOLD LISTINGS ON EBAY ↗ (gold outline, flex 1.4) → the
// parent-built affiliate search URL. Affiliate disclosure line below, per
// design.
//
// Shared with guides' ArticleEndCta.tsx/HubTrackStrip.tsx (a "figure
// mentioned in this content" CTA, not the current page's own figure) --
// those call sites don't pass brand/line/genre and keep the anon/scroll
// behavior below unchanged.
//
// Primary CTA history (2026-08-23, Steve live-testing report):
// 1. Was a hardcoded `href="/sign-up"` regardless of auth state -- did
//    nothing useful for a signed-in visitor, the population most likely to
//    want it. First fix: signed-in visitor got a same-page scroll to
//    #figure-actions (FigureActions/CollectionPanel) instead.
// 2. Steve's live follow-up: "why do I have to click it twice" -- fair,
//    scroll-then-click-again has no real value over doing the add directly.
//    FigureActions' own add is a single POST with sensible defaults
//    (paid=0, condition='Loose'; the paid/condition FORM is an optional
//    refinement, not a requirement) -- vaultAdd.ts extracts that POST +
//    its side effects (fp_has_saved marker, figure:claimed event) so this
//    button can call it directly. FigureActions reacts automatically via
//    useOwnershipStatus's figure:claimed listener -- no extra plumbing.
// Figure-page data (brand/line/genre) unavailable -> falls back to the
// scroll-to-#figure-actions behavior from fix 1, which is still correct
// wherever a #figure-actions panel doesn't exist (guide/hub call sites).
//
// REVENUE-CRITICAL (same contract as MobileActionBar): the eBay href is the
// `ebaySearchUrl` PROP, built once by FigureDetailContent via
// buildEbaySearchUrl() with the EPN campid guard. This component MUST NOT
// construct an eBay URL itself (bceb185 lesson).

import { useEffect, useState } from 'react'
import TrackedLink from '@/app/components/TrackedLink'
import { hasClientClerkSession } from '@/app/_lib/clientAuth'
import { useOwnershipStatus } from '@/app/_lib/useOwnershipStatus'
import { addFigureToVault } from '@/app/_lib/vaultAdd'

interface Props {
  figureId: string
  ebaySearchUrl: string
  figureName: string
  /** Present only on the figure-page call site -- enables the direct
   *  one-click add. Guide/hub call sites omit these and keep the
   *  scroll-to-#figure-actions fallback (no such panel exists there). */
  brand?: string
  line?: string
  genre?: string
}

type AddState = 'idle' | 'loading' | 'done' | 'error'

export default function HeroCtaRail({ figureId, ebaySearchUrl, figureName, brand, line, genre }: Props) {
  const canDirectAdd = brand != null && line != null && genre != null

  // Defaults to the anon behavior (matches SSR output exactly, no
  // hydration-mismatch risk) and upgrades after mount if a session cookie
  // is present -- same pattern as AdSlot's Pro check.
  const [signedIn, setSignedIn] = useState(false)
  useEffect(() => { setSignedIn(hasClientClerkSession()) }, [])

  const { owned } = useOwnershipStatus(figureId)
  const [addState, setAddState] = useState<AddState>('idle')
  useEffect(() => { if (owned) setAddState('done') }, [owned])

  async function handleDirectAdd() {
    if (addState === 'loading' || addState === 'done') return
    setAddState('loading')
    const result = await addFigureToVault({ figure_id: figureId, name: figureName, brand: brand!, line: line!, genre: genre! })
    if (result.status === 'unauthenticated') {
      window.location.href = '/sign-in'
      return
    }
    if (result.status === 'ok' || result.status === 'duplicate') {
      setAddState('done')
      return
    }
    if (result.status === 'gated') {
      // Vault full -- send them to the real panel, which renders the actual
      // gate message (limit/upgrade_url); duplicating that copy here would
      // just be a second place for it to go stale.
      document.getElementById('figure-actions')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    setAddState('error')
  }

  const directAddLabel = addState === 'loading' ? 'ADDING…' : addState === 'done' ? 'ADDED ✓' : addState === 'error' ? 'TRY AGAIN' : 'ADD TO COLLECTION'

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
        <TrackedLink
          href={!signedIn ? '/sign-up' : '#figure-actions'}
          onClick={e => {
            if (!signedIn) return
            e.preventDefault()
            if (canDirectAdd) {
              handleDirectAdd()
              return
            }
            document.getElementById('figure-actions')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
          aria-label={signedIn ? `Add ${figureName} to your collection` : `Track ${figureName} in your free collection`}
          aria-disabled={signedIn && canDirectAdd && (addState === 'loading' || addState === 'done')}
          funnelEvent="figure_track_cta_click"
          funnelDetail={{ figureId, target: 'hero_cta' }}
          style={{
            flex: 2, minWidth: '200px', textAlign: 'center',
            background: 'linear-gradient(180deg, #f5c462, #dd9f2e)',
            color: '#141414', fontWeight: 800, fontSize: '14px',
            letterSpacing: '.03em', borderRadius: '10px',
            padding: '15px 18px', textDecoration: 'none',
            opacity: signedIn && canDirectAdd && addState === 'loading' ? 0.7 : 1,
            cursor: signedIn && canDirectAdd && addState === 'done' ? 'default' : 'pointer',
          }}
        >
          {signedIn ? (canDirectAdd ? directAddLabel : 'ADD TO COLLECTION') : 'TRACK THIS FIGURE — FREE'}
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
