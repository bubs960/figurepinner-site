import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { isFigurePageRoute, needsClerkPipeline } from '../src/lib/routeClassification.ts'

// 2026-07-19 (adversarial-verify catch on Data Defense Layer 2, commit
// bad33cd): isFigurePageRoute only checked segment COUNT ('/figure/x' = 2,
// anything-else/anything-else/anything-else = 3), which structurally also
// matched reserved 3-segment paths like /api/admin/health, /api/vault/[id],
// /api/wantlist/[id], /api/alerts/[id]. Those got misclassified as figure
// pages, routed to the rate limiter, and returned BEFORE clerkHandler ever
// ran -- Clerk's own auth() throws when clerkMiddleware never wrapped the
// request, so every one of those endpoints would have 500'd on deploy. The
// fix makes isFigurePageRoute defer to needsClerkPipeline's reserved-prefix
// list first. This test guards against the same regression class recurring
// (a future widened matcher/route shape colliding with a reserved prefix).

describe('middleware route classification', () => {
  test('genuine figure-detail routes are classified as figure pages', () => {
    assert.equal(isFigurePageRoute('/figure/fp_wrestling_hasbro_wwf-hasbro_5_hulk-hogan_1a3137'), true)
    assert.equal(isFigurePageRoute('/wrestling/wwf-hasbro/hulk-hogan'), true)
    assert.equal(isFigurePageRoute('/star-wars/black-series/darth-vader-anh'), true)
  })

  test('character-hub pages (same 3-segment shape) are excluded', () => {
    assert.equal(isFigurePageRoute('/wrestling/character/hulk-hogan'), false)
    assert.equal(isFigurePageRoute('/star-wars/character/darth-vader'), false)
  })

  test('reserved-prefix API/auth routes are NEVER classified as figure pages, even when they structurally match the 3-segment shape (the actual bug)', () => {
    assert.equal(isFigurePageRoute('/api/admin/health'), false)
    assert.equal(isFigurePageRoute('/api/admin/kv-audit'), false)
    assert.equal(isFigurePageRoute('/api/admin/news'), false)
    assert.equal(isFigurePageRoute('/api/vault/123'), false)
    assert.equal(isFigurePageRoute('/api/wantlist/123'), false)
    assert.equal(isFigurePageRoute('/api/alerts/123'), false)
  })

  test('reserved-prefix routes stay excluded from figure-page classification regardless of segment count', () => {
    assert.equal(isFigurePageRoute('/app/vault'), false)
    assert.equal(isFigurePageRoute('/admin'), false)
    assert.equal(isFigurePageRoute('/trpc/some/deep/path'), false)
    assert.equal(isFigurePageRoute('/sign-in/factor-one'), false)
    assert.equal(isFigurePageRoute('/sign-up/verify-email-address'), false)
  })

  test('needsClerkPipeline matches exactly the reserved prefixes', () => {
    assert.equal(needsClerkPipeline('/api/admin/health'), true)
    assert.equal(needsClerkPipeline('/app/vault'), true)
    assert.equal(needsClerkPipeline('/admin'), true)
    assert.equal(needsClerkPipeline('/trpc/foo'), true)
    assert.equal(needsClerkPipeline('/sign-in'), true)
    assert.equal(needsClerkPipeline('/sign-up'), true)
    assert.equal(needsClerkPipeline('/wrestling/wwf-hasbro/hulk-hogan'), false)
    assert.equal(needsClerkPipeline('/figure/fp_abc123'), false)
  })

  // 2026-07-19 (webaudit SHOULD-class hardening notes on the deploy-queue
  // gate, both pre-existing, neither a blocker at the time): bare
  // startsWith(prefix) also matches an unrelated longer segment, and _next
  // wasn't in the reserved list at all. Neither had a real live route to
  // exploit it, but both are now closed for good.
  test('exact-segment matching: a longer unrelated segment does NOT falsely match a reserved prefix', () => {
    assert.equal(needsClerkPipeline('/apple/foo'), false)
    assert.equal(needsClerkPipeline('/administrator/panel'), false)
    assert.equal(needsClerkPipeline('/trpcfoo/bar'), false)
    assert.equal(needsClerkPipeline('/sign-instant/whatever'), false)
    assert.equal(needsClerkPipeline('/sign-upward/mobility'), false)
    // exact match (no trailing segment) still counts
    assert.equal(needsClerkPipeline('/app'), true)
    assert.equal(needsClerkPipeline('/admin'), true)
  })

  test('_next is now a reserved prefix (defensive close, currently inert -- no live /_next/* path is 2-3 segments)', () => {
    assert.equal(needsClerkPipeline('/_next'), true)
    assert.equal(needsClerkPipeline('/_next/static/chunk.js'), true)
    assert.equal(isFigurePageRoute('/_next/foo'), false)
  })
})
