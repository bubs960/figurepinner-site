import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
// Import from edge-cache-policy.mjs, NOT edge-cache-entry.mjs -- the entry
// file imports .open-next/worker.js, which pulls in `cloudflare:*` runtime
// built-ins several layers down and is not importable from plain Node
// (ERR_UNSUPPORTED_ESM_URL_SCHEME). edge-cache-policy.mjs holds the same
// functions with zero Workers-runtime imports, so it can be tested directly.
import { storeSkipReason, synthesizeCacheControl } from '../edge-cache-policy.mjs'

// 2026-07-15 (webaudit/Codex-sourced fix): storeSkipReason must run against
// the ORIGINAL response, before synthesizeCacheControl can rewrite a missing
// s-maxage into a public, cacheable header. A private/no-store/no-cache
// response also has no s-maxage, so pre-fix it would qualify for that same
// synthesis, and the post-synthesis skip-check could never see the original
// private value it exists to catch. This file tests the two functions in
// the ORDER the fetch handler now calls them: skip = storeSkipReason(res),
// then res2 = skip ? res : synthesizeCacheControl(res).
//
// This is deliberately a unit test of the two pure functions, not an
// integration test of the full fetch handler (which would require mocking
// caches.default, the OpenNext handler import, and Analytics Engine) --
// the bug and the fix are both fully expressed at this level.

function htmlResponse(status, headers = {}) {
  return new Response('<html></html>', {
    status,
    headers: { 'content-type': 'text/html', ...headers },
  })
}

function req(path = '/wrestling/some-line') {
  return new Request(`https://figurepinner.com${path}`)
}

/** Simulates the fetch handler's post-fix call order. */
function simulateHandlerOrdering(response, request) {
  const skip = storeSkipReason(response, request)
  const res2 = skip ? response : synthesizeCacheControl(response, request)
  return { skip, res2 }
}

