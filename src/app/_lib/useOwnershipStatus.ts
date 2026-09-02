'use client'

// useOwnershipStatus — single source of truth for "does the signed-in user
// already own this figure", shared by FigureActions (on-load "already
// owned" state) and ClaimPin (the ambient brass corner pin). A same-figure
// 'figure:claimed' event (dispatched by FigureActions right after a
// successful vault-add) flips the local flag instantly so nothing waits on
// a second round-trip.
//
// Anonymous visitors: NO fetch fires at all (webaudit FIX-1, 2026-07-12
// verdict) — figure pages are ~99% anonymous/bot traffic, and a guaranteed
// -401 request per consumer per view is dead weight on the exact surface
// already being shaved for cost/perf. Gated on the Clerk session-hint
// cookie (useSessionHint, 2026-09-03) — NOT on Clerk's useUser(): public
// pages no longer mount ClerkProvider at all (webaudit Clerk-off finding),
// and the hint is false until the post-hydration effect, so nothing fires
// early. A stale hint costs one 401, which resolves to owned=false.
//
// Two consumers on one figure page (ClaimPin + FigureActions) previously
// meant two independent fetches per view (webaudit FIX-2). A module-level
// promise cache dedupes concurrent AND repeat fetches for the same
// figure_id within the page session. A claim also updates the cache (not
// just each consumer's local state) so a later remount of the same
// figure_id — e.g. a back-button revisit — doesn't read a stale pre-claim
// "false".

import { useEffect, useState } from 'react'
import { useSessionHint } from './sessionHint'

const statusCache = new Map<string, Promise<boolean>>()

function fetchOwnership(figureId: string): Promise<boolean> {
  const cached = statusCache.get(figureId)
  if (cached) return cached
  const promise = fetch(`/api/vault/status?figure_id=${encodeURIComponent(figureId)}`)
    .then(res => (res.ok ? res.json() : { owned: false }))
    .then((data: { owned?: boolean }) => Boolean(data.owned))
    .catch(() => false)
  statusCache.set(figureId, promise)
  return promise
}

export function useOwnershipStatus(figureId: string): { owned: boolean; loading: boolean } {
  const isSignedIn = useSessionHint()
  const [owned, setOwned] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false)
      return
    }

    let cancelled = false
    fetchOwnership(figureId)
      .then(result => {
        if (!cancelled) setOwned(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    function onClaimed(event: Event) {
      const detail = (event as CustomEvent<{ figureId?: string }>).detail
      if (detail?.figureId === figureId) {
        setOwned(true)
        statusCache.set(figureId, Promise.resolve(true))
      }
    }
    window.addEventListener('figure:claimed', onClaimed)

    return () => {
      cancelled = true
      window.removeEventListener('figure:claimed', onClaimed)
    }
  }, [figureId, isSignedIn])

  return { owned, loading }
}
