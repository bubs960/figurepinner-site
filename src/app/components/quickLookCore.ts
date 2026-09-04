/**
 * quickLookCore — the pure, shared half of the quick-look hover card.
 *
 * Release N (2026-09-04, speed program S3): lifted out of QuickLookAnchor.tsx
 * so two consumers can share one set of rules without one importing the
 * other's React surface:
 *   • useQuickLook / QuickLookAnchor (per-element hook — search dropdown,
 *     /search cards, figure-page rails) — unchanged behaviour;
 *   • QuickLookDelegate (ONE per page — character hub) — the same rules
 *     driven from a single document-level listener instead of a client
 *     component per card.
 *
 * Nothing here touches React. `computeCardPosition` is a pure function of
 * the anchor rect and the viewport so it can be unit-tested in plain Node
 * (tests/quickLookCore.test.mjs); the viewport-clamp rules it encodes are the
 * S54/S56 fixes (top-of-viewport clipping, beside-not-over placement, short
 * viewport floor) and must not drift between the two consumers.
 */

export type QuickLookPrice = { median: number | null; soldCount: number; stat?: 'median' | 'avg' }

export const CARD_W = 340
export const CARD_EST_H = 470 // pic 340 + clamped caption + padding — viewport clamp basis
export const EDGE = 12        // minimum gap to every viewport edge
export const HOVER_INTENT_MS = 450 // S56: 170 ms fired while merely scanning

/**
 * Where the card goes for an anchor at `r` in a viewport of `innerWidth` ×
 * `innerHeight`. Horizontal: BESIDE the anchor (right; flip left at the
 * edge; clamp last). Vertical: centred on the anchor, clamped so the card
 * never leaves the viewport, with an outer floor at EDGE for short viewports
 * where the inner clamp bounds invert.
 */
export function computeCardPosition(
  r: { top: number; left: number; right: number; height: number },
  innerWidth: number,
  innerHeight: number,
): { top: number; left: number } {
  const GAP = 14
  const fitsRight = r.right + GAP + CARD_W + EDGE <= innerWidth
  const left = Math.min(
    Math.max(EDGE, fitsRight ? r.right + GAP : r.left - GAP - CARD_W),
    innerWidth - CARD_W - EDGE,
  )
  const centerY = r.top + r.height / 2
  const half = CARD_EST_H / 2
  const top = Math.round(
    Math.max(
      EDGE,
      Math.min(Math.max(centerY, half + EDGE), innerHeight - half - EDGE) - half,
    ),
  )
  return { top, left: Math.round(left) }
}

/**
 * Same gate as HeroSearch's isDesktopPointer(): fine pointer AND no touch
 * capability at all. matchMedia alone passes hybrid (touch-screen laptop)
 * devices, where a hover card can ambush a touch interaction — the exact
 * gate shape the 7/25 search-takeover bug came from (7/26 overlay audit).
 * Do not loosen.
 */
export function desktopPointer(): boolean {
  if (typeof window === 'undefined') return false
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  return hasFinePointer && !hasTouch
}

// Module-wide so hovering the same figure twice (or in two rails, or on two
// consumers) never refetches. `null` doubles as the in-flight marker.
const priceCache = new Map<string, QuickLookPrice | null>()

/** Cached value if known (null while in flight), undefined if never asked. */
export function peekQuickLookPrice(figureId: string): QuickLookPrice | null | undefined {
  return priceCache.get(figureId)
}

/**
 * Lazy per-figure median from the edge-cached sparklines route. Resolves the
 * price (or null when the figure has no snapshot); a network failure clears
 * the in-flight marker so the next hover retries.
 */
export function fetchQuickLookPrice(figureId: string): Promise<QuickLookPrice | null> {
  const known = priceCache.get(figureId)
  if (known !== undefined && known !== null) return Promise.resolve(known)
  priceCache.set(figureId, null) // in-flight marker
  return fetch(`/api/sparklines?ids=${encodeURIComponent(figureId)}`)
    .then(res => (res.ok ? res.json() : {}))
    .then((data: Record<string, QuickLookPrice>) => {
      const p = data[figureId] ?? null
      priceCache.set(figureId, p)
      return p
    })
    .catch(() => { priceCache.delete(figureId); return null })
}
