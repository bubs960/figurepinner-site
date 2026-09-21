import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import kvIncrementalCacheWithTtl, {
  PAGE_CACHE_TTL_SECONDS,
  FETCH_CACHE_TTL_SECONDS,
  ttlSecondsForCacheType,
  NOT_FOUND_CACHE_TTL_SECONDS,
  isNotFoundPageEntry,
} from '../src/lib/kv-incremental-cache-ttl.ts'

// KV-growth fix guard (standalone work order, 2026-07-19): the vendor
// @opennextjs/cloudflare KVIncrementalCache never passed a TTL on kv.put(),
// so every ISR/fetch cache entry lived in FP_KV forever -- the entire
// reason the namespace crossed Steve's 15,000-key escalation bar the same
// day. This is the "how do we know this doesn't silently regress in three
// months" test Steve's work order explicitly asked for: it fails loudly if
// a future refactor, a dependency bump, or someone reverting to the raw
// vendor import ever drops the TTL again.

const CLOUDFLARE_CONTEXT_SYMBOL = Symbol.for('__cloudflare-context__')

// async + await: the fake context must stay installed until the callback's own awaits finish
// (a bare `return fn(calls)` let `finally` reset it after the first await -- invisible while every
// test made a single set(), broken for a test that makes several).
async function withFakeKv(kvOverrides, fn) {
  const calls = []
  const fakeKv = {
    async put(key, value, options) {
      calls.push({ key, value, options })
    },
    async get() {
      return null
    },
    async delete() {},
    ...kvOverrides,
  }
  const previous = globalThis[CLOUDFLARE_CONTEXT_SYMBOL]
  globalThis[CLOUDFLARE_CONTEXT_SYMBOL] = {
    env: { NEXT_INC_CACHE_KV: fakeKv, NEXT_INC_CACHE_KV_PREFIX: undefined },
  }
  try {
    return await fn(calls)
  } finally {
    globalThis[CLOUDFLARE_CONTEXT_SYMBOL] = previous
  }
}

