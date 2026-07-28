'use client'

import { useEffect, useRef, useState } from 'react'
import { hasClientClerkSession } from '@/app/_lib/clientAuth'
import { trackFunnel } from '@/app/_lib/funnelClient'

/**
 * AdSlot — Adsterra iframe banner unit (AD STANDARD v2, 2026-07-19; iframe
 * namespace-isolation fix 2026-07-19 same day (separate `window` scope per
 * mount), see WEBAUDIT-TO-WEB-ADSLOT-COLLAPSE-BUG-LIVE-2026-07-19.md).
 *
 * SANDBOXED (2026-07-27): the iframe below carries
 * `sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"` and
 * deliberately OMITS `allow-same-origin`. Root cause + evidence:
 * WEB-ANDROID-REDIRECT-ROOTCAUSE-2026-07-26.md §4. A `srcDoc` iframe with no
 * sandbox inherits the PARENT's origin, so `invoke.js` ran same-origin with
 * figurepinner.com and could read our DOM/cookies and set
 * `window.top.location` -- verified live pre-fix (`sameOrigin: true`,
 * `canReachTop: true`). The sandbox strips exactly that: scripts still run
 * (`allow-scripts`) and a click-through popup still opens normally
 * (`allow-popups` + `allow-popups-to-escape-sandbox`, so the POPUP itself
 * isn't also sandboxed), but the frame is now a real cross-origin boundary.
 * This is also why the privacy-page copy calling these ads "a cross-origin
 * iframe FigurePinner does not control" is accurate again -- it was wrong
 * about the OUTER frame before this fix (right about the inner one Adsterra
 * injects), and needed no edit once the outer frame actually became one.
 *
 * Consequence, not a side effect: sandboxing makes `contentDocument` return
 * null cross-origin, so the old fill-detection (read the injected markup
 * directly) went with it -- see the fill-detection effect below for what
 * replaced it and why.
 *
 * Usage:
 *   <AdSlot slot="adsterra-banner" /> // 300×250, live, no approval needed
 *
 * AdSense is not used on this site (format ruling: Adsterra iframe banners
 * only). If AdSense is ever revisited, it re-enters through the placement
 * standard doc, not a silent branch here.
 *
 * Pro = ad-free. This is a client component, so the host page stays cacheable:
 * the Pro check runs in the browser after hydration through /api/v1/me instead
 * of requiring Clerk context in the public page tree. For Pro users we render a
 * zero-height nothing — no ad, no reserved gap. We fail toward ad-free while
 * the check is pending so a Pro user never sees an ad flash before it's removed.
 *
 * Frame reserves config.height immediately (assumes fill — matches the common
 * case with zero layout shift, since 'pending' and 'filled' render identically)
 * and collapses the WHOLE unit (frame + label) if no iframe appears within
 * FILL_TIMEOUT_MS (AD STANDARD v2 Phase 2's "reserve + collapse-when-unfilled"
 * requirement, merged with figurepinner's existing Pro-gate/funnel tracking,
 * which are both untouched below).
 *
 * The ad markup (atOptions + invoke.js) renders inside a `srcDoc` iframe we
 * own, NOT via next/script. Two reasons, both root-caused live in prod:
 * (1) next/script's lazyOnload strategy portals its <script> tags to the end
 * of <body>, decoupled from JSX position, so Adsterra's injected iframe
 * landed as a body-root sibling — never inside our reserved frame, and always
 * past <footer>, i.e. real ads rendered but were nearly unreachable by scroll.
 * (2) Both figure-page AdSlot instances shared the same next/script id, so
 * Next's page-wide script dedup silently dropped the second instance's tags
 * entirely — one of the two "ad units" never had a chance to fill. A `srcDoc`
 * iframe sidesteps both regardless of sandboxing: the ad markup parses as
 * part of THIS iframe's own initial document (so injection lands inside it,
 * at the position we control), and each AdSlot mount gets its own iframe with
 * its own `window`/`atOptions` scope, so there's no cross-instance dedup or
 * global collision to worry about. (It was same-origin, not just its own
 * iframe, until the sandboxing above — see that note for why and what changed.)
 */

const FILL_TIMEOUT_MS = 4000

type SlotConfig = {
  width: number
  height: number
  label: string
  key: string
}

const SLOT_CONFIG: Record<string, SlotConfig> = {
  'adsterra-banner': { width: 300, height: 250, label: 'Adsterra Banner (300×250)', key: '5758f0cf21092928ed5d04198e165847' },
}

type Props = {
  slot: keyof typeof SLOT_CONFIG
  className?: string
}

