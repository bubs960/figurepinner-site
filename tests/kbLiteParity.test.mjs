import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import * as kb from '../src/data/kb.ts'
import * as lite from '../src/data/kbLite.ts'
import { deriveName } from '../src/data/kbTypes.ts'

// Parity contract for the OOM cutover (2026-09-01): kbLite.ts must answer
// every question its runtime readers ask EXACTLY as kb.ts did — same ids,
// same fandom order, same pretty/canonical URLs, same display names, same
// line matching — or the sitemap, search results and homepage links move
// on a data-layer swap that was supposed to be invisible.

describe('kbLite mirrors kb.ts for the fields runtime readers use', () => {
  const full = kb.getAllFigures().filter(f => !f.is_canary)
  const liteAll = lite.getAllFigures()

  test('same figure set, same order', () => {
    assert.equal(liteAll.length, full.length)
    for (let i = 0; i < full.length; i++) {
      assert.equal(liteAll[i].figure_id, full[i].figure_id, `row ${i}`)
    }
  })

  test('same fandom list and order', () => {
    assert.deepEqual(lite.getAllFandoms(), kb.getAllFandoms())
  })

  test('every figure: identity, route, image and name fields match', () => {
    for (const f of full) {
      const l = lite.getFigureById(f.figure_id)
      assert.ok(l, `missing ${f.figure_id}`)
      for (const k of ['fandom', 'manufacturer', 'product_line', 'character_canonical', 'character_variant', 'release_wave', 'canonical_image_url', 'name', 'v1_name', 'v1_line', 'v1_series']) {
        // '' and null are the same "no value" for these nullable strings: every
        // runtime reader (kbDb.ts mapRow, kbLite.ts rowToFigure) folds null to ''.
        // Matcher's 2026-09-02 evening sync (74a7413) wrote release_wave "" into
        // the full file for 2 fids while the slim file omits the key — a real
        // sync inconsistency reported to matcher, but not a reader-parity defect.
        assert.equal(l[k] || null, f[k] || null, `${f.figure_id}.${k}`)
      }
      assert.equal(deriveName(l), deriveName(f), `${f.figure_id} deriveName`)
      assert.equal(lite.prettyFigureUrl(l), kb.prettyFigureUrl(f), `${f.figure_id} prettyFigureUrl`)
      assert.equal(lite.hasUniquePrettyFigureUrl(l), kb.hasUniquePrettyFigureUrl(f), `${f.figure_id} unique`)
    }
  })

  test('per-fandom and per-line reads agree', () => {
    for (const fandom of kb.getAllFandoms()) {
      const a = kb.getFiguresByFandom(fandom).filter(f => !f.is_canary).map(f => f.figure_id)
      const b = lite.getFiguresByFandom(fandom).map(f => f.figure_id)
      assert.deepEqual(b, a, `fandom ${fandom}`)
      assert.deepEqual(lite.getLinesByFandom(fandom), kb.getLinesByFandom(fandom), `lines ${fandom}`)
      for (const line of kb.getLinesByFandom(fandom).slice(0, 5)) {
        const sample = kb.getFiguresByFandom(fandom).find(f => f.product_line === line)
        const compound = `${sample.manufacturer}-${line}`
        for (const slug of [line, compound, line.toUpperCase()]) {
          assert.deepEqual(
            lite.getFiguresByLine(fandom, slug).map(f => f.figure_id),
            kb.getFiguresByLine(fandom, slug).filter(f => !f.is_canary).map(f => f.figure_id),
            `line ${fandom}/${slug}`,
          )
        }
      }
    }
  })

  test('stable-suffix resolution agrees', () => {
    for (const f of full.slice(0, 2000)) {
      const a = kb.getFigureByStableSuffix(f.figure_id)?.figure_id ?? null
      const b = lite.getFigureByStableSuffix(f.figure_id)?.figure_id ?? null
      assert.equal(b, a, `suffix ${f.figure_id}`)
    }
  })
})
