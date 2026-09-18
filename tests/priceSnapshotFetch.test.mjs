import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchPriceSnapshot, SnapshotFetchError } from '../scripts/lib/price-snapshot-fetch.mjs'

// No real waiting: a fake clock that the fake sleep advances.
function harness(responses) {
  let t = 1_000_000
  const calls = []
  const sleeps = []
  const opts = {
    now: () => t,
    sleepImpl: async (ms) => { sleeps.push(ms); t += ms },
    fetchImpl: async (url) => {
      calls.push(url)
      const r = responses[Math.min(calls.length - 1, responses.length - 1)]
      if (r instanceof Error) throw r
      return { status: r.status, ok: r.status >= 200 && r.status < 300, headers: { get: (h) => (h === 'retry-after' ? r.retryAfter ?? null : null) }, json: async () => r.body }
    },
  }
  return { opts, calls, sleeps }
}

test('a 429 is retried, never read as "no comps" (the 2026-09-18 bug: 57% of fetches were 429s)', async () => {
  const h = harness([{ status: 429 }, { status: 429 }, { status: 200, body: { sold_count: 48, median_sold: 210.5 } }])
  const data = await fetchPriceSnapshot('fp_undertaker', h.opts)
  assert.deepEqual(data, { sold_count: 48, median_sold: 210.5 })
  assert.equal(h.calls.length, 3)
  assert.ok(h.sleeps.some((ms) => ms >= 2000), 'paused after the 429')
})

test('Retry-After is honoured', async () => {
  const h = harness([{ status: 429, retryAfter: '7' }, { status: 200, body: { sold_count: 3, median_sold: 10 } }])
  await fetchPriceSnapshot('fp_a', h.opts)
  assert.ok(h.sleeps.some((ms) => ms >= 7000 && ms < 9000))
})

test('persistent failure THROWS so the generator exits before writing a partial payload', async () => {
  const h = harness([{ status: 429 }])
  await assert.rejects(fetchPriceSnapshot('fp_b', { ...h.opts, maxAttempts: 3 }), (err) => err instanceof SnapshotFetchError && /fp_b/.test(err.message) && /429/.test(err.message))
  assert.equal(h.calls.length, 3)
  const net = harness([new Error('ECONNRESET')])
  await assert.rejects(fetchPriceSnapshot('fp_c', { ...net.opts, maxAttempts: 2 }), SnapshotFetchError)
})

test('"no data" is only an explicit answer: 404, or the proxy\'s 200 {} wrapper', async () => {
  assert.equal(await fetchPriceSnapshot('fp_d', harness([{ status: 404 }]).opts), null)
  assert.equal(await fetchPriceSnapshot('fp_e', harness([{ status: 200, body: {} }]).opts), null)
})

test('a non-retryable 4xx fails at once', async () => {
  const h = harness([{ status: 403 }])
  await assert.rejects(fetchPriceSnapshot('fp_f', h.opts), /HTTP 403/)
  assert.equal(h.calls.length, 1)
})
