import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { installEnv, setUser, fakeDb, jsonReq, read } from './helpers/routeHarness.mjs'
import {
  FIGURE_ENTRY_FIELD_CAPS,
  CONDITION_FIELD_CAP,
  DEVICE_TOKEN_FIELD_CAP,
} from '../src/lib/fieldCaps.ts'

// Route-level pins for the user-data write routes PR #44 put behind
// fieldCaps. REAL handlers (framework imports stubbed test-time only by
// tests/helpers/routeStubLoader.mjs). Order pinned as the code has it today on
// every route: Clerk auth (401) -> required-field check (400) -> field cap (400)
// -> DB. The cap is checked before ANY D1 statement is prepared.

const routes = {
  vault: await import('../src/app/api/vault/route.ts'),
  vaultId: await import('../src/app/api/vault/[id]/route.ts'),
  wantlist: await import('../src/app/api/wantlist/route.ts'),
  alerts: await import('../src/app/api/alerts/route.ts'),
  v1Vault: await import('../src/app/api/v1/vault/route.ts'),
  v1Wantlist: await import('../src/app/api/v1/wantlist/route.ts'),
  v1Alerts: await import('../src/app/api/v1/alerts/route.ts'),
  v1Devices: await import('../src/app/api/v1/devices/route.ts'),
}

let db
beforeEach(() => {
  db = fakeDb({ allResults: [] }) // no existing rows: count=0, no duplicates
  installEnv({ DB: db })
  setUser(null)
})

const VALID = { figure_id: 'hasbro-ml-test_abc123', name: 'Test Figure' }
const VAULT_CAPS = [...FIGURE_ENTRY_FIELD_CAPS, CONDITION_FIELD_CAP]

const CREATE_ROUTES = [
  { name: '/api/vault', mod: routes.vault, caps: VAULT_CAPS },
  { name: '/api/wantlist', mod: routes.wantlist, caps: FIGURE_ENTRY_FIELD_CAPS },
  { name: '/api/alerts', mod: routes.alerts, caps: FIGURE_ENTRY_FIELD_CAPS },
  { name: '/api/v1/vault', mod: routes.v1Vault, caps: VAULT_CAPS },
  { name: '/api/v1/wantlist', mod: routes.v1Wantlist, caps: FIGURE_ENTRY_FIELD_CAPS },
  { name: '/api/v1/alerts', mod: routes.v1Alerts, caps: FIGURE_ENTRY_FIELD_CAPS },
]

for (const route of CREATE_ROUTES) {
  describe(`POST ${route.name}`, () => {
    const post = (body) => route.mod.POST(jsonReq(`https://figurepinner.com${route.name}`, 'POST', body))

    test('signed out -> 401 { error: "Unauthorized" }, even with an over-cap body (auth before cap); no DB call', async () => {
      const r = await read(await post({ ...VALID, figure_id: 'x'.repeat(10_000) }))
      assert.equal(r.status, 401)
      assert.deepEqual(r.body, { error: 'Unauthorized' })
      assert.equal(db.calls.length, 0)
    })

    test('GET signed out -> 401 { error: "Unauthorized" }', async () => {
      const r = await read(await route.mod.GET())
      assert.equal(r.status, 401)
      assert.deepEqual(r.body, { error: 'Unauthorized' })
    })

    test('ORDER: required-field check runs before the cap (missing name + over-cap figure_id)', async () => {
      setUser('user_1')
      const r = await read(await post({ figure_id: 'x'.repeat(10_000) }))
      assert.equal(r.status, 400)
      assert.deepEqual(r.body, { error: 'figure_id and name are required' })
    })

    test(`a field outside this route's cap list (condition, when not capped) is not length-checked`, async () => {
      setUser('user_1')
      // A field NOT in this route's cap list is not length-checked.
      const uncapped = route.caps.some((c) => c.field === 'condition') ? null : 'condition'
      if (uncapped) {
        const r = await post({ ...VALID, [uncapped]: 'x'.repeat(10_000) })
        assert.equal(r.status, 201)
      }
    })

    for (const cap of route.caps) {
      test(`${cap.field}: exactly ${cap.max} chars accepted (201)`, async () => {
        setUser('user_1')
        const r = await read(await post({ ...VALID, [cap.field]: 'x'.repeat(cap.max) }))
        assert.equal(r.status, 201)
        assert.equal(typeof r.body.id, 'string')
      })

      test(`${cap.field}: ${cap.max + 1} chars -> 400 { error: "${cap.field} must be ${cap.max} characters or fewer" }, no DB call`, async () => {
        setUser('user_1')
        const r = await read(await post({ ...VALID, [cap.field]: 'x'.repeat(cap.max + 1) }))
        assert.equal(r.status, 400)
        assert.deepEqual(r.body, { error: `${cap.field} must be ${cap.max} characters or fewer` })
        assert.equal(db.calls.length, 0)
      })
    }
  })
}

