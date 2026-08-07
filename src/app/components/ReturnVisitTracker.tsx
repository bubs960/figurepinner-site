'use client'
// Fires 'return_visit_after_save' when someone who has ever completed a real
// Vault save (marker written by FigureActions.tsx on its res.ok branch, NOT
// the homepage demo shelf pin) lands on the homepage again. Homepage-only —
// mount this in page.tsx, not the root layout, so it doesn't fire on every
// route (webaudit ask, 2026-08-06: this + the two funnel events above are the
// baseline that validates or kills the homepage-hybrid hypothesis).
//
// Known imprecision, accepted rather than engineered around: a save
// immediately followed by navigating back to '/' in the SAME session also
// counts as a "return visit" here. Session-boundary detection would add real
// complexity for a rare edge case; the metric is about repeat/brand-recall
// traffic in aggregate, not a single-visit guarantee.

import { useEffect } from 'react'
import { trackFunnel } from '@/app/_lib/funnelClient'

export default function ReturnVisitTracker() {
  useEffect(() => {
    try {
      if (window.localStorage.getItem('fp_has_saved')) {
        trackFunnel('return_visit_after_save')
      }
    } catch {
      // Storage access can throw in private-browsing contexts — no-op.
    }
  }, [])

  return null
}
