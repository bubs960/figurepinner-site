'use client'
// vaultAdd.ts — the ONE place that POSTs to /api/vault, extracted 2026-08-23
// so FigureActions' full-featured add and HeroCtaRail's one-click hero add
// stay behaviorally identical instead of two hand-copied fetches drifting
// apart. Side effects that belong on ANY successful save regardless of
// which button triggered it -- the 'fp_has_saved' return-visit marker and
// the 'figure:claimed' event (useOwnershipStatus + ClaimPin + ClaimRitual
// all listen for it) -- live here, not duplicated per caller.

export type VaultGatePayload = {
  error: string
  message: string
  limit: number
  current: number
  upgrade_url: string
}

export type VaultWarnPayload = {
  warning?: string
  message?: string
  remaining?: number
  upgrade_url?: string
}

export type VaultAddResult =
  | { status: 'ok'; warn: VaultWarnPayload | null }
  | { status: 'duplicate' }
  | { status: 'gated'; gate: VaultGatePayload }
  | { status: 'unauthenticated' }
  | { status: 'error' }

export async function addFigureToVault(payload: {
  figure_id: string
  name: string
  brand: string
  line: string
  genre: string
  paid?: number
  condition?: string
  /** Grail Whisper enrichment copy for the Claiming Ritual, or null when the
   *  caller doesn't have one on hand (e.g. the hero CTA) -- ClaimRitual
   *  already treats a null whisper as the normal Tier-2/nothing-real-to-say
   *  case, so omitting it is a safe degradation, not a broken state. */
  whisper?: string | null
  /** Caller-supplied hero photo override, tried BEFORE the #fp-hero-photo
   *  DOM lookup -- preserves FigureActions' existing `imgSrc` prop contract
   *  for pages where that element doesn't exist or isn't reliable. */
  imgSrc?: string | null
}): Promise<VaultAddResult> {
  try {
    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        figure_id: payload.figure_id,
        name: payload.name,
        brand: payload.brand,
        line: payload.line,
        genre: payload.genre,
        paid: payload.paid ?? 0,
        condition: payload.condition ?? 'Loose',
      }),
    })

    if (res.status === 401) return { status: 'unauthenticated' }

    if (res.status === 402) {
      const gate = (await res.json()) as VaultGatePayload
      return { status: 'gated', gate }
    }

    if (res.status === 409) return { status: 'duplicate' }

    if (!res.ok) return { status: 'error' }

    const warn = ((await res.json()) as VaultWarnPayload | null) ?? null

    try {
      // The ONLY write site for 'fp_has_saved' -- a real successful save,
      // not the homepage demo shelf pin. ReturnVisitTracker reads this on a
      // later homepage landing.
      window.localStorage.setItem('fp_has_saved', '1')
    } catch {
      // Storage can throw in private-browsing contexts -- must never break the save.
    }

    try {
      const heroImg = document.getElementById('fp-hero-photo') as HTMLImageElement | null
      const rect = heroImg?.getBoundingClientRect() ?? null
      window.dispatchEvent(new CustomEvent('figure:claimed', {
        detail: {
          figureId: payload.figure_id,
          imgSrc: payload.imgSrc ?? heroImg?.currentSrc ?? heroImg?.src ?? null,
          rect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null,
          whisper: payload.whisper ?? null,
        },
      }))
    } catch {
      // Ritual trigger must never break the core save-to-vault flow.
    }

    return { status: 'ok', warn: warn?.warning ? warn : null }
  } catch {
    return { status: 'error' }
  }
}
