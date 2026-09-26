import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { adminRateLimit, ADMIN_RATE_LIMIT_PER_MINUTE } from '../src/lib/adminRateLimit.ts'
import { requireAdmin } from '../src/lib/requireAdmin.ts'

/**
 * adminRateLimit wraps checkRateLimit (src/lib/rateLimit.ts), whose counter
 * lives in the Workers Cache API. Unlike rateLimit.test.mjs (which pins the
 * no-Cache-API fail-open path), these tests install a minimal in-memory
 * `caches.default` exposing just the two calls checkRateLimit makes —
 * match(key) and put(key, response) — keyed by request URL, so the 30th/31st
 * boundary is actually exercised. Date.now is pinned 15s into a 60s window so
 * a test can never straddle a window rollover (and Retry-After is exactly 45).
 */

const WINDOW_START_MS = 1_790_000_040_000 // divisible by 60_000
const NOW_MS = WINDOW_START_MS + 15_000

let store
let dateMock

function installCache({ throwOn } = {}) {
  store = new Map()
  globalThis.caches = {
    default: {
      async match(key) {
        if (throwOn === 'match') throw new Error('cache down')
        const body = store.get(key.url)
        return body === undefined ? undefined : new Response(body)
      },
      async put(key, res) {
        if (throwOn === 'put') throw new Error('cache down')
        store.set(key.url, await res.text())
      },
    },
  }
}

function req(ip = '203.0.113.7', { verifiedBot = false, headers = {} } = {}) {
  const r = new Request('https://figurepinner.com/api/x', { headers: { 'cf-connecting-ip': ip, ...headers } })
  if (verifiedBot) Object.defineProperty(r, 'cf', { value: { verifiedBotCategory: 'Search Engine Crawler' } })
  return r
}

async function hit(route, n, request = req()) {
  const results = []
  for (let i = 0; i < n; i++) results.push(await adminRateLimit(request, route))
  return results
}

beforeEach(() => {
  dateMock = mock.method(Date, 'now', () => NOW_MS)
  installCache()
})

afterEach(() => {
  dateMock.mock.restore()
  delete globalThis.caches
})

describe('adminRateLimit — 30/min per IP per route', () => {
  test('limit constant is 30', () => {
    assert.equal(ADMIN_RATE_LIMIT_PER_MINUTE, 30)
  })

  test('requests 1-30 pass (null); the 31st is a 429 with no-store + Retry-After', async () => {
    const results = await hit('cache-stats', 31)
    assert.deepEqual(results.slice(0, 30), Array(30).fill(null))
    assert.deepEqual(results[30], {
      status: 429,
      body: { error: 'rate_limited' },
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '45' },
    })
  })

  test('stays limited past the 31st within the same window', async () => {
    const results = await hit('funnel-stats', 35)
    assert.equal(results.slice(30).every((r) => r?.status === 429), true)
  })

  test('the next window starts a fresh count', async () => {
    await hit('health', 31)
    dateMock.mock.mockImplementation(() => WINDOW_START_MS + 60_000)
    assert.equal(await adminRateLimit(req(), 'health'), null)
  })

  test('each of the six routes has its own bucket: exhausting one leaves the others open', async () => {
    const routes = ['health', 'kv-audit', 'news', 'cache-stats', 'daily-uniques', 'funnel-stats']
    const [first, ...rest] = routes
    const exhausted = await hit(first, 31)
    assert.equal(exhausted[30]?.status, 429)
    for (const route of rest) {
      assert.equal(await adminRateLimit(req(), route), null, `${route} was throttled by ${first}'s traffic`)
    }
    // One counter key per route, all distinct, none colliding with the
    // pre-existing daily-uniques debug bucket.
    const buckets = [...store.keys()].map((k) => new URL(k).pathname.split('/')[1])
    assert.deepEqual(buckets.sort(), routes.map((r) => `admin-${r}`).sort())
    assert.equal(buckets.includes('daily-uniques-debug'), false)
  })

  test('buckets are per IP: one IP at the limit does not throttle another', async () => {
    await hit('news', 31, req('198.51.100.1'))
    assert.equal(await adminRateLimit(req('198.51.100.2'), 'news'), null)
  })

  test('verified bots are exempt (checkRateLimit precedent)', async () => {
    const results = await hit('kv-audit', 31, req('203.0.113.9', { verifiedBot: true }))
    assert.equal(results.every((r) => r === null), true)
  })
})

describe('adminRateLimit — never fails into an error', () => {
  test('Cache API match() throwing -> allow', async () => {
    installCache({ throwOn: 'match' })
    assert.deepEqual(await hit('cache-stats', 31), Array(31).fill(null))
  })

  test('Cache API put() throwing -> allow', async () => {
    installCache({ throwOn: 'put' })
    assert.deepEqual(await hit('cache-stats', 31), Array(31).fill(null))
  })

  test('no Cache API at all -> allow', async () => {
    delete globalThis.caches
    assert.deepEqual(await hit('daily-uniques', 31), Array(31).fill(null))
  })

  test('a request object that throws outside checkRateLimit\'s own try -> allow', async () => {
    const broken = { headers: { get() { throw new Error('boom') } } }
    assert.equal(await adminRateLimit(broken, 'health'), null)
  })

  test('missing cf-connecting-ip -> allow (checkRateLimit precedent)', async () => {
    const noIp = new Request('https://figurepinner.com/api/x')
    assert.deepEqual(await hit('funnel-stats', 31, noIp), Array(31).fill(null))
  })
})

