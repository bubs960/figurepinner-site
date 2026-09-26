import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  installEnv,
  setUser,
  installRateLimitCache,
  clearRateLimitCache,
  fakeDb,
  jsonReq,
  read,
} from './helpers/routeHarness.mjs'

// Route-level pins for the six admin/ops routes that PR #42 moved onto
// requireAdmin(). These import the REAL route handlers (next/server, Clerk and
// @opennextjs/cloudflare are swapped for tiny stubs by
// tests/helpers/routeStubLoader.mjs, test-time only). Order pinned for every
// route as it exists today: adminRateLimit -> credential gate -> route work.

const health = await import('../src/app/api/admin/health/route.ts')
const kvAudit = await import('../src/app/api/admin/kv-audit/route.ts')
const news = await import('../src/app/api/admin/news/route.ts')
const cacheStats = await import('../src/app/api/cache-stats/route.ts')
const dailyUniques = await import('../src/app/api/daily-uniques/route.ts')
const funnelStats = await import('../src/app/api/funnel-stats/route.ts')

const ENV_KEYS = [
  'FP_ADMIN_USER_IDS',
  'CACHE_STATS_KEY',
  'FUNNEL_STATS_KEY',
  'DAILY_UNIQUES_DEBUG_KEY',
  'CF_ACCOUNT_ID',
  'CF_API_TOKEN',
]
let savedEnv
let savedFetch
let fetchCalls

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]))
  for (const k of ENV_KEYS) delete process.env[k]
  savedFetch = globalThis.fetch
  fetchCalls = []
  globalThis.fetch = async (url) => {
    fetchCalls.push(String(url))
    return new Response('{"errors":["test stub"]}', { status: 500 })
  }
  clearRateLimitCache()
  setUser(null)
  installEnv({ DB: fakeDb() })
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k]
    else process.env[k] = savedEnv[k]
  }
  globalThis.fetch = savedFetch
  clearRateLimitCache()
})

const get = (url, headers = {}) =>
  new Request(url, { headers: { 'cf-connecting-ip': '203.0.113.9', ...headers } })

// ── Allowlist routes ─────────────────────────────────────────────────────────

describe('GET /api/admin/health — allowlist gate', () => {
  const call = () => health.GET(get('https://figurepinner.com/api/admin/health'))

  test('signed out -> 401 { error: "Unauthorized" } (no Cache-Control header set)', async () => {
    process.env.FP_ADMIN_USER_IDS = 'user_admin'
    const r = await read(await call())
    assert.equal(r.status, 401)
    assert.deepEqual(r.body, { error: 'Unauthorized' })
    assert.equal(r.headers.get('cache-control'), null)
  })

  test('signed in, FP_ADMIN_USER_IDS unset -> 503 with the health-only message', async () => {
    setUser('user_admin')
    const r = await read(await call())
    assert.equal(r.status, 503)
    assert.deepEqual(r.body, {
      error: 'admin_endpoint_not_configured',
      message: 'Set FP_ADMIN_USER_IDS env var on the worker (comma-separated Clerk user IDs).',
    })
  })

  test('signed in, not on the allowlist -> 403 { error: "Forbidden" }', async () => {
    process.env.FP_ADMIN_USER_IDS = 'user_admin, user_other'
    setUser('user_random')
    const r = await read(await call())
    assert.equal(r.status, 403)
    assert.deepEqual(r.body, { error: 'Forbidden' })
  })

  test('on the allowlist -> passes the gate (200 snapshot, ok key present)', async () => {
    process.env.FP_ADMIN_USER_IDS = 'user_other,user_admin'
    setUser('user_admin')
    const r = await read(await call())
    assert.equal(r.status, 200)
    assert.ok('ok' in r.body && 'env' in r.body)
  })

  test('ORDER: rate limit runs before auth — 429 even for an allowlisted admin', async () => {
    process.env.FP_ADMIN_USER_IDS = 'user_admin'
    setUser('user_admin')
    installRateLimitCache(30) // next hit = 31 > ADMIN_RATE_LIMIT_PER_MINUTE (30)
    const r = await read(await call())
    assert.equal(r.status, 429)
    assert.deepEqual(r.body, { error: 'rate_limited' })
    assert.equal(r.headers.get('cache-control'), 'no-store')
    assert.ok(Number(r.headers.get('retry-after')) >= 1)
  })
})