export default function AdSlot({ slot, className }: Props) {
  const [proState, setProState] = useState<'loading' | 'pro' | 'free'>('loading')
  const [adState, setAdState] = useState<'pending' | 'filled' | 'unfilled'>('pending')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const config = SLOT_CONFIG[slot]

  useEffect(() => {
    let cancelled = false
    if (!hasClientClerkSession()) {
      setProState('free')
      return () => { cancelled = true }
    }
    fetch('/api/v1/me', { credentials: 'same-origin' })
      .then(async res => {
        if (cancelled) return
        if (!res.ok) {
          setProState('free')
          return
        }
        const data = await res.json() as { isPro?: boolean }
        setProState(data.isPro ? 'pro' : 'free')
      })
      .catch(() => {
        if (!cancelled) setProState('free')
      })
    return () => { cancelled = true }
  }, [])

  // Ad-side instrumentation (Bid Check affiliate-vs-ad measurement, 2026-07-05):
  // ebay_exit already tracks affiliate exits; nothing fired for ad exposure
  // until now. This fires once per real render of a live (non-placeholder)
  // ad unit — the same page-view denominator ('landing') lets both be
  // compared per-visit. Click-through can't be tracked here: Adsterra's
  // creative runs inside a cross-origin iframe this page doesn't control.
  useEffect(() => {
    if (proState !== 'free') return
    if (slot !== 'adsterra-banner') return
    trackFunnel('ad_impression', { target: slot })
  }, [proState, slot])

  // Reserve + collapse-when-unfilled (AD STANDARD v2 Phase 2).
  //
  // Fill signal, REPLACED 2026-07-27 when the iframe was sandboxed (see file
  // header): the old version read `iframeEl.contentDocument` and watched for
  // Adsterra's injected ad iframe to appear via MutationObserver. Sandboxing
  // makes contentDocument return null cross-origin (the DOM spec's own
  // behavior for a browsing context that's no longer same-origin-domain with
  // the accessor) -- so that path would silently never fire, and the ORIGINAL
  // logic below it would then read every ad as permanently 'pending' and
  // collapse ALL of them to 'unfilled' after FILL_TIMEOUT_MS. That is a much
  // worse failure mode than the one being fixed: it would have hidden 100% of
  // ad impressions, not zero, the moment the sandbox landed.
  //
  // Replacement: the outer iframe's own native `load` event, which still
  // fires normally regardless of cross-origin-ness (it's dispatched by the
  // PARENT's browsing context, not something the sandboxed document could
  // suppress) once the srcDoc document and its synchronous `<script src>`
  // (invoke.js itself) finish loading. This does NOT prove the ad's actual
  // creative rendered -- that can still happen asynchronously after invoke.js
  // runs its own further network calls, invisible to us now -- so it is
  // deliberately optimistic: biased toward 'filled' rather than 'unfilled',
  // because a false unfilled-collapse hides a real, paying impression, while
  // false filled-optimism only reserves space an ad was going to fill anyway
  // in the overwhelming common case. Scoped as "zero revenue cost" in
  // WEB-ANDROID-REDIRECT-ROOTCAUSE-2026-07-26.md §7.1 on exactly that basis.
  //
  // FILL_TIMEOUT_MS is kept as a safety net for the one failure mode this
  // signal still can't see coming: the srcDoc document never loading at all
  // (the iframe itself failing outright) -- not "the ad network chose not to
  // serve a creative this impression," which real ad networks do sometimes
  // and which this can no longer distinguish from a normal fill.
  useEffect(() => {
    if (proState !== 'free') return
    const iframeEl = iframeRef.current
    if (!iframeEl) return

    const onLoad = () => setAdState('filled')
    iframeEl.addEventListener('load', onLoad)

    const timeout = setTimeout(() => {
      setAdState(current => (current === 'pending' ? 'unfilled' : current))
    }, FILL_TIMEOUT_MS)

    return () => {
      iframeEl.removeEventListener('load', onLoad)
      clearTimeout(timeout)
    }
  }, [proState])

  if (!config) return null

  // Pro = ad-free. Hide for confirmed Pro users, AND while auth is still loading
  // (fail toward ad-free so a Pro user never sees a flash of an ad). Signed-out
  // and free users fall through to the normal ad/placeholder render.
  if (proState === 'loading' || proState === 'pro') return null

  // Genuinely unfilled after the grace period — collapse the whole unit
  // (label included), not just the frame, so nothing is left floating over
  // empty space.
  if (adState === 'unfilled') return null

  // Self-contained HTML document for the srcDoc iframe: atOptions + invoke.js
  // parse as part of THIS document's initial load, so Adsterra's injection
  // happens at the right place and in its own isolated window scope.
  const adHtml = '<!DOCTYPE html><html><head><style>html,body{margin:0;padding:0;overflow:hidden;}</style></head><body>' +
    `<script>atOptions = { 'key': '${config.key}', 'format': 'iframe', 'height': ${config.height}, 'width': ${config.width}, 'params': {} };</script>` +
    `<script src="https://www.highperformanceformat.com/${config.key}/invoke.js"></script>` +
    '</body></html>'

  // Adsterra Banner (300×250) — live, no approval needed.
  return (
    <div className={className} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem 0' }}>
      <span style={{
        fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--dim)', fontFamily: 'var(--font-ui)', marginBottom: '4px',
      }}>Advertisement</span>
      <div
        style={{
          width: `min(${config.width}px, 100%)`,
          height: config.height,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <iframe
          ref={iframeRef}
          srcDoc={adHtml}
          title="Advertisement"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          style={{ width: config.width, height: config.height, border: 'none', maxWidth: '100%' }}
        />
      </div>
    </div>
  )
}
