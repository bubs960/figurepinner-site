import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isKbPageRoute, shieldOrigin500, storeSkipReason, ORIGIN_SHIELD_RETRY_AFTER } from '../edge-cache-policy.mjs'
import { genreSlugForFandom } from '../src/data/kbTypes.ts'

// Release M (2026-09-04): the origin-500 shield must fire ONLY on KB page
// routes. The failure this guards against was named in the plan's grounding
// pass: a bare segment-count match would have caught /guides/[slug],
// /guides/red-white-blue, /about, /deals -- real routes at the same depths.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const kbStats = JSON.parse(readFileSync(path.join(ROOT, 'src/data/kb-stats.generated.json'), 'utf8'))
const HUB_ONLY_SLUGS = ['neca', 'dungeons-dragons'] // mirrors edge-cache-entry.mjs (not importable here -- cloudflare:* imports)
const GENRES = new Set([...Object.keys(kbStats.fandoms).map(genreSlugForFandom), ...HUB_ONLY_SLUGS])

function entryHubOnlySlugs() {
  const src = readFileSync(path.join(ROOT, 'edge-cache-entry.mjs'), 'utf8')
  const m = src.match(/export const HUB_ONLY_SLUGS = \[([^\]]*)\]/)
  return [...(m?.[1] ?? '').matchAll(/'([a-z0-9-]+)'/g)].map(x => x[1])
}

function genreHubLabelKeys() {
  const src = readFileSync(path.join(ROOT, 'src/lib/genreFigures.ts'), 'utf8')
  const block = src.match(/export const GENRE_HUB_LABELS[^{]*\{([\s\S]*?)\n\}/)
  return [...(block?.[1] ?? '').matchAll(/^\s+'?([a-z0-9-]+)'?\s*:/gm)].map(m => m[1])
}

const req = p => new Request(`https://figurepinner.com${p}`)
const r500 = () => new Response('<html>Internal Server Error</html>', { status: 500, headers: { 'content-type': 'text/html' } })

describe('origin-500 shield: route allowlist', () => {
  test('the genre-slug set built from kb-stats covers every live genre hub', () => {
    for (const slug of genreHubLabelKeys()) assert.ok(GENRES.has(slug), `GENRE_HUB_LABELS key "${slug}" missing from the shield allowlist`)
  })

  test('this test mirrors the entry module HUB_ONLY_SLUGS list exactly', () => {
    assert.deepEqual(entryHubOnlySlugs(), HUB_ONLY_SLUGS)
  })

  test('KB page shapes match', () => {
    for (const p of [
      '/figure/fp_wrestling_hasbro_wwf-hasbro_5_hulk-hogan_1a3137',
      '/figure/fp_wrestling_hasbro_wwf-hasbro_5_hulk-hogan_1a3137/opengraph-image',
      '/wrestling', '/marvel', '/gijoe', '/neca',
      '/wrestling/elite', '/marvel/marvel-legends/page/2',
      '/wrestling/character/hulk-hogan', '/wrestling/character/hulk-hogan/page/2',
      '/wrestling/wwf-hasbro/hulk-hogan', '/wrestling/wwf-hasbro/hulk-hogan/opengraph-image',
    ]) assert.equal(isKbPageRoute(p, GENRES), true, p)
  })

  test('static, guide, API, auth and unknown-genre shapes never match', () => {
    for (const p of [
      '/', '/guides', '/guides/marvel-legends-baf-guide', '/guides/red-white-blue',
      '/about', '/deals', '/search', '/today', '/scan', '/coming-soon', '/alerts', '/shelf',
      '/app', '/app/vault', '/admin', '/admin/health', '/api/healthz', '/api/v1/price-check',
      '/sign-in', '/_next/static/x.js',
      '/foo/bar', '/foo/bar/baz', '/wrestling/elite/page/x', '/wrestling/elite/page/0',
      '/wrestling/character/hulk-hogan/extra', '/wrestling/elite/hulk/hogan/deep',
      '/figure', '/figure/a/b',
    ]) assert.equal(isKbPageRoute(p, GENRES), false, p)
  })
})

describe('origin-500 shield: response rewrite', () => {
  test('a 500 on a figure page becomes 503 / no-store / Retry-After', async () => {
    const out = shieldOrigin500(r500(), req('/wrestling/wwf-hasbro/hulk-hogan'), GENRES)
    assert.equal(out.status, 503)
    assert.equal(out.headers.get('cache-control'), 'no-store')
    assert.equal(out.headers.get('retry-after'), String(ORIGIN_SHIELD_RETRY_AFTER))
    assert.equal(out.headers.get('x-fp-shield'), 'origin-500')
    assert.match(await out.text(), /briefly unavailable/)
  })

  test('the 503 is refused by the edge store decision (never cached)', () => {
    const out = shieldOrigin500(r500(), req('/marvel/marvel-legends'), GENRES)
    assert.ok(storeSkipReason(out, req('/marvel/marvel-legends')), 'a shielded 503 must carry a skip reason')
  })

  test('a 500 on a non-KB route passes through untouched', () => {
    const original = r500()
    assert.equal(shieldOrigin500(original, req('/guides/marvel-legends-baf-guide'), GENRES), original)
    assert.equal(shieldOrigin500(original, req('/api/healthz'), GENRES), original)
  })

  test('non-500 responses on KB routes pass through untouched', () => {
    for (const status of [200, 301, 404, 429, 503]) {
      const original = new Response('x', { status })
      assert.equal(shieldOrigin500(original, req('/wrestling/elite'), GENRES), original, String(status))
    }
  })
})
