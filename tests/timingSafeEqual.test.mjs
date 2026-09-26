import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { timingSafeEqual } from '../src/lib/timingSafeEqual.ts'

describe('timingSafeEqual', () => {
  test('identical strings match', () => {
    assert.equal(timingSafeEqual('secret-value', 'secret-value'), true)
  })

  test('different strings of the same length do not match', () => {
    assert.equal(timingSafeEqual('secret-value', 'secret-valuf'), false)
  })

  test('a single differing character anywhere still fails', () => {
    assert.equal(timingSafeEqual('aaaaaaaaaa', 'aaaaaXaaaa'), false)
    assert.equal(timingSafeEqual('Xaaaaaaaaa', 'aaaaaaaaaa'), false)
    assert.equal(timingSafeEqual('aaaaaaaaaX', 'aaaaaaaaaa'), false)
  })

  test('different lengths never match, even when one is a prefix of the other', () => {
    assert.equal(timingSafeEqual('short', 'shorter'), false)
    assert.equal(timingSafeEqual('shorter', 'short'), false)
  })

  test('case sensitive', () => {
    assert.equal(timingSafeEqual('ABC', 'abc'), false)
  })

  test('documents current behavior: two empty strings are considered equal', () => {
    // length check passes (0 === 0), the comparison loop never runs, and diff
    // stays 0 -- so an empty `a` and empty `b` compare true. Callers in this
    // codebase (cache-stats, funnel-stats, stripeSignature) all guard against
    // an empty/missing secret BEFORE calling this, so this path is never hit
    // in practice, but the function itself has no such guard.
    assert.equal(timingSafeEqual('', ''), true)
  })

  test('an empty string never matches a non-empty one', () => {
    assert.equal(timingSafeEqual('', 'x'), false)
    assert.equal(timingSafeEqual('x', ''), false)
  })

  test('astral (surrogate-pair) characters are compared as UTF-16 code units, not code points', () => {
    // '😀' is two UTF-16 code units; length-based comparison still works
    // correctly here because both sides are decomposed the same way.
    assert.equal(timingSafeEqual('a😀b', 'a😀b'), true)
    assert.equal(timingSafeEqual('a😀b', 'a😁b'), false)
  })

  test('whitespace and punctuation differences are not ignored', () => {
    assert.equal(timingSafeEqual('token 1', 'token1'), false)
    assert.equal(timingSafeEqual('token1 ', 'token1'), false)
  })
})
