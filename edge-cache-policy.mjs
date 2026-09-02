/**
 * edge-cache-policy.mjs — pure cache-decision logic for edge-cache-entry.mjs,
 * split out 2026-07-15 so it can be unit-tested in plain Node.
 *
 * edge-cache-entry.mjs imports .open-next/worker.js, which imports
 * `cloudflare:*` runtime built-ins (workers-runtime-only schemes) several
 * layers down. That makes edge-cache-entry.mjs itself unimportable from a
 * plain `node --test` run (ERR_UNSUPPORTED_ESM_URL_SCHEME) -- confirmed both
 * in the sandbox used to build this fix AND on Steve's machine, so it's a
 * real constraint, not an environment fluke. This module has NO Workers
 * imports and operates only on standard Request/Response, so it can be
 * imported directly by tests/edgeCacheOrdering.test.mjs without dragging in
 * the OpenNext worker at all.
 */

const HTML_TTL_CAP = 86400
export const NOT_FOUND_TTL = 900

/** Positive s-maxage from a Cache-Control header, else 0. */
export function sharedTtl(cc) {
  const m = /s-maxage=(\d+)/.exec(cc ?? '')
  return m ? parseInt(m[1], 10) : 0
}

/**
 * Returns null if cacheable, else a short skip reason (S17 observability --
 * exposed as `x-fp-edge-skip` so a silent store-refusal is diagnosable from
 * any browser instead of requiring a deploy cycle per hypothesis).
 */
export function isPublicHtmlNotFound(response, request) {
  if (response.status !== 404) return false
  const ct = response.headers.get('content-type') ?? ''
  if (!ct.includes('text/html')) return false
  const { pathname } = new URL(request.url)
  if (pathname.startsWith('/api/')) return false
  return true
}

// KV-consolidation known-bug allowance (2026-08-07): middleware.ts rewrites
// /figure/:id -> a figure's pretty path when one exists (rewriteFigureIdToPrettyPath,
// added 2026-07-22 to make both URL shapes share one cache entry). The REWRITTEN
// render comes back from OpenNext as Cache-Control: private/no-store/no-cache
// instead of inheriting the pretty page's real public s-maxage -- verified live,
// 100% reproducible, zero relation to auth (confirmed with cookie-free requests).
// The identical content hit directly at its pretty URL caches correctly, so this
// is an OpenNext rewrite-vs-ISR quirk, not a genuine privacy signal: figure detail
// pages never depend on auth/session state at render time (middleware.ts bypasses
// Clerk entirely for this exact route class, Data Defense Layer 2). Scoped to
// EXACTLY the raw-ID shape (2 segments, first is "figure") so it can never touch
// the pretty-path route itself (already correct) or any other route -- the
// set-cookie gate above still runs first and is untouched by this allowance.
// Full investigation: board/OPEN-ITEMS-web.md (2026-08-07),
// WEB-TO-STANDALONE-DAILY-HEALTH-CHECK6-FALSE-DIAGNOSIS-2026-08-07.md.
function isKnownSafeDespitePrivate(request) {
  const { pathname } = new URL(request.url)
  const segments = pathname.split('/').filter(Boolean)
  return segments[0] === 'figure' && segments.length === 2
}

export function storeSkipReason(response, request) {
  if (response.headers.has('set-cookie')) return 'set-cookie'
  const cc = response.headers.get('cache-control') ?? ''
  if (/private|no-store|no-cache/i.test(cc) && !isKnownSafeDespitePrivate(request)) return 'cc-private'
  if (isPublicHtmlNotFound(response, request)) return null
  if (response.status !== 200) return 'status'
  // s-maxage missing on public HTML is synthesized below -- not a skip reason
  return null
}

export function storeTtl(response, request) {
  if (isPublicHtmlNotFound(response, request)) return NOT_FOUND_TTL
  const isHtml = (response.headers.get('content-type') ?? '').includes('text/html')
  return Math.min(sharedTtl(response.headers.get('cache-control')), isHtml ? HTML_TTL_CAP : Infinity)
}

/** Synthesize s-maxage on responses that are public but missing one (e.g. OpenNext
 *  emits no s-maxage on some ISR routes). Only applied to HTML pages on non-API paths. */
export function synthesizeCacheControl(response, request) {
  const ct = response.headers.get('content-type') ?? ''
  if (!ct.includes('text/html')) return response
  const { pathname } = new URL(request.url)
  if (pathname.startsWith('/api/')) return response
  const cc = response.headers.get('cache-control') ?? ''
  if (sharedTtl(cc) > 0) return response // already has s-maxage, leave it
  const out = new Response(response.body, response)
  if (response.status === 404) {
    out.headers.set('cache-control', `public, s-maxage=${NOT_FOUND_TTL}, stale-while-revalidate=3600`)
  } else {
    // 2026-09-02 (webaudit hub deep-dive, breakthrough 1): the raw-fid /figure/:id
    // shape is served through the KV-consolidation rewrite (middleware.ts), whose
    // render comes back `private` with no s-maxage, so it landed here and got the
    // generic hour even though figure/[figure_id]/page.tsx asks for revalidate=86400
    // -- the 9,973 sitemap-submitted /figure/fp_* URLs cached 1/24th as long as
    // intended. Same allowance predicate as the store decision, so the scope is
    // exactly that shape; every other public HTML page keeps the generic hour.
    const ttl = isKnownSafeDespitePrivate(request) ? HTML_TTL_CAP : 3600
    out.headers.set('cache-control', `public, s-maxage=${ttl}, stale-while-revalidate=86400`)
  }
  return out
}