describe('kv-incremental-cache-ttl', () => {
  test('TTL constants exceed their own cache type\'s revalidate window (so an entry never expires before Next would have refreshed it anyway)', () => {
    const PAGE_REVALIDATE_SECONDS = 86400 // figure/[figure_id] and [genre]/[line]/[slug] page.tsx
    const FETCH_REVALIDATE_SECONDS = 86400 // R2 price fetches, FigureDetailContent.tsx PRICE_FETCH_REVALIDATE_SECONDS (3600 -> 86400, D2 2026-09-02)
    assert.ok(PAGE_CACHE_TTL_SECONDS > PAGE_REVALIDATE_SECONDS)
    assert.ok(FETCH_CACHE_TTL_SECONDS > FETCH_REVALIDATE_SECONDS)
  })

  test('TTL constants are above Cloudflare KV\'s expirationTtl minimum (60s)', () => {
    assert.ok(PAGE_CACHE_TTL_SECONDS >= 60)
    assert.ok(FETCH_CACHE_TTL_SECONDS >= 60)
  })

  test('ttlSecondsForCacheType: "fetch" gets the fetch TTL, everything else gets the page TTL', () => {
    assert.equal(ttlSecondsForCacheType('fetch'), FETCH_CACHE_TTL_SECONDS)
    assert.equal(ttlSecondsForCacheType('cache'), PAGE_CACHE_TTL_SECONDS)
    assert.equal(ttlSecondsForCacheType(undefined), PAGE_CACHE_TTL_SECONDS)
  })

  test('set() on the default ("cache") type calls kv.put() with a non-null expirationTtl matching PAGE_CACHE_TTL_SECONDS -- THE regression guard', async () => {
    await withFakeKv({}, async (calls) => {
      await kvIncrementalCacheWithTtl.set('some-page-key', { some: 'value' })
      assert.equal(calls.length, 1)
      const { options } = calls[0]
      assert.ok(options, 'kv.put() must be called with an options object, not omitted')
      assert.equal(typeof options.expirationTtl, 'number', 'expirationTtl must be a number, not missing/null/undefined')
      assert.equal(options.expirationTtl, PAGE_CACHE_TTL_SECONDS)
    })
  })

  test('set() on the "fetch" type calls kv.put() with a non-null expirationTtl matching FETCH_CACHE_TTL_SECONDS', async () => {
    await withFakeKv({}, async (calls) => {
      await kvIncrementalCacheWithTtl.set('some-fetch-key', { some: 'value' }, 'fetch')
      assert.equal(calls.length, 1)
      const { options } = calls[0]
      assert.ok(options)
      assert.equal(options.expirationTtl, FETCH_CACHE_TTL_SECONDS)
    })
  })

  test('the stored JSON value shape is unchanged from the vendor cache (value + lastModified) -- TTL is metadata on the put() call, not a payload change', async () => {
    await withFakeKv({}, async (calls) => {
      await kvIncrementalCacheWithTtl.set('some-key', { some: 'value' })
      const parsed = JSON.parse(calls[0].value)
      assert.deepEqual(parsed.value, { some: 'value' })
      assert.equal(typeof parsed.lastModified, 'number')
    })
  })

  // 9/20 (standalone ask, hubs cached 404): a page whose data was missing when first
  // rendered was cached as a fresh 404 for 24 h after D1 healed. This is the exact entry
  // shape read from production KV that day (`value.type app`, `meta.status 404`, revalidate 86400).
  const PROD_404_ENTRY = {
    type: 'app',
    html: '<html>404</html>',
    rsc: '',
    meta: { status: 404, headers: { 'x-nextjs-stale-time': '300' } },
    revalidate: 86400,
  }

  test('set() of a cached 404 page entry gets a 5-minute expirationTtl, not the 5-day page TTL -- a late data load self-heals', async () => {
    await withFakeKv({}, async (calls) => {
      await kvIncrementalCacheWithTtl.set('a-404-page', PROD_404_ENTRY, 'cache')
      assert.equal(calls[0].options.expirationTtl, 300)
    })
  })

  test('a 200 page entry, an entry with no meta, and a redirect-shaped entry keep the 5-day page TTL', async () => {
    await withFakeKv({}, async (calls) => {
      await kvIncrementalCacheWithTtl.set('ok-page', { ...PROD_404_ENTRY, meta: { status: 200 } }, 'cache')
      await kvIncrementalCacheWithTtl.set('no-meta', { type: 'route', body: 'x', revalidate: 60 }, 'cache')
      await kvIncrementalCacheWithTtl.set('redirect', { type: 'redirect', props: {} }, 'cache')
      assert.deepEqual(calls.map((c) => c.options.expirationTtl), [PAGE_CACHE_TTL_SECONDS, PAGE_CACHE_TTL_SECONDS, PAGE_CACHE_TTL_SECONDS])
    })
  })

  test('a "fetch" entry keeps the fetch TTL even if its payload carries a 404 (an R2 "no summary" price fetch must not shorten)', async () => {
    await withFakeKv({}, async (calls) => {
      await kvIncrementalCacheWithTtl.set('price-404', { ...PROD_404_ENTRY, type: 'fetch' }, 'fetch')
      await kvIncrementalCacheWithTtl.set('price-404-nometa', { kind: 'FETCH', data: { status: 404 }, meta: { status: 404 } }, 'fetch')
      assert.deepEqual(calls.map((c) => c.options.expirationTtl), [FETCH_CACHE_TTL_SECONDS, FETCH_CACHE_TTL_SECONDS])
    })
  })

  test('NOT_FOUND_CACHE_TTL_SECONDS is a deliberate short TTL: >= KV minimum 60 s and far below the page revalidate window', () => {
    assert.equal(NOT_FOUND_CACHE_TTL_SECONDS, 300)
    assert.ok(NOT_FOUND_CACHE_TTL_SECONDS >= 60)
    assert.ok(NOT_FOUND_CACHE_TTL_SECONDS < 86400)
  })

  test('isNotFoundPageEntry is null/garbage safe', () => {
    for (const v of [null, undefined, 'x', 404, {}, { meta: null }, { meta: { status: 200 } }]) assert.equal(isNotFoundPageEntry(v), false)
    assert.equal(isNotFoundPageEntry(PROD_404_ENTRY), true)
  })
})
