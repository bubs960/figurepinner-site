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

  test('preserves raw KB fandom slugs (no remapping — the client maps display names)', () => {
    const pool = [entry('tmnt'), entry('aliens-predator')]
    const facets = aggregateGenreFacets(pool)
    assert.deepEqual(Object.keys(facets).sort(), ['aliens-predator', 'tmnt'])
  })
})