describe('GET /api/admin/kv-audit — allowlist gate (emptyAllowlist: forbidden)', () => {
  const call = () => kvAudit.GET(get('https://figurepinner.com/api/admin/kv-audit'))

  test('signed out -> 401 { error: "Unauthorized" }', async () => {
    const r = await read(await call())
    assert.equal(r.status, 401)
    assert.deepEqual(r.body, { error: 'Unauthorized' })
  })

  test('signed in, FP_ADMIN_USER_IDS unset -> 403 Forbidden (NOT 503, unlike health/news)', async () => {
    setUser('user_admin')
    const r = await read(await call())
    assert.equal(r.status, 403)
    assert.deepEqual(r.body, { error: 'Forbidden' })
  })

  test('signed in, not on allowlist -> 403 Forbidden', async () => {
    process.env.FP_ADMIN_USER_IDS = 'user_admin'
    setUser('user_random')
    const r = await read(await call())
    assert.equal(r.status, 403)
    assert.deepEqual(r.body, { error: 'Forbidden' })
  })

  test('allowlisted -> passes the gate (no PRO_KV bound -> the route\'s own 503)', async () => {
    process.env.FP_ADMIN_USER_IDS = 'user_admin'
    setUser('user_admin')
    const r = await read(await call())
    assert.equal(r.status, 503)
    assert.deepEqual(r.body, { error: 'PRO_KV binding not found' })
  })

  test('ORDER: rate limit runs before auth — 429 while signed out', async () => {
    installRateLimitCache(30)
    const r = await read(await call())
    assert.equal(r.status, 429)
    assert.deepEqual(r.body, { error: 'rate_limited' })
  })
})

describe('POST /api/admin/news — allowlist gate, then title cap (not a fieldCaps route)', () => {
  const call = (body) =>
    news.POST(jsonReq('https://figurepinner.com/api/admin/news', 'POST', body, { 'cf-connecting-ip': '203.0.113.9' }))

  test('signed out -> 401 even with an over-cap title (auth before cap); DB untouched', async () => {
    const db = fakeDb()
    installEnv({ DB: db })
    const r = await read(await call({ title: 'x'.repeat(201) }))
    assert.equal(r.status, 401)
    assert.deepEqual(r.body, { error: 'Unauthorized' })
    assert.equal(db.calls.length, 0)
  })

  test('signed in, FP_ADMIN_USER_IDS unset -> 503 with NO message field', async () => {
    setUser('user_admin')
    const r = await read(await call({ title: 'hi' }))
    assert.equal(r.status, 503)
    assert.deepEqual(r.body, { error: 'admin_endpoint_not_configured' })
  })

  test('signed in, not on allowlist -> 403 Forbidden', async () => {
    process.env.FP_ADMIN_USER_IDS = 'user_admin'
    setUser('user_random')
    const r = await read(await call({ title: 'hi' }))
    assert.equal(r.status, 403)
    assert.deepEqual(r.body, { error: 'Forbidden' })
  })

  test('allowlisted: title of exactly 200 chars -> 201; 201 chars -> 400 title_too_long', async () => {
    process.env.FP_ADMIN_USER_IDS = 'user_admin'
    setUser('user_admin')
    const db = fakeDb()
    installEnv({ DB: db })
    const ok = await read(await call({ title: 'x'.repeat(200) }))
    assert.equal(ok.status, 201)
    assert.equal(typeof ok.body.id, 'string')
    assert.equal(db.calls.length, 1)

    const tooLong = await read(await call({ title: 'x'.repeat(201) }))
    assert.equal(tooLong.status, 400)
    assert.deepEqual(tooLong.body, { error: 'title_too_long', max: 200 })
    assert.equal(db.calls.length, 1)
  })

  test('ORDER: rate limit runs before auth — 429 while signed out', async () => {
    installRateLimitCache(30)
    const r = await read(await call({ title: 'hi' }))
    assert.equal(r.status, 429)
  })
})

// ── Shared-secret routes ─────────────────────────────────────────────────────

const SECRET_ROUTES = [
  { name: 'cache-stats', mod: cacheStats, header: 'x-cache-stats-key', envVar: 'CACHE_STATS_KEY', url: 'https://figurepinner.com/api/cache-stats' },
  { name: 'daily-uniques', mod: dailyUniques, header: 'x-cache-stats-key', envVar: 'CACHE_STATS_KEY', url: 'https://figurepinner.com/api/daily-uniques' },
  { name: 'funnel-stats', mod: funnelStats, header: 'x-funnel-stats-key', envVar: 'FUNNEL_STATS_KEY', url: 'https://figurepinner.com/api/funnel-stats' },
]

for (const route of SECRET_ROUTES) {
  describe(`GET /api/${route.name} — secret gate (${route.header} vs ${route.envVar})`, () => {
    test('secret env unset -> 503 admin_endpoint_not_configured, no-store, even with a header', async () => {
      const r = await read(await route.mod.GET(get(route.url, { [route.header]: 'anything' })))
      assert.equal(r.status, 503)
      assert.deepEqual(r.body, { error: 'admin_endpoint_not_configured' })
      assert.equal(r.headers.get('cache-control'), 'no-store')
      assert.equal(fetchCalls.length, 0)
    })

    test('wrong header -> 401 unauthorized, no-store; missing header -> 401', async () => {
      process.env[route.envVar] = 's3cret'
      process.env.CF_ACCOUNT_ID = 'acct'
      process.env.CF_API_TOKEN = 'tok'
      const wrong = await read(await route.mod.GET(get(route.url, { [route.header]: 'nope' })))
      assert.equal(wrong.status, 401)
      assert.deepEqual(wrong.body, { error: 'unauthorized' })
      assert.equal(wrong.headers.get('cache-control'), 'no-store')
      const missing = await read(await route.mod.GET(get(route.url)))
      assert.equal(missing.status, 401)
      assert.equal(fetchCalls.length, 0)
    })

    test('correct header -> passes the gate (CF creds unset -> the route\'s own 503)', async () => {
      process.env[route.envVar] = 's3cret'
      const r = await read(await route.mod.GET(get(route.url, { [route.header]: 's3cret' })))
      assert.equal(r.status, 503)
      assert.equal(r.body.error, 'CF_ACCOUNT_ID or CF_API_TOKEN not configured')
    })

    test('ORDER: rate limit runs before the secret check — 429 with the correct secret', async () => {
      process.env[route.envVar] = 's3cret'
      installRateLimitCache(30)
      const r = await read(await route.mod.GET(get(route.url, { [route.header]: 's3cret' })))
      assert.equal(r.status, 429)
      assert.deepEqual(r.body, { error: 'rate_limited' })
    })
  })
}

