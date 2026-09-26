import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { requireAdmin } from '../src/lib/requireAdmin.ts'

function reqWithHeader(name, value) {
  const headers = value === undefined ? {} : { [name]: value }
  return new Request('https://figurepinner.com/api/x', { headers })
}

describe('requireAdmin — secret-header gate (cache-stats/daily-uniques/funnel-stats style)', () => {
  test('missing secret env fails closed with 503, regardless of header', () => {
    delete process.env.TEST_SECRET_KEY
    const denial = requireAdmin({
      kind: 'secret',
      request: reqWithHeader('x-test-key', 'anything'),
      header: 'x-test-key',
      envVar: 'TEST_SECRET_KEY',
    })
    assert.ok(denial)
    assert.equal(denial.status, 503)
    assert.deepEqual(denial.body, { error: 'admin_endpoint_not_configured' })
    assert.equal(denial.headers?.['Cache-Control'], 'no-store')
  })

  test('wrong or missing header is 401 unauthorized when secret IS configured', () => {
    process.env.TEST_SECRET_KEY = 'correct-horse-battery-staple'
    try {
      const wrong = requireAdmin({
        kind: 'secret',
        request: reqWithHeader('x-test-key', 'nope'),
        header: 'x-test-key',
        envVar: 'TEST_SECRET_KEY',
      })
      assert.ok(wrong)
      assert.equal(wrong.status, 401)
      assert.deepEqual(wrong.body, { error: 'unauthorized' })
      assert.equal(wrong.headers?.['Cache-Control'], 'no-store')

      const missing = requireAdmin({
        kind: 'secret',
        request: reqWithHeader('x-test-key', undefined),
        header: 'x-test-key',
        envVar: 'TEST_SECRET_KEY',
      })
      assert.ok(missing)
      assert.equal(missing.status, 401)
    } finally {
      delete process.env.TEST_SECRET_KEY
    }
  })

  test('the correct header passes (returns null)', () => {
    process.env.TEST_SECRET_KEY = 'correct-horse-battery-staple'
    try {
      const denial = requireAdmin({
        kind: 'secret',
        request: reqWithHeader('x-test-key', 'correct-horse-battery-staple'),
        header: 'x-test-key',
        envVar: 'TEST_SECRET_KEY',
      })
      assert.equal(denial, null)
    } finally {
      delete process.env.TEST_SECRET_KEY
    }
  })
})

describe('requireAdmin — allowlist gate (admin/health, admin/kv-audit, admin/news style)', () => {
  test('no signed-in userId is 401 Unauthorized', () => {
    const denial = requireAdmin({ kind: 'allowlist', userId: null })
    assert.ok(denial)
    assert.equal(denial.status, 401)
    assert.deepEqual(denial.body, { error: 'Unauthorized' })
  })

  test('missing/empty FP_ADMIN_USER_IDS fails closed with 503 by default (admin/health, admin/news)', () => {
    delete process.env.FP_ADMIN_USER_IDS
    const denial = requireAdmin({ kind: 'allowlist', userId: 'user_123' })
    assert.ok(denial)
    assert.equal(denial.status, 503)
    assert.deepEqual(denial.body, { error: 'admin_endpoint_not_configured' })
  })

  test('notConfiguredMessage is included on the 503 body when provided (admin/health)', () => {
    delete process.env.FP_ADMIN_USER_IDS
    const denial = requireAdmin({
      kind: 'allowlist',
      userId: 'user_123',
      notConfiguredMessage: 'Set FP_ADMIN_USER_IDS env var on the worker (comma-separated Clerk user IDs).',
    })
    assert.equal(denial.status, 503)
    assert.deepEqual(denial.body, {
      error: 'admin_endpoint_not_configured',
      message: 'Set FP_ADMIN_USER_IDS env var on the worker (comma-separated Clerk user IDs).',
    })
  })

  test('emptyAllowlist: "forbidden" collapses an unset allowlist into 403 for a signed-in user (admin/kv-audit)', () => {
    delete process.env.FP_ADMIN_USER_IDS
    const denial = requireAdmin({ kind: 'allowlist', userId: 'user_123', emptyAllowlist: 'forbidden' })
    assert.equal(denial.status, 403)
    assert.deepEqual(denial.body, { error: 'Forbidden' })
  })

  test('a userId not on a non-empty allowlist is 403 Forbidden', () => {
    process.env.FP_ADMIN_USER_IDS = 'user_allowed_1,user_allowed_2'
    try {
      const denial = requireAdmin({ kind: 'allowlist', userId: 'user_intruder' })
      assert.equal(denial.status, 403)
      assert.deepEqual(denial.body, { error: 'Forbidden' })
    } finally {
      delete process.env.FP_ADMIN_USER_IDS
    }
  })

  test('a userId on the allowlist passes (returns null)', () => {
    process.env.FP_ADMIN_USER_IDS = ' user_allowed_1 , user_allowed_2 '
    try {
      const denial = requireAdmin({ kind: 'allowlist', userId: 'user_allowed_2' })
      assert.equal(denial, null)
    } finally {
      delete process.env.FP_ADMIN_USER_IDS
    }
  })
})

describe('requireAdmin — per-route status codes pinned (regression guard)', () => {
  test('cache-stats / funnel-stats shape: unauthorized body is lowercase "unauthorized"', () => {
    process.env.CACHE_STATS_KEY = 'k'
    try {
      const denial = requireAdmin({
        kind: 'secret',
        request: reqWithHeader('x-cache-stats-key', 'wrong'),
        header: 'x-cache-stats-key',
        envVar: 'CACHE_STATS_KEY',
      })
      assert.equal(denial.status, 401)
      assert.deepEqual(denial.body, { error: 'unauthorized' })
    } finally {
      delete process.env.CACHE_STATS_KEY
    }
  })

  test('daily-uniques debug gate: unset DAILY_UNIQUES_DEBUG_KEY still 503s independently of CACHE_STATS_KEY', () => {
    process.env.CACHE_STATS_KEY = 'k'
    delete process.env.DAILY_UNIQUES_DEBUG_KEY
    try {
      const denial = requireAdmin({
        kind: 'secret',
        request: reqWithHeader('x-daily-uniques-key', 'anything'),
        header: 'x-daily-uniques-key',
        envVar: 'DAILY_UNIQUES_DEBUG_KEY',
      })
      assert.equal(denial.status, 503)
    } finally {
      delete process.env.CACHE_STATS_KEY
    }
  })

  test('admin/health: unauthenticated body is capitalized "Unauthorized" (differs from secret-gate wording)', () => {
    const denial = requireAdmin({ kind: 'allowlist', userId: null, notConfiguredMessage: 'irrelevant here' })
    assert.equal(denial.status, 401)
    assert.deepEqual(denial.body, { error: 'Unauthorized' })
  })

  test('admin/kv-audit: unauthenticated is 401 even with emptyAllowlist "forbidden"', () => {
    const denial = requireAdmin({ kind: 'allowlist', userId: null, emptyAllowlist: 'forbidden' })
    assert.equal(denial.status, 401)
    assert.deepEqual(denial.body, { error: 'Unauthorized' })
  })
})
