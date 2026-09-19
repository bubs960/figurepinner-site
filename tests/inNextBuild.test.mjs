// inNextBuild gates the two build-time callers of getCloudflareContext({ async: true })
// (kbLite.ts, priceStore.ts). Trains #9 (9/12) and #15 (9/19) died in `next build` because
// that call spawns a local workerd per build worker. The dangerous direction is a FALSE
// POSITIVE: true inside a real Worker would cut production off from ASSETS / R2 / KV.
import { test, describe, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { inNextBuild } from '../src/lib/inNextBuild.ts'

const realPhase = process.env.NEXT_PHASE
const realNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
function setUserAgent(ua) {
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: ua }, configurable: true })
}
afterEach(() => {
  if (realPhase === undefined) delete process.env.NEXT_PHASE
  else process.env.NEXT_PHASE = realPhase
  if (realNavigator) Object.defineProperty(globalThis, 'navigator', realNavigator)
  else delete globalThis.navigator
})

describe('inNextBuild', () => {
  test('true in a Node process during next build', () => {
    process.env.NEXT_PHASE = 'phase-production-build'
    setUserAgent('Node.js/24')
    assert.equal(inNextBuild(), true)
  })

  test('false outside a build: no NEXT_PHASE, dev server, production server', () => {
    delete process.env.NEXT_PHASE
    assert.equal(inNextBuild(), false)
    for (const phase of ['phase-development-server', 'phase-production-server']) {
      process.env.NEXT_PHASE = phase
      assert.equal(inNextBuild(), false, phase)
    }
  })

  test('false inside a Worker even if NEXT_PHASE leaked into its env', () => {
    process.env.NEXT_PHASE = 'phase-production-build'
    setUserAgent('Cloudflare-Workers')
    assert.equal(inNextBuild(), false)
  })
})

describe('build-time getCloudflareContext({ async: true }) callers stay gated', () => {
  for (const file of ['src/data/kbLite.ts', 'src/lib/priceStore.ts']) {
    test(`${file} checks inNextBuild() before the async context call`, () => {
      const src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
      const gate = src.indexOf('inNextBuild()')
      const call = src.indexOf('getCloudflareContext({ async: true })')
      assert.ok(gate !== -1, 'inNextBuild() gate missing')
      assert.ok(call !== -1, 'async context call not found (renamed? update this test)')
      assert.ok(gate < call, 'gate must come before the call')
    })
  }
})
