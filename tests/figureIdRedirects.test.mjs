// Structural guard for FIGURE_ID_REDIRECTS — added 2026-08-27 with the Rey
// Mysterio S&S rekey entry (Batch 20). pretty-path-redirects.ts gets these
// checks from scripts/validate-pretty-path-redirects.mjs on every deploy; the
// fid map had no equivalent, so a typo'd target (or a source fid matcher later
// re-adds to the KB) would fail silently at request time: a missing target
// falls through to 404 by design, and a still-live source never consults the
// map at all. Both failure modes are invisible without this test.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { FIGURE_ID_REDIRECTS } from '../src/data/figure-id-redirects.ts'

const require = createRequire(import.meta.url)
const { FIGURES_V2 } = require('../src/data/figures-reference-v2.slim.js')
const liveIds = new Set(FIGURES_V2.map(f => f.figure_id))

describe('FIGURE_ID_REDIRECTS structural integrity', () => {
  test('every target exists in the live KB', () => {
    for (const [source, target] of Object.entries(FIGURE_ID_REDIRECTS)) {
      assert.ok(liveIds.has(target), `target of ${source} is not in the KB: ${target}`)
    }
  })

  test('no source fid is still live in the KB (a live source shadows its redirect)', () => {
    for (const source of Object.keys(FIGURE_ID_REDIRECTS)) {
      assert.ok(!liveIds.has(source), `source is still a live fid, redirect would never fire: ${source}`)
    }
  })

  test('single hop: no target is itself a redirect source, no self-redirects', () => {
    for (const [source, target] of Object.entries(FIGURE_ID_REDIRECTS)) {
      assert.notEqual(source, target, `self-redirect: ${source}`)
      assert.ok(!(target in FIGURE_ID_REDIRECTS), `redirect chain: ${source} -> ${target} -> ${FIGURE_ID_REDIRECTS[target]}`)
    }
  })
})
