import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { derivePrettyPathRedirects, parsePrettyPath, recordServesPath, GENRE_TO_FANDOM } from '../scripts/lib/derive-pretty-path-redirects.mjs'
import { SLUG_TO_FANDOM } from '../src/data/kbTypes.ts'

const rec = (figure_id, fandom, manufacturer, product_line, character_canonical, extra = {}) => ({ figure_id, fandom, manufacturer, product_line, character_canonical, ...extra })

test('genre->fandom remap mirrors the router (kbTypes.SLUG_TO_FANDOM)', () => {
  assert.deepEqual(GENRE_TO_FANDOM, SLUG_TO_FANDOM)
})

test('parsePrettyPath: three-segment figure paths only, genre remapped to the KB fandom', () => {
  assert.deepEqual(parsePrettyPath('/GIJoe/Classified-Series/Destro/'), { genre: 'gijoe', line: 'classified-series', slug: 'destro', fandom: 'gi-joe' })
  assert.equal(parsePrettyPath('/figure/fp_x/y'), null)
  assert.equal(parsePrettyPath('/guides/a/b'), null)
  assert.equal(parsePrettyPath('/wrestling/character/kane'), null)
  assert.equal(parsePrettyPath('/wrestling/elite'), null)
})

test('recordServesPath mirrors findFigureMatches: product_line OR manufacturer-product_line, exact slug, live records only', () => {
  const p = parsePrettyPath('/wrestling/mattel-elite/kane')
  assert.equal(recordServesPath(rec('a', 'wrestling', 'Mattel', 'Elite', 'Kane'), p), true)
  assert.equal(recordServesPath(rec('a', 'wrestling', 'mattel', 'elite', 'kane'), parsePrettyPath('/wrestling/elite/kane')), true)
  assert.equal(recordServesPath(rec('a', 'wrestling', 'mattel', 'elite', 'kane', { duplicate_of: 'b' }), p), false)
  assert.equal(recordServesPath(rec('a', 'wrestling', 'mattel', 'elite', 'kane', { phantom: true }), p), false)
  assert.equal(recordServesPath(rec('a', 'wrestling', 'mattel', 'elite', 'kane-masked'), p), false)
})

test('derivePrettyPathRedirects: same fid, duplicate_of chain, dead successor, path served again, malformed', () => {
  const records = [
    rec('fp_rtruth', 'wrestling', 'mattel', 'basic', 'r-truth'), // slug was cleaned: old path /wrestling/basic/50-r-truth
    rec('fp_blayze_new', 'wrestling', 'mattel', 'elite-flashback', 'alundra-blayze'),
    rec('fp_back', 'wrestling', 'mattel', 'elite', 'kane'), // a path that is served again
  ]
  const fidRedirects = { fp_blayze_old: 'fp_blayze_mid', fp_blayze_mid: 'fp_blayze_new', fp_loop_a: 'fp_loop_b', fp_loop_b: 'fp_loop_a' }
  const { map, stats } = derivePrettyPathRedirects(
    {
      '/wrestling/basic/50-r-truth': { fid: 'fp_rtruth' },
      '/wrestling/elite/alundra-blayze': { fid: 'fp_blayze_old' },
      '/wrestling/elite/gone-forever': { fid: 'fp_removed' },
      '/wrestling/elite/looper': { fid: 'fp_loop_a' },
      '/wrestling/elite/kane': { fid: 'fp_whatever' },
      '/not-a-figure-path': { fid: 'fp_rtruth' },
      '/wrestling/elite/no-fact': null,
    },
    records,
    fidRedirects,
  )
  assert.deepEqual(map, { '/wrestling/basic/50-r-truth': 'fp_rtruth', '/wrestling/elite/alundra-blayze': 'fp_blayze_new' })
  assert.deepEqual(stats, { candidates: 7, emitted: 2, sourceLive: 1, noSurvivor: 2, malformed: 2, viaChain: 1 })
})

// Drift gate (same contract as tests/figureIdRedirects.test.mjs): the committed generated map
// must equal what the committed ledger derives to against the live KB. The deploy chain runs
// build-figure-redirects.mjs before `npm test`, so this can only fail on a stale hand commit.
test('committed pretty-path-redirects.generated.json is what the ledger derives to today', () => {
  const require = createRequire(import.meta.url)
  const slim = require('../src/data/figures-reference-v2.slim.js').FIGURES_V2
  const read = (f) => JSON.parse(readFileSync(new URL('../src/data/' + f, import.meta.url), 'utf8'))
  const { map } = derivePrettyPathRedirects(read('pretty-path-harvest.json'), slim, read('figure-id-redirects.generated.json'))
  const committed = read('pretty-path-redirects.generated.json')
  assert.deepEqual(committed, map, 'run: node scripts/build-figure-redirects.mjs, then commit the regenerated file')
  const live = new Set(slim.map((f) => f.figure_id))
  for (const [path, fid] of Object.entries(committed)) assert.ok(live.has(fid), path + ' -> ' + fid + ' is not live')
})
