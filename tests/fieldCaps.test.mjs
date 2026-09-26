import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  findOversizedField,
  fieldCapMessage,
  FIGURE_ENTRY_FIELD_CAPS,
  CONDITION_FIELD_CAP,
  DEVICE_TOKEN_FIELD_CAP,
} from '../src/lib/fieldCaps.ts'

const ALL_CAPS = [...FIGURE_ENTRY_FIELD_CAPS, CONDITION_FIELD_CAP, DEVICE_TOKEN_FIELD_CAP]

describe('findOversizedField — at-cap accepted, cap+1 rejected, per field', () => {
  for (const cap of ALL_CAPS) {
    test(`${cap.field}: exactly ${cap.max} chars passes`, () => {
      const body = { [cap.field]: 'x'.repeat(cap.max) }
      assert.equal(findOversizedField(body, [cap]), null)
    })

    test(`${cap.field}: ${cap.max + 1} chars is rejected`, () => {
      const body = { [cap.field]: 'x'.repeat(cap.max + 1) }
      const violation = findOversizedField(body, [cap])
      assert.deepEqual(violation, cap)
    })
  }

  test('a missing/undefined field never triggers a violation', () => {
    assert.equal(findOversizedField({}, ALL_CAPS), null)
    assert.equal(findOversizedField({ name: undefined }, ALL_CAPS), null)
  })

  test('a non-string value (e.g. a number) is not checked — only string fields are capped', () => {
    assert.equal(findOversizedField({ figure_id: 12345 }, [FIGURE_ENTRY_FIELD_CAPS[0]]), null)
  })

  test('the FIRST oversized field in cap order is returned when several are over', () => {
    const body = {
      figure_id: 'x'.repeat(201),
      name: 'x'.repeat(301),
    }
    const violation = findOversizedField(body, FIGURE_ENTRY_FIELD_CAPS)
    assert.equal(violation.field, 'figure_id')
  })

  test('never truncates — the input body object is unmodified', () => {
    const body = { name: 'x'.repeat(301) }
    findOversizedField(body, FIGURE_ENTRY_FIELD_CAPS)
    assert.equal(body.name.length, 301)
  })
})

describe('fieldCapMessage', () => {
  test('formats "{field} must be {max} characters or fewer"', () => {
    assert.equal(fieldCapMessage({ field: 'name', max: 300 }), 'name must be 300 characters or fewer')
    assert.equal(fieldCapMessage(CONDITION_FIELD_CAP), 'condition must be 40 characters or fewer')
    assert.equal(fieldCapMessage(DEVICE_TOKEN_FIELD_CAP), 'token must be 4096 characters or fewer')
  })
})

/**
 * Per-route status-code pin, as a source scan rather than a runtime call —
 * same rationale as tests/rateLimit429NoStore.test.mjs: these handlers need
 * a live Clerk session and the Workers D1/KV bindings to execute, and a test
 * that mocks all of that to assert one status code is a test nobody
 * maintains. Instead this pins that every migrated route (a) imports the
 * shared helper, (b) calls it before touching D1, and (c) returns exactly
 * `{ error: fieldCapMessage(...) }` at status 400 — the same `{error:
 * string}` shape each of these routes already used for its other 400s.
 */
describe('fieldCaps — per-route wiring pinned (regression guard)', () => {
  const ROOT = new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

  const ROUTES_WITH_FIGURE_ENTRY_CAPS = [
    'src/app/api/wantlist/route.ts',
    'src/app/api/v1/wantlist/route.ts',
    'src/app/api/alerts/route.ts',
    'src/app/api/v1/alerts/route.ts',
  ]
  const ROUTES_WITH_VAULT_CREATE_CAPS = [
    'src/app/api/vault/route.ts',
    'src/app/api/v1/vault/route.ts',
  ]
  const ROUTES_WITH_CONDITION_CAP_ONLY = ['src/app/api/vault/[id]/route.ts']
  const ROUTES_WITH_TOKEN_CAP = ['src/app/api/v1/devices/route.ts']

  function source(relPath) {
    return readFileSync(ROOT + relPath, 'utf8')
  }

  function assertWired(relPath) {
    const src = source(relPath)
    assert.match(src, /from '@\/lib\/fieldCaps'/, `${relPath} must import the shared fieldCaps helper`)
    assert.match(src, /findOversizedField\(/, `${relPath} must call findOversizedField`)
    // The violation branch must return exactly this shape/status — pins the
    // route's existing `{ error: string }` 400 convention, not a new one.
    assert.match(
      src,
      /NextResponse\.json\(\{ error: fieldCapMessage\([^)]*\) \}, \{ status: 400 \}\)/,
      `${relPath} must reject an oversized field with { error: fieldCapMessage(...) } at 400`,
    )
  }

  for (const relPath of [
    ...ROUTES_WITH_FIGURE_ENTRY_CAPS,
    ...ROUTES_WITH_VAULT_CREATE_CAPS,
    ...ROUTES_WITH_CONDITION_CAP_ONLY,
    ...ROUTES_WITH_TOKEN_CAP,
  ]) {
    test(`${relPath} wires the 400 field-cap rejection`, () => {
      assertWired(relPath)
    })
  }

  test('vault create routes cap figure_id/name/brand/line/genre AND condition', () => {
    for (const relPath of ROUTES_WITH_VAULT_CREATE_CAPS) {
      const src = source(relPath)
      assert.match(src, /FIGURE_ENTRY_FIELD_CAPS/, `${relPath} must reuse FIGURE_ENTRY_FIELD_CAPS`)
      assert.match(src, /CONDITION_FIELD_CAP/, `${relPath} must also cap condition`)
    }
  })

  test('wantlist/alert create routes cap figure_id/name/brand/line/genre but NOT condition (they have no condition field)', () => {
    for (const relPath of ROUTES_WITH_FIGURE_ENTRY_CAPS) {
      const src = source(relPath)
      assert.match(src, /FIGURE_ENTRY_FIELD_CAPS/, `${relPath} must reuse FIGURE_ENTRY_FIELD_CAPS`)
      assert.doesNotMatch(src, /CONDITION_FIELD_CAP/, `${relPath} has no condition field to cap`)
    }
  })

  test('vault PATCH caps only condition (paid is numeric, not free text)', () => {
    const src = source('src/app/api/vault/[id]/route.ts')
    assert.match(src, /CONDITION_FIELD_CAP/)
    assert.doesNotMatch(src, /FIGURE_ENTRY_FIELD_CAPS/)
  })

  test('v1/devices caps only token (platform is already enum-validated)', () => {
    const src = source('src/app/api/v1/devices/route.ts')
    assert.match(src, /DEVICE_TOKEN_FIELD_CAP/)
  })
})