describe('PATCH /api/vault/[id]', () => {
  const patch = (body) =>
    routes.vaultId.PATCH(jsonReq('https://figurepinner.com/api/vault/row1', 'PATCH', body), {
      params: Promise.resolve({ id: 'row1' }),
    })

  test('signed out -> 401 even with an over-cap condition (auth before cap); no DB call', async () => {
    const r = await read(await patch({ condition: 'x'.repeat(41) }))
    assert.equal(r.status, 401)
    assert.deepEqual(r.body, { error: 'Unauthorized' })
    assert.equal(db.calls.length, 0)
  })

  test(`condition: exactly ${CONDITION_FIELD_CAP.max} chars accepted (200 { ok: true })`, async () => {
    setUser('user_1')
    const r = await read(await patch({ condition: 'x'.repeat(CONDITION_FIELD_CAP.max) }))
    assert.equal(r.status, 200)
    assert.deepEqual(r.body, { ok: true })
  })

  test(`condition: ${CONDITION_FIELD_CAP.max + 1} chars -> 400 cap message, no DB call`, async () => {
    setUser('user_1')
    const r = await read(await patch({ condition: 'x'.repeat(CONDITION_FIELD_CAP.max + 1) }))
    assert.equal(r.status, 400)
    assert.deepEqual(r.body, { error: 'condition must be 40 characters or fewer' })
    assert.equal(db.calls.length, 0)
  })

  test('ORDER: cap runs before the "No fields to update" check (only field present is over cap)', async () => {
    setUser('user_1')
    const r = await read(await patch({ condition: 'x'.repeat(41) }))
    assert.equal(r.body.error, 'condition must be 40 characters or fewer')
    const empty = await read(await patch({}))
    assert.equal(empty.status, 400)
    assert.deepEqual(empty.body, { error: 'No fields to update' })
  })

  test('only condition is capped on PATCH (paid is not length-checked)', async () => {
    setUser('user_1')
    const r = await patch({ paid: 12.5, name: 'x'.repeat(10_000) })
    assert.equal(r.status, 200)
  })

  test('DELETE signed out -> 401', async () => {
    const r = await read(
      await routes.vaultId.DELETE(new Request('https://figurepinner.com/api/vault/row1', { method: 'DELETE' }), {
        params: Promise.resolve({ id: 'row1' }),
      }),
    )
    assert.equal(r.status, 401)
    assert.deepEqual(r.body, { error: 'Unauthorized' })
  })

  test('documents current behavior: a JSON `null` PATCH body throws inside findOversizedField (no 400) for a signed-in user', async () => {
    setUser('user_1')
    await assert.rejects(() => patch('null'), TypeError)
  })
})

describe('/api/v1/devices', () => {
  const post = (body) => routes.v1Devices.POST(jsonReq('https://figurepinner.com/api/v1/devices', 'POST', body))
  const del = (body) => routes.v1Devices.DELETE(jsonReq('https://figurepinner.com/api/v1/devices', 'DELETE', body))
  const MAX = DEVICE_TOKEN_FIELD_CAP.max

  test('POST signed out -> 401 even with an over-cap token (auth before cap); no DB call', async () => {
    const r = await read(await post({ token: 'x'.repeat(MAX + 1), platform: 'ios' }))
    assert.equal(r.status, 401)
    assert.deepEqual(r.body, { error: 'Unauthorized' })
    assert.equal(db.calls.length, 0)
  })

  test(`POST token of exactly ${MAX} chars -> 201 { ok: true }`, async () => {
    setUser('user_1')
    const r = await read(await post({ token: 'x'.repeat(MAX), platform: 'ios' }))
    assert.equal(r.status, 201)
    assert.deepEqual(r.body, { ok: true })
  })

  test(`POST token of ${MAX + 1} chars -> 400 { error: "token must be ${MAX} characters or fewer" }, no DB call`, async () => {
    setUser('user_1')
    const r = await read(await post({ token: 'x'.repeat(MAX + 1), platform: 'ios' }))
    assert.equal(r.status, 400)
    assert.deepEqual(r.body, { error: `token must be ${MAX} characters or fewer` })
    assert.equal(db.calls.length, 0)
  })

  test('ORDER: "token is required" runs before the cap; the cap runs before the platform check', async () => {
    setUser('user_1')
    const blank = await read(await post({ token: '   ' }))
    assert.deepEqual(blank.body, { error: 'token is required' })
    const both = await read(await post({ token: 'x'.repeat(MAX + 1), platform: 'windows-phone' }))
    assert.deepEqual(both.body, { error: `token must be ${MAX} characters or fewer` })
    const platformOnly = await read(await post({ token: 'abc', platform: 'windows-phone' }))
    assert.equal(platformOnly.status, 400)
    assert.deepEqual(platformOnly.body, { error: 'platform must be ios, android, or web' })
  })

  test('documents current behavior: the cap measures the UNtrimmed token (4096 chars + 1 space is rejected though it stores as 4096)', async () => {
    setUser('user_1')
    const r = await read(await post({ token: 'x'.repeat(MAX) + ' ', platform: 'ios' }))
    assert.equal(r.status, 400)
  })

  test('DELETE signed out -> 401', async () => {
    const r = await read(await del({ token: 'abc' }))
    assert.equal(r.status, 401)
    assert.deepEqual(r.body, { error: 'Unauthorized' })
  })

  test('documents current behavior: DELETE has no token cap (an over-cap token reaches D1 and returns 200)', async () => {
    setUser('user_1')
    const r = await read(await del({ token: 'x'.repeat(MAX + 1) }))
    assert.equal(r.status, 200)
    assert.deepEqual(r.body, { ok: true })
    assert.equal(db.calls.length, 1)
  })
})
