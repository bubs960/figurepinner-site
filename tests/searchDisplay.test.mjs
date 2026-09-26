import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { fandomName, FANDOM_DISPLAY, SOLD_COUNT_CONFIDENCE_FLOOR } from '../src/lib/searchDisplay.ts'

describe('fandomName — known dictionary entries', () => {
  test('every FANDOM_DISPLAY key resolves to its exact mapped value', () => {
    for (const [slug, display] of Object.entries(FANDOM_DISPLAY)) {
      assert.equal(fandomName(slug), display)
    }
  })

  test('dictionary lookup is case-sensitive — an exact-case miss falls through to title-casing', () => {
    assert.equal(fandomName('NECA'), 'NECA') // coincidentally already all-caps
    assert.equal(fandomName('Neca'), 'Neca') // title-cased fallback, NOT 'NECA'
  })
})

describe('fandomName — title-case fallback for unknown slugs', () => {
  test('single word is capitalized', () => {
    assert.equal(fandomName('spawn2'), 'Spawn2')
  })

  test('hyphens become spaces, each segment capitalized', () => {
    assert.equal(fandomName('professional-wrestling'), 'Professional Wrestling')
    assert.equal(fandomName('some-unmapped-fandom'), 'Some Unmapped Fandom')
  })

  test('documents current behavior: only the first letter of each segment is uppercased — the rest of an already-uppercase segment stays uppercase', () => {
    // charAt(0).toUpperCase() + slice(1) never lowercases the remainder, so
    // an all-caps unmapped slug renders as all-caps words, not Title Case.
    assert.equal(fandomName('STAR-WARS'), 'STAR WARS')
    assert.equal(fandomName('MiXeD-CaSe'), 'MiXeD CaSe')
  })

  test('documents current behavior: an empty string maps to an empty string', () => {
    assert.equal(fandomName(''), '')
  })

  test('documents current behavior: leading/trailing/doubled hyphens produce empty segments, which join() renders as literal spaces', () => {
    assert.equal(fandomName('--'), '  ')
    assert.equal(fandomName('foo-'), 'Foo ')
    assert.equal(fandomName('-foo'), ' Foo')
    assert.equal(fandomName('foo--bar'), 'Foo  Bar')
  })

  test('a single hyphen character alone becomes two empty segments -> one space', () => {
    assert.equal(fandomName('-'), ' ')
  })
})

describe('SOLD_COUNT_CONFIDENCE_FLOOR', () => {
  test('is the documented value of 5', () => {
    assert.equal(SOLD_COUNT_CONFIDENCE_FLOOR, 5)
  })
})
