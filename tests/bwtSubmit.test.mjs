import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadBwtConfig, submitViaBwt, BWT_BATCH_MAX } from '../scripts/lib/bwt-submit.mjs'

const KEY = 'SECRETKEY123'
const config = { key: KEY, siteUrl: 'https://figurepinner.com' }
const urls = (n) => Array.from({ length: n }, (_, i) => 'https://figurepinner.com/figure/f' + i)

function fakeFetch({ daily = 10000, monthly = 100000, quotaStatus = 200, batchStatuses = [] } = {}) {
  const calls = []
  let batchIdx = 0
  const impl = async (url, init) => {
    calls.push({ url, init })
    if (url.includes('GetUrlSubmissionQuota')) {
      return { ok: quotaStatus === 200, status: quotaStatus, text: async () => JSON.stringify({ d: { DailyQuota: daily, MonthlyQuota: monthly } }) }
    }
    const status = batchStatuses[batchIdx++] ?? 200
    return { ok: status === 200, status, text: async () => (status === 200 ? '{"d":null}' : '{"ErrorCode":3,"Message":"bad apikey=' + KEY + '"}') }
  }
  return { impl, calls }
}

test('loadBwtConfig: null without a key, env wins, secrets file is the fallback', () => {
  assert.equal(loadBwtConfig({ env: {}, readFile: () => { throw new Error('ENOENT') } }), null)
  assert.deepEqual(loadBwtConfig({ env: { BWT_API_KEY: ' abc ' }, readFile: () => '' }), { key: 'abc', siteUrl: 'https://figurepinner.com' })
  const file = 'CF_TOKEN=x\r\nBWT_API_KEY="fromfile"\r\nBWT_SITE_URL=https://figurepinner.com/\r\n'
  assert.deepEqual(loadBwtConfig({ env: {}, readFile: () => file }), { key: 'fromfile', siteUrl: 'https://figurepinner.com/' })
})

test('submitViaBwt: full set accepted, split at the 500-URL batch limit', async () => {
  const { impl, calls } = fakeFetch()
  const list = urls(BWT_BATCH_MAX + 20)
  const r = await submitViaBwt(list, config, { fetchImpl: impl })
  assert.equal(r.status, 'bwt-200')
  assert.equal(r.submitted.length, list.length)
  assert.equal(r.skipped.length, 0)
  const posts = calls.filter((c) => c.init?.method === 'POST')
  assert.equal(posts.length, 2)
  assert.equal(JSON.parse(posts[0].init.body).urlList.length, BWT_BATCH_MAX)
  assert.equal(JSON.parse(posts[1].init.body).siteUrl, 'https://figurepinner.com')
})

test('submitViaBwt: quota caps what is sent; the rest is skipped in order', async () => {
  const { impl } = fakeFetch({ daily: 7 })
  const list = urls(10)
  const r = await submitViaBwt(list, config, { fetchImpl: impl })
  assert.equal(r.status, 'bwt-200')
  assert.deepEqual(r.submitted, list.slice(0, 7))
  assert.deepEqual(r.skipped, list.slice(7))
})

test('submitViaBwt: zero quota attempts nothing', async () => {
  const { impl, calls } = fakeFetch({ daily: 0 })
  const r = await submitViaBwt(urls(5), config, { fetchImpl: impl })
  assert.equal(r.status, 'bwt-no-quota')
  assert.equal(r.submitted.length, 0)
  assert.equal(calls.filter((c) => c.init?.method === 'POST').length, 0)
})

test('submitViaBwt: rejection and partial failure never leak the key and never throw', async () => {
  const rejected = await submitViaBwt(urls(5), config, { fetchImpl: fakeFetch({ batchStatuses: [400] }).impl })
  assert.equal(rejected.status, 'bwt-400')
  assert.equal(rejected.submitted.length, 0)
  assert.ok(!rejected.note.includes(KEY))

  const list = urls(BWT_BATCH_MAX + 5)
  const partial = await submitViaBwt(list, config, { fetchImpl: fakeFetch({ batchStatuses: [200, 500] }).impl })
  assert.equal(partial.status, 'bwt-partial')
  assert.deepEqual(partial.submitted, list.slice(0, BWT_BATCH_MAX))
  assert.deepEqual(partial.skipped, list.slice(BWT_BATCH_MAX))

  const boom = await submitViaBwt(urls(3), config, { fetchImpl: async () => { throw new Error('ECONNRESET ' + KEY) } })
  assert.equal(boom.status, 'bwt-error')
  assert.ok(!boom.note.includes(KEY))
})
