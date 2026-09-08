import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  googleIndexTier,
  googleIndexRobots,
  tierOneFids,
  isAtOrAboveIndexBar,
  GOOGLE_INDEX_BAR_RULE,
} from '../src/data/indexValueCensus.ts'
import { getAllFigures, getFigureById } from '../src/data/kbLite.ts'

// Corpus focus spec v3 §4.6 — tests/googleIndexTier.test.mjs.
// CANARY SCOPE (train #7, 9/10): rule / floor / robots split / fail-closed.
// The grandfather-wins, freeze-wins and exemption-wins cases need the wave-1
// inputs (GSC export, exemption lists) that do not exist yet — they are
// listed as todo below rather than stub-passed, so the suite states honestly
// what it does not yet prove.

const artifact = JSON.parse(readFileSync(new URL('../src/data/google-index-bar.generated.json', import.meta.url), 'utf8'))
const canary = JSON.parse(readFileSync(new URL('../src/data/google-index-bar.canary.json', import.meta.url), 'utf8'))

describe('googleIndexTier — canary artifact', () => {
  test('artifact is the canary rule with inputs recorded (wave inputs explicitly null)', () => {
    assert.equal(GOOGLE_INDEX_BAR_RULE, artifact.rule)
    assert.match(artifact.rule, /^canary-only-/)
    assert.match(artifact.inputs.kb_md5, /^[0-9A-F]{32}$/)
    assert.equal(artifact.inputs.grandfather_asof, null)
    assert.equal(artifact.inputs.exemptions_asof, null)
    assert.equal(artifact.inputs.canary_asof, canary.asof)
  })

  test('every canary fid is tier 1, in the KB, above the T0 bar, not a Data-Defense canary', () => {
    assert.ok(canary.fids.length >= 1)
    for (const fid of canary.fids) {
      assert.equal(googleIndexTier(fid), 1, fid)
      assert.ok(isAtOrAboveIndexBar(fid), `${fid} must be above the T0 bar`)
      const f = getFigureById(fid)
      assert.ok(f, `${fid} not in KB`)
      assert.ok(!f.is_canary, `${fid} is a Data-Defense canary record`)
    }
    assert.deepEqual(new Set(tierOneFids()), new Set(canary.fids))
  })

  test('tier 0 = below the bar (unchanged policy); tier 2 = everything else above the bar', () => {
    const figs = getAllFigures().filter((f) => !f.is_canary)
    const below = figs.find((f) => !isAtOrAboveIndexBar(f.figure_id))
    const above = figs.find((f) => isAtOrAboveIndexBar(f.figure_id) && !canary.fids.includes(f.figure_id))
    assert.ok(below && above)
    assert.equal(googleIndexTier(below.figure_id), 0)
    assert.equal(googleIndexTier(above.figure_id), 2)
    assert.equal(googleIndexTier('fp_not_a_real_fid_000000'), 0)
  })

  test('robots split by tier (spec 4.1): T1 = generic index + googlebot noindex', () => {
    const fid = canary.fids[0]
    assert.deepEqual(googleIndexRobots(fid), {
      index: true,
      follow: true,
      googleBot: { index: false, follow: true },
    })
    const figs = getAllFigures().filter((f) => !f.is_canary)
    const below = figs.find((f) => !isAtOrAboveIndexBar(f.figure_id))
    const above = figs.find((f) => isAtOrAboveIndexBar(f.figure_id) && !canary.fids.includes(f.figure_id))
    assert.deepEqual(googleIndexRobots(below.figure_id), {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    })
    assert.equal(googleIndexRobots(above.figure_id), undefined, 'T2 emits no robots meta (unchanged output)')
    // is_canary (Data Defense Layer 3) override always wins, even on a T1/T2 fid.
    assert.deepEqual(googleIndexRobots(fid, true), {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    })
  })

  test('floor (spec §3): no canary fid sits at or above the p75 comps floor (47) — T1 is for thin pages', () => {
    const csv = readFileSync('C:/Users/bubs9/Documents/Claude/Projects/Bridge/scrape-results/INDEX-VALUE-CENSUS-2026-07-18.csv', 'utf8')
    for (const fid of canary.fids) {
      const row = csv.split('\n').find((l) => l.startsWith(fid + ','))
      assert.ok(row, `${fid} not in the 7/18 census`)
      const comps = Number(row.split(',')[2])
      assert.ok(comps >= 1 && comps < 47, `${fid} comps=${comps} — must be above bar and below the p75 floor`)
    }
  })

  test('build script fails closed on a missing canary file and on a below-bar fid', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gib-'))
    // Reproduce the script's expected layout: <root>/scripts/x.mjs + <root>/src/data/*
    cpSync(new URL('../scripts/build-google-index-bar.mjs', import.meta.url), join(dir, 'scripts', 'build-google-index-bar.mjs'))
    const data = join(dir, 'src', 'data')
    cpSync(new URL('../src/data/index-value-census.json', import.meta.url), join(data, 'index-value-census.json'))
    writeFileSync(join(data, 'figures-reference-v2.slim.js'), 'const X=[{"figure_id":"fp_x_above_000001"},{"figure_id":"fp_x_below_000002"}]')
    // 1) missing canary file
    let r = spawnSync(process.execPath, [join(dir, 'scripts', 'build-google-index-bar.mjs')], { encoding: 'utf8' })
    assert.equal(r.status, 1, r.stderr)
    assert.match(r.stderr, /FAIL-CLOSED: missing/)
    // 2) fid not in the census (below bar)
    writeFileSync(join(data, 'google-index-bar.canary.json'), JSON.stringify({ asof: '2026-09-08', fids: ['fp_x_below_000002'] }))
    r = spawnSync(process.execPath, [join(dir, 'scripts', 'build-google-index-bar.mjs')], { encoding: 'utf8' })
    assert.equal(r.status, 1, r.stderr)
    assert.match(r.stderr, /below the T0 bar/)
    // 3) empty list
    writeFileSync(join(data, 'google-index-bar.canary.json'), JSON.stringify({ asof: '2026-09-08', fids: [] }))
    r = spawnSync(process.execPath, [join(dir, 'scripts', 'build-google-index-bar.mjs')], { encoding: 'utf8' })
    assert.equal(r.status, 1, r.stderr)
  })

  test.todo('grandfather wins over the comps rule (needs the GSC indexed-pages export, wave 1)')
  test.todo('freeze wins (9 test URLs + hub members, until 9/22) (wave 1)')
  test.todo('exemption wins (RUM referral / Bing winners lists) (wave 1)')
})
