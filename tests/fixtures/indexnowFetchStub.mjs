// Test double for tests/indexnowUrlsFileFallback.test.mjs — loaded with `node --import` into a
// scripts/indexnow-ping.mjs subprocess. No network: fetch is replaced, and the 5 s IndexNow retry
// delay is collapsed so a rejecting run finishes in milliseconds.
//
// Behaviour comes from env: STUB_LOG (file that receives one JSON line per call),
// STUB_INDEXNOW (status for api.indexnow.org, default 403), STUB_BWT_DAILY (quota, default 100),
// STUB_BWT_BATCH (status for SubmitUrlBatch, default 200).
import { appendFileSync } from 'node:fs'

const record = (entry) => appendFileSync(process.env.STUB_LOG, JSON.stringify(entry) + '\n')
const realSetTimeout = globalThis.setTimeout
globalThis.setTimeout = (fn, _ms, ...rest) => realSetTimeout(fn, 0, ...rest)

globalThis.fetch = async (url, init = {}) => {
  const target = String(url)
  const body = init.body ? JSON.parse(init.body) : null

  if (target.includes('api.indexnow.org')) {
    record({ svc: 'indexnow', method: init.method || 'GET', urls: body?.urlList?.length ?? 0 })
    const status = Number(process.env.STUB_INDEXNOW || 403)
    return { ok: status >= 200 && status < 300, status, headers: { get: () => null }, text: async () => 'stub indexnow' }
  }
  if (target.includes('GetUrlSubmissionQuota')) {
    record({ svc: 'bwt-quota' })
    const daily = Number(process.env.STUB_BWT_DAILY || 100)
    return { ok: true, status: 200, text: async () => JSON.stringify({ d: { DailyQuota: daily, MonthlyQuota: 3000 } }) }
  }
  if (target.includes('SubmitUrlBatch')) {
    record({ svc: 'bwt-batch', urls: body.urlList })
    const status = Number(process.env.STUB_BWT_BATCH || 200)
    return { ok: status === 200, status, text: async () => (status === 200 ? '{"d":null}' : 'stub bwt reject') }
  }
  throw new Error('indexnowFetchStub: unexpected fetch ' + target.replace(/apikey=[^&]*/, 'apikey=***'))
}
