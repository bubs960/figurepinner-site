import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  readThroughPrice, resetGenMemo, priceKey,
  PRICE_KV_TTL_S, PRICE_KV_NEG_TTL_S, NEG_SENTINEL, GEN_DEFAULT, GEN_MEMO_MS,
} from '../src/lib/priceReadThrough.ts'

// Release O (2026-09-04): the KV mirror in front of R2. These pin the contract:
// KV hit → no origin read; miss → origin + background put with the right TTL;
// missing object → negative sentinel with the short TTL; gen key changes the
// key space; KV failure → identical to the pre-O behaviour (origin, no cache).

function fakeKv(seed = {}) {
  const store = new Map(Object.entries(seed))
  const puts = []
  return {
    store, puts,
    async get(k) { return store.has(k) ? store.get(k) : null },
    async put(k, v, o) { store.set(k, v); puts.push({ k, v, o }) },
  }
}
function fakeOrigin(map) {
  const calls = []
  return { calls, fn: async (kind, fid) => { calls.push(`${kind}/${fid}`); return map[`${kind}/${fid}`] ?? null } }
}
const scheduled = []
const waitUntil = p => scheduled.push(p)
const drain = () => Promise.all(scheduled.splice(0))

describe('price read-through', () => {
  beforeEach(() => resetGenMemo())

  test('KV hit returns the parsed object and never touches origin', async () => {
    const kv = fakeKv({ [priceKey(GEN_DEFAULT, 'price-summaries', 'f1')]: JSON.stringify({ median_sold: 25 }) })
    const o = fakeOrigin({})
    const v = await readThroughPrice({ kv, origin: o.fn, waitUntil }, 'price-summaries', 'f1')
    assert.deepEqual(v, { median_sold: 25 })
    assert.equal(o.calls.length, 0)
  })

  test('KV miss reads origin, returns it, and mirrors it with the 24 h TTL', async () => {
    const kv = fakeKv()
    const o = fakeOrigin({ 'price-summaries/f2': { median_sold: 40 } })
    const v = await readThroughPrice({ kv, origin: o.fn, waitUntil }, 'price-summaries', 'f2')
    await drain()
    assert.deepEqual(v, { median_sold: 40 })
    assert.equal(o.calls.length, 1)
    assert.equal(kv.puts.length, 1)
    assert.equal(kv.puts[0].k, priceKey(GEN_DEFAULT, 'price-summaries', 'f2'))
    assert.equal(kv.puts[0].o.expirationTtl, PRICE_KV_TTL_S)
    // second read is a hit
    const again = await readThroughPrice({ kv, origin: o.fn, waitUntil }, 'price-summaries', 'f2')
    assert.deepEqual(again, { median_sold: 40 })
    assert.equal(o.calls.length, 1)
  })

  test('missing object caches the negative sentinel with the 24 h TTL and short-circuits next time', async () => {
    const kv = fakeKv()
    const o = fakeOrigin({})
    assert.equal(await readThroughPrice({ kv, origin: o.fn, waitUntil }, 'price-history', 'nope'), null)
    await drain()
    assert.equal(kv.puts[0].v, NEG_SENTINEL)
    assert.equal(kv.puts[0].o.expirationTtl, PRICE_KV_NEG_TTL_S)
    assert.equal(await readThroughPrice({ kv, origin: o.fn, waitUntil }, 'price-history', 'nope'), null)
    assert.equal(o.calls.length, 1)
  })

  test('the price-gen key selects the key space; a bump misses old entries', async () => {
    const kv = fakeKv({ 'price-gen': 'g7', [priceKey('g0', 'price-summaries', 'f3')]: JSON.stringify({ median_sold: 1 }) })
    const o = fakeOrigin({ 'price-summaries/f3': { median_sold: 2 } })
    const v = await readThroughPrice({ kv, origin: o.fn, waitUntil }, 'price-summaries', 'f3')
    await drain()
    assert.deepEqual(v, { median_sold: 2 }) // g0 entry ignored
    assert.equal(kv.puts[0].k, priceKey('g7', 'price-summaries', 'f3'))
  })

  test('gen is memoised per isolate for GEN_MEMO_MS', async () => {
    let t = 1_000_000
    const kv = fakeKv({ 'price-gen': 'gA' })
    const gets = []
    const origGet = kv.get.bind(kv)
    kv.get = async (k, o) => { gets.push(k); return origGet(k, o) }
    const o = fakeOrigin({ 'price-summaries/x': { a: 1 } })
    const deps = { kv, origin: o.fn, waitUntil, now: () => t }
    await readThroughPrice(deps, 'price-summaries', 'x'); await drain()
    await readThroughPrice(deps, 'price-summaries', 'x')
    assert.equal(gets.filter(k => k === 'price-gen').length, 1)
    t += GEN_MEMO_MS + 1
    await readThroughPrice(deps, 'price-summaries', 'x')
    assert.equal(gets.filter(k => k === 'price-gen').length, 2)
  })

  test('a malformed gen value falls back to the default gen', async () => {
    const kv = fakeKv({ 'price-gen': 'bad value with spaces!' })
    const o = fakeOrigin({ 'price-summaries/y': { a: 1 } })
    await readThroughPrice({ kv, origin: o.fn, waitUntil }, 'price-summaries', 'y'); await drain()
    assert.equal(kv.puts[0].k, priceKey(GEN_DEFAULT, 'price-summaries', 'y'))
  })

  test('KV throwing → origin read still served, nothing cached, no throw', async () => {
    const kv = { async get() { throw new Error('kv down') }, async put() { throw new Error('kv down') } }
    const o = fakeOrigin({ 'price-summaries/z': { a: 9 } })
    const v = await readThroughPrice({ kv, origin: o.fn, waitUntil }, 'price-summaries', 'z')
    assert.deepEqual(v, { a: 9 })
  })

  test('no KV binding → plain origin read (pre-O behaviour)', async () => {
    const o = fakeOrigin({ 'price-summaries/w': { a: 3 } })
    assert.deepEqual(await readThroughPrice({ kv: null, origin: o.fn }, 'price-summaries', 'w'), { a: 3 })
  })

  test('corrupt KV entry falls through to origin and is overwritten', async () => {
    const kv = fakeKv({ [priceKey(GEN_DEFAULT, 'price-summaries', 'c')]: '{not json' })
    const o = fakeOrigin({ 'price-summaries/c': { fixed: true } })
    const v = await readThroughPrice({ kv, origin: o.fn, waitUntil }, 'price-summaries', 'c'); await drain()
    assert.deepEqual(v, { fixed: true })
    assert.equal(kv.puts.length, 1)
  })
})
