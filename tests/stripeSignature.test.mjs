import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { verifyStripeSignature } from '../src/lib/stripeSignature.ts'

const SECRET = 'whsec_test_current'
const OLD_SECRET = 'whsec_test_previous'
const BODY = '{"type":"customer.subscription.deleted"}'
const NOW = 1_790_000_000

async function sign(secret, t, body) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const bytes = await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${body}`))
  return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, '0')).join('')
}

describe('verifyStripeSignature', () => {
  test('a single valid v1 passes', async () => {
    const v1 = await sign(SECRET, NOW, BODY)
    assert.equal(await verifyStripeSignature(BODY, `t=${NOW},v1=${v1}`, SECRET, NOW), true)
  })

  test('during a secret roll, the valid v1 is accepted even when it is not the LAST entry', async () => {
    const current = await sign(SECRET, NOW, BODY)
    const old = await sign(OLD_SECRET, NOW, BODY)
    // Object.fromEntries kept only the last v1, so this header used to fail.
    assert.equal(await verifyStripeSignature(BODY, `t=${NOW},v1=${current},v1=${old}`, SECRET, NOW), true)
    assert.equal(await verifyStripeSignature(BODY, `t=${NOW},v1=${old},v1=${current}`, SECRET, NOW), true)
  })

  test('no matching v1 fails', async () => {
    const old = await sign(OLD_SECRET, NOW, BODY)
    assert.equal(await verifyStripeSignature(BODY, `t=${NOW},v1=${old}`, SECRET, NOW), false)
  })

  test('a tampered body fails', async () => {
    const v1 = await sign(SECRET, NOW, BODY)
    assert.equal(await verifyStripeSignature(BODY + ' ', `t=${NOW},v1=${v1}`, SECRET, NOW), false)
  })

  test('a timestamp more than 5 minutes off fails (replay)', async () => {
    const t = NOW - 301
    const v1 = await sign(SECRET, t, BODY)
    assert.equal(await verifyStripeSignature(BODY, `t=${t},v1=${v1}`, SECRET, NOW), false)
  })

  test('a missing t or v1 fails without throwing', async () => {
    const v1 = await sign(SECRET, NOW, BODY)
    assert.equal(await verifyStripeSignature(BODY, `v1=${v1}`, SECRET, NOW), false)
    assert.equal(await verifyStripeSignature(BODY, `t=${NOW}`, SECRET, NOW), false)
    assert.equal(await verifyStripeSignature(BODY, 'garbage', SECRET, NOW), false)
  })
})
