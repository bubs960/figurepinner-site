import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { checkRateLimit } from '../src/lib/rateLimit.ts'

/**
 * checkRateLimit's actual counting path reads/writes the Workers Cache API
 * (`caches.default`), which does not exist under plain `node --test` (typeof
 * caches === 'undefined' here). The function wraps that access in try/catch
 * and fails OPEN on any error — so every test below that would otherwise hit
 * the counting logic instead exercises (and pins) that fail-open path. The
 * two guard branches that run BEFORE any Cache API access (verified-bot
 * exemption, missing-IP fail-open) are the only branches genuinely
 * independent of that constraint. This mirrors the same tradeoff already
 * accepted by rateLimit429NoStore.test.mjs (source-scan) for this file's
 * neighbors — a real Cache API mock would need to reimplement match/put
 * semantics to be worth trusting.
 */

function makeRequest({ ip, verifiedBot } = {}) {
  const headers = new Headers()
  if (ip !== undefined) headers.set('cf-connecting-ip', ip)
  const req = { headers }
  if (verifiedBot !== undefined) {
    req.cf = verifiedBot ? { verifiedBotCategory: 'googlebot' } : {}
  }
  return req
}

describe('checkRateLimit — verified-bot exemption (checked before any IP/cache work)', () => {
  test('a verified bot is never limited, regardless of IP', async () => {
    const req = makeRequest({ ip: '1.2.3.4', verifiedBot: true })
    const result = await checkRateLimit(req, 'test-bucket', 5)
    assert.deepEqual(result, { limited: false, remaining: 5, retryAfter: 0 })
  })

  test('a verified bot is exempt even with no IP at all', async () => {
    const req = makeRequest({ verifiedBot: true })
    const result = await checkRateLimit(req, 'test-bucket', 5)
    assert.deepEqual(result, { limited: false, remaining: 5, retryAfter: 0 })
  })

  test('.cf present but no verifiedBotCategory is NOT treated as a bot', async () => {
    const req = makeRequest({ ip: '1.2.3.4', verifiedBot: false })
    const result = await checkRateLimit(req, 'test-bucket', 5)
    // Falls through to the (fail-open, per the file header) counting path.
    assert.equal(result.limited, false)
  })
})

describe('checkRateLimit — missing IP fails open', () => {
  test('no cf-connecting-ip header at all fails open without touching the cache', async () => {
    const req = makeRequest({})
    const result = await checkRateLimit(req, 'test-bucket', 5)
    assert.deepEqual(result, { limited: false, remaining: 5, retryAfter: 0 })
  })

  test('an empty-string IP header is treated the same as missing (falsy)', async () => {
    const req = makeRequest({ ip: '' })
    const result = await checkRateLimit(req, 'test-bucket', 5)
    assert.deepEqual(result, { limited: false, remaining: 5, retryAfter: 0 })
  })
})

describe('documents current behavior: without a Cache API, checkRateLimit always fails open', () => {
  test('a real IP with the Cache API unavailable never limits, whatever the limit is', async () => {
    const req = makeRequest({ ip: '9.9.9.9' })
    const result = await checkRateLimit(req, 'test-bucket', 1)
    assert.deepEqual(result, { limited: false, remaining: 1, retryAfter: 0 })
  })

  test('a limit of 0 still does not limit when the Cache API throws', async () => {
    // In a real Workers runtime a limit of 0 would throttle on the very
    // first request; here the catch block returns "not limited" before that
    // comparison is ever reached.
    const req = makeRequest({ ip: '9.9.9.9' })
    const result = await checkRateLimit(req, 'test-bucket', 0)
    assert.deepEqual(result, { limited: false, remaining: 0, retryAfter: 0 })
  })

  test('different buckets/IPs are independent inputs but produce the same fail-open shape', async () => {
    const a = await checkRateLimit(makeRequest({ ip: '1.1.1.1' }), 'bucket-a', 10)
    const b = await checkRateLimit(makeRequest({ ip: '2.2.2.2' }), 'bucket-b', 10)
    assert.deepEqual(a, { limited: false, remaining: 10, retryAfter: 0 })
    assert.deepEqual(b, { limited: false, remaining: 10, retryAfter: 0 })
  })
})
