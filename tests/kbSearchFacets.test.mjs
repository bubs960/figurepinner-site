import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { aggregateGenreFacets } from '../src/app/api/v1/_lib/kbSearch.ts'

/** Minimal scored-pool entry — aggregateGenreFacets only reads f.fandom. */
function entry(fandom) {
  return { f: { fandom } }
}

describe('aggregateGenreFacets', () => {
  test('counts each fandom across the pool', () => {
    const pool = [
      entry('wrestling'),
      entry('wrestling'),
      entry('marvel-comics'),
      entry('star-wars'),
      entry('wrestling'),
    ]
    assert.deepEqual(aggregateGenreFacets(pool), {
      wrestling: 3,
      'marvel-comics': 1,
      'star-wars': 1,
    })
  })

  test('empty pool → empty object', () => {
    assert.deepEqual(aggregateGenreFacets([]), {})
  })

  test('single-fandom pool has one key with the full count', () => {
    const pool = Array.from({ length: 7 }, () => entry('gi-joe'))
    assert.deepEqual(aggregateGenreFacets(pool), { 'gi-joe': 7 })
  })

  // ── 2026-07-27 — this block REPLACES a test that asserted the opposite:
  // "preserves raw KB fandom slugs (no remapping — the client maps display
  // names)", which expected ['aliens-predator', 'tmnt'] from this exact pool.
  //
  // The old test's premise was half right and the conclusion didn't follow.
  // The client does map display names (fandomName), but these keys are ALSO
  // handed to /search as `?genre=<key>` by the hero pill, and SearchInterface
  // validates that value against its own GENRES list before applying it.
  // GENRES has no 'aliens-predator' entry — the four NECA fandoms only appear
  // there as the rolled-up 'neca'. So a raw key produced a pill with a real
  // count that silently filtered nothing when clicked, which is the live bug
  // this test was locking in. Raw-ness was never the contract; matching the
  // client's genre namespace is.
  test('rolls the NECA family up to the single client-facing "neca" key', () => {
    const facets = aggregateGenreFacets([entry('tmnt'), entry('aliens-predator')])
    assert.deepEqual(Object.keys(facets).sort(), ['neca', 'tmnt'])
  })

  test('all four NECA fandoms collapse into one key with a summed count', () => {
    const pool = [
      entry('horror'), entry('horror'),
      entry('aliens-predator'),
      entry('terminator'),
      entry('robocop'),
      entry('wrestling'),
    ]
    assert.deepEqual(aggregateGenreFacets(pool), { neca: 5, wrestling: 1 })
  })

  test('every non-NECA fandom passes through unchanged', () => {
    const pool = [entry('marvel-comics'), entry('gi-joe'), entry('tmnt'), entry('spawn')]
    assert.deepEqual(aggregateGenreFacets(pool), {
      'marvel-comics': 1, 'gi-joe': 1, tmnt: 1, spawn: 1,
    })
  })
})