describe('GET /api/daily-uniques — ?debug=1 / ?introspect=1 sub-gate', () => {
  const base = 'https://figurepinner.com/api/daily-uniques'
  const mainOk = { 'x-cache-stats-key': 'main' }
  const withCreds = () => {
    process.env.CACHE_STATS_KEY = 'main'
    process.env.CF_ACCOUNT_ID = 'acct'
    process.env.CF_API_TOKEN = 'tok'
  }

  for (const q of ['debug=1', 'introspect=1']) {
    test(`?${q}: DAILY_UNIQUES_DEBUG_KEY unset -> 503 admin_endpoint_not_configured; no upstream fetch`, async () => {
      withCreds()
      const r = await read(await dailyUniques.GET(get(`${base}?${q}`, mainOk)))
      assert.equal(r.status, 503)
      assert.deepEqual(r.body, { error: 'admin_endpoint_not_configured' })
      assert.equal(r.headers.get('cache-control'), 'no-store')
      assert.equal(fetchCalls.length, 0)
    })

    test(`?${q}: wrong/missing x-daily-uniques-key -> 401 unauthorized; no upstream fetch`, async () => {
      withCreds()
      process.env.DAILY_UNIQUES_DEBUG_KEY = 'dbg'
      const wrong = await read(await dailyUniques.GET(get(`${base}?${q}`, { ...mainOk, 'x-daily-uniques-key': 'nope' })))
      assert.equal(wrong.status, 401)
      assert.deepEqual(wrong.body, { error: 'unauthorized' })
      const missing = await read(await dailyUniques.GET(get(`${base}?${q}`, mainOk)))
      assert.equal(missing.status, 401)
      assert.equal(fetchCalls.length, 0)
    })

    test(`?${q}: correct debug key -> passes the sub-gate (reaches the upstream fetch)`, async () => {
      withCreds()
      process.env.DAILY_UNIQUES_DEBUG_KEY = 'dbg'
      const res = await dailyUniques.GET(get(`${base}?${q}`, { ...mainOk, 'x-daily-uniques-key': 'dbg' }))
      assert.notEqual(res.status, 401)
      assert.notEqual(res.status, 503)
      assert.ok(fetchCalls.length >= 1)
    })
  }

  test('ORDER: the main CACHE_STATS_KEY gate runs before the debug gate — a valid debug key alone is 401', async () => {
    withCreds()
    process.env.DAILY_UNIQUES_DEBUG_KEY = 'dbg'
    const r = await read(await dailyUniques.GET(get(`${base}?debug=1`, { 'x-daily-uniques-key': 'dbg' })))
    assert.equal(r.status, 401)
    assert.deepEqual(r.body, { error: 'unauthorized' })
  })

  test('ORDER: the debug rate limit (10/min) runs before the debug secret check', async () => {
    withCreds()
    process.env.DAILY_UNIQUES_DEBUG_KEY = 'dbg'
    installRateLimitCache(10) // admin bucket: 11 <= 30 passes; debug bucket: 11 > 10 limited
    const r = await read(await dailyUniques.GET(get(`${base}?debug=1`, { ...mainOk, 'x-daily-uniques-key': 'dbg' })))
    assert.equal(r.status, 429)
    assert.deepEqual(r.body, { error: 'rate_limited' })
    assert.equal(r.headers.get('cache-control'), 'no-store')
  })

  test('documents current behavior: CF creds unset answers 503 "not configured" to a ?debug=1 request BEFORE the debug key is checked', async () => {
    process.env.CACHE_STATS_KEY = 'main'
    process.env.DAILY_UNIQUES_DEBUG_KEY = 'dbg'
    const r = await read(await dailyUniques.GET(get(`${base}?debug=1`, mainOk)))
    assert.equal(r.status, 503)
    assert.equal(r.body.error, 'CF_ACCOUNT_ID or CF_API_TOKEN not configured')
  })

  test('no debug/introspect param -> debug key is NOT required (main gate only)', async () => {
    withCreds()
    process.env.DAILY_UNIQUES_DEBUG_KEY = 'dbg'
    const res = await dailyUniques.GET(get(base, mainOk))
    assert.notEqual(res.status, 401)
    assert.ok(fetchCalls.length >= 1)
  })
})
