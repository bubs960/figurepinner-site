'use client'

// qaFlag.ts — QA-exclusion mechanism (webaudit spec, 2026-07-17): a flagged
// team-QA browser sends zero R1 measurement signal (CF RUM beacon + funnel
// events), so internal verification browsing can never again contaminate the
// real visitor count the way it did 7/15-7/17 (both Hogan pages + McCool were
// the top RUM paths on team-QA days). Suppression, not baseline subtraction --
// exact by construction, keeps the raw numbers clean going forward instead of
// needing a statistical correction that varies by how much QA happened that day.

const QA_KEY = 'fp_qa'

// Runs once, at module evaluation -- NOT inside a component's useEffect.
// React doesn't guarantee which sibling component's effect fires first, so a
// brand-new `?qa=1` visit could have its own first funnel event slip through
// if the sync lived in one specific component's mount effect and a different
// component's effect happened to run first. Module top-level code is
// evaluated before any component renders, so every reader of isQaSession()
// -- CfBeacon, funnelClient, wherever else -- sees the flag already synced,
// regardless of mount order. `typeof window` guards this out during SSR.
if (typeof window !== 'undefined') {
  const qa = new URLSearchParams(window.location.search).get('qa')
  if (qa === '1') {
    try { window.localStorage.setItem(QA_KEY, '1') } catch {}
  } else if (qa === '0') {
    try { window.localStorage.removeItem(QA_KEY) } catch {}
  }
}

/** True when this browser profile is flagged as team QA traffic. Set via a
 *  one-time `?qa=1` visit to any page (persists in localStorage for that
 *  browser profile); `?qa=0` clears it. Browser-pane sessions: localStorage
 *  may not persist between panes -- visit any prod page with `?qa=1` first
 *  in each new pane session before browsing. */
export function isQaSession(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(QA_KEY) === '1'
  } catch {
    return false
  }
}
