// sessionHint — the cookie parse that decides whether a public page mounts
// Clerk at all (2026-09-03, Clerk off public pages). A wrong parse either
// shows "Log in" to a signed-in user or loads clerk-js for every anonymous
// visitor — the exact cost this change removed.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readSessionHint } from '../src/app/_lib/sessionHint.ts'

function withCookie(cookie, fn) {
  const prev = globalThis.document
  globalThis.document = { cookie }
  try { return fn() } finally {
    if (prev === undefined) delete globalThis.document
    else globalThis.document = prev
  }
}

describe('readSessionHint', () => {
  test('no document (server) -> false', () => {
    const prev = globalThis.document
    delete globalThis.document
    try { assert.equal(readSessionHint(), false) } finally { if (prev !== undefined) globalThis.document = prev }
  })
  test('__client_uat with a timestamp -> true', () => {
    assert.equal(withCookie('__client_uat=1725388800', readSessionHint), true)
  })
  test('__client_uat=0 (signed out) -> false', () => {
    assert.equal(withCookie('__client_uat=0', readSessionHint), false)
  })
  test('empty value -> false', () => {
    assert.equal(withCookie('__client_uat=', readSessionHint), false)
  })
  test('absent among other cookies -> false', () => {
    assert.equal(withCookie('a=1; __session=abc; b=2', readSessionHint), false)
  })
  test('found among other cookies with spaces -> true', () => {
    assert.equal(withCookie('a=1;  __client_uat=1725388800 ; b=2', readSessionHint), true)
  })
  test('keys off the cookie NAME, not a substring in another value', () => {
    assert.equal(withCookie('decoy=__client_uat=1725388800', readSessionHint), false)
    assert.equal(withCookie('x__client_uat=1725388800', readSessionHint), false)
    assert.equal(withCookie('decoy=__client_uat=1; __client_uat=0', readSessionHint), false)
  })
  test('value containing = is still read as non-zero', () => {
    assert.equal(withCookie('__client_uat=17=25', readSessionHint), true)
  })
})