describe('existing requireAdmin denials are unchanged for non-limited requests', () => {
  // Mirrors the route order: limiter first, then the unchanged gate.
  const gate = async (request, route, opts) => (await adminRateLimit(request, route)) ?? requireAdmin(opts)

  test('secret gate: unset env -> 503, wrong key -> 401, right key -> null', async () => {
    delete process.env.ADMIN_RL_TEST_KEY
    const r503 = await gate(req(), 'cache-stats', { kind: 'secret', request: req(), header: 'x-k', envVar: 'ADMIN_RL_TEST_KEY' })
    assert.deepEqual(r503, { status: 503, body: { error: 'admin_endpoint_not_configured' }, headers: { 'Cache-Control': 'no-store' } })

    process.env.ADMIN_RL_TEST_KEY = 'sekrit'
    try {
      const wrong = req('203.0.113.7', { headers: { 'x-k': 'nope' } })
      const r401 = await gate(wrong, 'cache-stats', { kind: 'secret', request: wrong, header: 'x-k', envVar: 'ADMIN_RL_TEST_KEY' })
      assert.deepEqual(r401, { status: 401, body: { error: 'unauthorized' }, headers: { 'Cache-Control': 'no-store' } })

      const right = req('203.0.113.7', { headers: { 'x-k': 'sekrit' } })
      assert.equal(await gate(right, 'cache-stats', { kind: 'secret', request: right, header: 'x-k', envVar: 'ADMIN_RL_TEST_KEY' }), null)
    } finally {
      delete process.env.ADMIN_RL_TEST_KEY
    }
  })

  test('allowlist gate: no user -> 401, empty allowlist -> 503 / 403 per option', async () => {
    const saved = process.env.FP_ADMIN_USER_IDS
    delete process.env.FP_ADMIN_USER_IDS
    try {
      assert.deepEqual(await gate(req(), 'health', { kind: 'allowlist', userId: null }), { status: 401, body: { error: 'Unauthorized' } })
      assert.deepEqual(await gate(req(), 'news', { kind: 'allowlist', userId: 'user_1' }), { status: 503, body: { error: 'admin_endpoint_not_configured' } })
      assert.deepEqual(await gate(req(), 'kv-audit', { kind: 'allowlist', userId: 'user_1', emptyAllowlist: 'forbidden' }), { status: 403, body: { error: 'Forbidden' } })
    } finally {
      if (saved === undefined) delete process.env.FP_ADMIN_USER_IDS
      else process.env.FP_ADMIN_USER_IDS = saved
    }
  })

  test('once limited, the 429 wins over the credential check (brute force is throttled)', async () => {
    process.env.ADMIN_RL_TEST_KEY = 'sekrit'
    try {
      const wrong = req('203.0.113.7', { headers: { 'x-k': 'guess' } })
      const opts = { kind: 'secret', request: wrong, header: 'x-k', envVar: 'ADMIN_RL_TEST_KEY' }
      const results = []
      for (let i = 0; i < 31; i++) results.push(await gate(wrong, 'funnel-stats', opts))
      assert.equal(results.slice(0, 30).every((r) => r?.status === 401), true)
      assert.equal(results[30]?.status, 429)
    } finally {
      delete process.env.ADMIN_RL_TEST_KEY
    }
  })
})

describe('wiring: every requireAdmin route calls adminRateLimit first, with its own bucket', () => {
  // Source scan (rateLimit429NoStore.test.mjs precedent): the handlers need
  // Clerk/Next/CF context to execute, so pin the call order structurally.
  const ROUTES = {
    'src/app/api/admin/health/route.ts': 'health',
    'src/app/api/admin/kv-audit/route.ts': 'kv-audit',
    'src/app/api/admin/news/route.ts': 'news',
    'src/app/api/cache-stats/route.ts': 'cache-stats',
    'src/app/api/daily-uniques/route.ts': 'daily-uniques',
    'src/app/api/funnel-stats/route.ts': 'funnel-stats',
  }

  for (const [file, route] of Object.entries(ROUTES)) {
    test(`${file} -> '${route}', before auth()/requireAdmin()`, () => {
      const src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
      const call = src.indexOf(`adminRateLimit(`)
      assert.ok(call > 0, 'adminRateLimit is not called')
      assert.match(src, new RegExp(`adminRateLimit\\((request|req), '${route}'\\)`))
      assert.equal(src.split('adminRateLimit(').length - 1, 1, 'adminRateLimit called more than once')
      const gate = src.indexOf('requireAdmin({')
      assert.ok(gate > call, 'requireAdmin runs before the limiter')
      const authCall = src.indexOf('await auth()')
      if (authCall !== -1) assert.ok(authCall > call, 'auth() runs before the limiter')
    })
  }

  test('daily-uniques keeps its pre-existing 10/min debug limiter unchanged', () => {
    const src = readFileSync(new URL('../src/app/api/daily-uniques/route.ts', import.meta.url), 'utf8')
    assert.match(src, /checkRateLimit\(request, 'daily-uniques-debug', 10\)/)
  })
})
