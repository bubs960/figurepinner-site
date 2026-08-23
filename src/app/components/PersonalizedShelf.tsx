'use client'
// PersonalizedShelf.tsx — homepage Shelf personalization (2026-08-23,
// WEBAUDIT-TO-WEB-HOMEPAGE-A6-DECOUPLE-PRO-KILLED-2026-08-06.md's kept idea,
// unlocked by Steve's 8/20 re-entry-surface ruling once the funnel baseline
// existed). Contained experiment per that note's own scope: adapt the
// existing Shelf component, preserve the hero untouched, keep the current
// random Shelf as the empty-state fallback, no price-change badges yet.
//
// Client-side-only by design, matching this codebase's established pattern
// for user-specific content on an otherwise-static/cacheable page (same
// reasoning as AdSlot's Pro gate: homepage carries no `dynamic`/`revalidate`
// export today, so server-side personalization would cost the page its
// static optimization). A signed-in returning visitor sees the SSR default
// shelf on first paint, then it swaps to their real Vault picks once the
// fetch resolves -- same progressive-enhancement tradeoff already used by
// ReturnVisitTracker/AdSlot's Pro check.
//
// ShelfCase itself is NOT modified: its mount effect captures the DOM once
// and never reconciles afterward (see its own header comment), so it cannot
// safely receive a changed `figures` prop in place. A `key` swap forces a
// full remount instead, which is the supported way to hand it a new list.

import { useEffect, useState } from 'react'
import ShelfCase, { type ShelfFigure } from './ShelfCase'
import { hasClientClerkSession } from '@/app/_lib/clientAuth'
import { trackFunnel } from '@/app/_lib/funnelClient'

const MAX_PERSONALIZED = 8

type VaultItem = { figure_id: string }

type FigureApiResponse = {
  figure_id: string
  name: string
  brand: string
  line: string
  canonical_image_url: string | null
}

function toShelfFigure(f: FigureApiResponse): ShelfFigure | null {
  if (!f.canonical_image_url) return null // ShelfCase has no broken-image fallback -- skip rather than show a blank mount
  return {
    fid: f.figure_id,
    href: `/figure/${f.figure_id}`, // pretty-URL resolution happens server-side on visit; the id route always works
    name: f.name,
    tag: `${f.brand} ${f.line}`.trim(),
    img: f.canonical_image_url,
  }
}

export default function PersonalizedShelf({
  defaultFigures,
  priorityFirstImage,
}: {
  defaultFigures: ShelfFigure[]
  priorityFirstImage?: boolean
}) {
  const [personalized, setPersonalized] = useState<ShelfFigure[] | null>(null)

  useEffect(() => {
    if (!hasClientClerkSession()) return // anon visitor -- default shelf stands, nothing to fetch
    let cancelled = false
    ;(async () => {
      try {
        const vaultRes = await fetch('/api/v1/vault', { credentials: 'same-origin' })
        if (!vaultRes.ok) return // 401 (session cookie present but expired) or any error -- fall back silently
        const { items } = (await vaultRes.json()) as { items?: VaultItem[] }
        const fids = (items ?? []).slice(0, MAX_PERSONALIZED).map(i => i.figure_id)
        if (!fids.length) return // empty Vault -- keep the default random shelf (spec: empty-state fallback)

        const results = await Promise.all(
          fids.map(fid =>
            fetch(`/api/v1/figure/${encodeURIComponent(fid)}`, { credentials: 'same-origin' })
              .then(r => (r.ok ? r.json() : null))
              .catch(() => null) as Promise<FigureApiResponse | null>,
          ),
        )
        if (cancelled) return
        const resolved = results.filter((f): f is FigureApiResponse => f !== null).map(toShelfFigure).filter((f): f is ShelfFigure => f !== null)
        // Require the same >=6 floor the caller applies to the default pool
        // (page.tsx's `shelf.length >= 6` gate) -- a thin personalized shelf
        // would look broken/sparse where the random one never does.
        if (resolved.length >= 6) {
          setPersonalized(resolved)
          trackFunnel('personalized_shelf_shown', { figures: resolved.length })
        }
      } catch {
        // Network/parse failure -- default shelf stands, no error surfaced to the visitor.
      }
    })()
    return () => { cancelled = true }
  }, [])

  const active = personalized ?? defaultFigures

  return (
    <ShelfCase
      key={personalized ? 'personalized' : 'default'}
      figures={active}
      label={personalized ? 'Your Shelf — pick up where you left off' : undefined}
      priorityFirstImage={priorityFirstImage}
    />
  )
}