describe('edge cache ordering fix — skip-check runs against the ORIGINAL response', () => {
  test('private HTML: no cache.put (skip fires), original cache-control header unchanged', () => {
    const original = htmlResponse(200, { 'cache-control': 'private' })
    const { skip, res2 } = simulateHandlerOrdering(original, req())
    assert.equal(skip, 'cc-private', 'private response must be skipped from caching')
    assert.equal(res2.headers.get('cache-control'), 'private', 'skip path must return the ORIGINAL header, not a synthesized one')
  })

  test('no-store HTML: no cache.put, original header unchanged', () => {
    const original = htmlResponse(200, { 'cache-control': 'no-store' })
    const { skip, res2 } = simulateHandlerOrdering(original, req())
    assert.equal(skip, 'cc-private')
    assert.equal(res2.headers.get('cache-control'), 'no-store')
  })

  test('no-cache HTML: no cache.put, original header unchanged', () => {
    const original = htmlResponse(200, { 'cache-control': 'no-cache' })
    const { skip, res2 } = simulateHandlerOrdering(original, req())
    assert.equal(skip, 'cc-private')
    assert.equal(res2.headers.get('cache-control'), 'no-cache')
  })

  test('Set-Cookie HTML (no explicit cache-control): no cache.put', () => {
    const original = htmlResponse(200, { 'set-cookie': '__session=abc123; Path=/' })
    const { skip, res2 } = simulateHandlerOrdering(original, req())
    assert.equal(skip, 'set-cookie', 'set-cookie must skip regardless of cache-control value')
    assert.equal(res2.headers.get('set-cookie'), '__session=abc123; Path=/', 'skip path must not mutate the response at all')
  })

  test('THE BUG THIS FIXES: private HTML with no explicit s-maxage would previously synthesize a public header before the skip check ever saw "private"', () => {
    // Reproduce the pre-fix ORDER explicitly, to document why the fix matters
    // even though the fix itself just changes call order, not the functions.
    const original = htmlResponse(200, { 'cache-control': 'private' })
    const preFixRewritten = synthesizeCacheControl(original, req())
    // This is the defect: synthesis alone, with no request-side guard, turns
    // "private" into a public cacheable header because it has no s-maxage.
    assert.equal(preFixRewritten.headers.get('cache-control'), 'public, s-maxage=3600, stale-while-revalidate=86400',
      'sanity check: confirms synthesizeCacheControl alone WOULD rewrite a private response -- this is exactly why skip-check order matters')
    // The fix's actual behavior (checked above) never lets this rewritten
    // response reach storeSkipReason -- skip is computed from `original`.
  })

  test('allow-listed public figure route, no explicit s-maxage: cache put still happens with synthesized header (this must NOT regress)', () => {
    const original = htmlResponse(200, {}) // no cache-control at all -- the normal ISR/ OpenNext case
    const { skip, res2 } = simulateHandlerOrdering(original, req('/figure/fp_wrestling_example_123abc'))
    assert.equal(skip, null, 'a genuinely public response with no cache-control must NOT be skipped')
    // 2026-09-02: the raw /figure/:id shape synthesizes the figure route's own 24h
    // (revalidate=86400), not the generic hour -- the 9,973 sitemap-submitted
    // /figure/fp_* URLs were caching 1/24th as long as intended (webaudit hub
    // deep-dive, breakthrough 1).
    assert.equal(res2.headers.get('cache-control'), 'public, s-maxage=86400, stale-while-revalidate=86400',
      'synthesis must still run for real public responses -- and at the raw figure shape it must be the 24h figure TTL')
  })

  test('2026-09-02: only the raw /figure/:id shape gets the 24h TTL; generic public HTML without s-maxage (hubs, pretty paths) keeps the hour', () => {
    const hub = simulateHandlerOrdering(htmlResponse(200, {}), req('/wrestling/elite'))
    assert.equal(hub.skip, null)
    assert.equal(hub.res2.headers.get('cache-control'), 'public, s-maxage=3600, stale-while-revalidate=86400',
      'a hub without s-maxage stays on the generic hour (its own revalidate reaches the edge as s-maxage in production)')
    const pretty = simulateHandlerOrdering(htmlResponse(200, {}), req('/wrestling/elite/cody-rhodes'))
    assert.equal(pretty.res2.headers.get('cache-control'), 'public, s-maxage=3600, stale-while-revalidate=86400',
      'the 3-segment pretty figure path is not the raw shape and must not inherit the 24h synthesis')
  })

  test('already-public HTML with an explicit positive s-maxage: passes through unchanged either way', () => {
    const original = htmlResponse(200, { 'cache-control': 'public, s-maxage=1800' })
    const { skip, res2 } = simulateHandlerOrdering(original, req())
    assert.equal(skip, null)
    assert.equal(res2.headers.get('cache-control'), 'public, s-maxage=1800', 'already-valid s-maxage must not be touched by synthesis')
  })

  test('404 public HTML route: NOT_FOUND_TTL synthesis behavior unchanged (not skipped, gets the 404-specific cache-control)', () => {
    const original = htmlResponse(404, {})
    const { skip, res2 } = simulateHandlerOrdering(original, req('/figure/does-not-exist'))
    assert.equal(skip, null, 'a public 404 HTML page is a legitimate cache candidate (isPublicHtmlNotFound path), not a skip')
    assert.match(res2.headers.get('cache-control'), /s-maxage=900/, '404 pages get the shorter NOT_FOUND_TTL-shaped synthesized header')
  })

  test('non-200, non-404 status (e.g. 500) on a route without isPublicHtmlNotFound coverage: skipped', () => {
    const original = htmlResponse(500, {})
    const { skip } = simulateHandlerOrdering(original, req('/some/route'))
    assert.equal(skip, 'status', 'non-200/404 status must be skipped from caching')
  })

  test('KV-consolidation known bug (2026-08-07): private HTML at the raw /figure/:id shape is NOT skipped -- gets synthesized to public, same as a genuinely public figure page', () => {
    const original = htmlResponse(200, { 'cache-control': 'private, no-cache, no-store, max-age=0, must-revalidate' })
    const { skip, res2 } = simulateHandlerOrdering(original, req('/figure/fp_wrestling_mattel_elite-legends_30_michelle-mccool_51ea22'))
    assert.equal(skip, null, 'the raw /figure/:id shape must be allowed through despite a private header (known OpenNext rewrite-vs-ISR bug, not a real privacy signal)')
    assert.equal(res2.headers.get('cache-control'), 'public, s-maxage=86400, stale-while-revalidate=86400',
      '2026-09-02: the allowed-through raw figure shape gets the 24h figure TTL, not the generic hour')
  })

  test('KV-consolidation allowance stays scoped: the 3-segment pretty-path figure route is UNAFFECTED (private there still skips, as it should)', () => {
    const original = htmlResponse(200, { 'cache-control': 'private' })
    const { skip, res2 } = simulateHandlerOrdering(original, req('/wrestling/elite-legends/michelle-mccool'))
    assert.equal(skip, 'cc-private', 'the allowance must only apply to the raw /figure/:id shape, never the pretty-path route')
    assert.equal(res2.headers.get('cache-control'), 'private')
  })

  test('KV-consolidation allowance stays scoped: set-cookie on the /figure/:id shape still skips (auth gate runs first, unaffected)', () => {
    const original = htmlResponse(200, { 'set-cookie': '__session=abc123; Path=/', 'cache-control': 'private' })
    const { skip, res2 } = simulateHandlerOrdering(original, req('/figure/fp_wrestling_mattel_elite-legends_30_michelle-mccool_51ea22'))
    assert.equal(skip, 'set-cookie', 'set-cookie must still take priority over the known-bug allowance')
    assert.equal(res2.headers.get('set-cookie'), '__session=abc123; Path=/')
  })

  test('non-HTML content-type is never touched by synthesis (API JSON routes stay as OpenNext returns them)', () => {
    const original = new Response('{}', { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'private' } })
    const { skip, res2 } = simulateHandlerOrdering(original, req('/api/some-endpoint'))
    assert.equal(skip, 'cc-private')
    assert.equal(res2.headers.get('cache-control'), 'private', 'non-HTML is a skip-check no-op either way, but must still preserve the original header')
  })
})
