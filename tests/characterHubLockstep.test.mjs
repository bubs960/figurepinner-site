import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import sitemap, { generateSitemaps } from '../src/app/sitemap.ts'
import { characterHubMeetsIndexBar, googleIndexTier } from '../src/data/indexValueCensus.ts'
import { getAllFandoms, getFiguresByFandom } from '../src/data/kbLite.ts'
import { genreSlugForFandom } from '../src/lib/genreFigures.ts'

// Corpus focus spec v3 §4.6 — tests/characterHubLockstep.test.mjs.
// Both character-hub call sites (sitemap filter + page robots) must decide
// from the SAME predicate over the SAME member set, so a hub is never
// submitted-but-noindexed or indexed-but-unsubmitted.

const BASE = 'https://figurepinner.com'
const src = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8')

describe('character hub lockstep', () => {
  test('both call sites import characterHubMeetsIndexBar from indexValueCensus (no local reimplementation)', () => {
    const page = src('../src/app/[genre]/character/_lib/characterHub.tsx')
    const map = src('../src/app/sitemap.ts')
    for (const [name, text] of [['characterHub.tsx', page], ['sitemap.ts', map]]) {
      assert.match(text, /import \{[^}]*\bcharacterHubMeetsIndexBar\b[^}]*\} from '@\/data\/indexValueCensus'/, `${name} must import the shared predicate`)
      assert.ok(text.includes('characterHubMeetsIndexBar('), `${name} must call it`)
      assert.doesNotMatch(text, /memberFids\.length >= 2 && memberFids\.some/, `${name} must not inline the rule`)
    }
  })

  test('sitemap character URLs == exactly the hubs the shared predicate admits, per fandom (non-canary members)', async () => {
    const ids = (await generateSitemaps()).map((s) => s.id).filter((id) => id !== 'static')
    let hubsChecked = 0
    for (const fandom of getAllFandoms()) {
      if (!ids.includes(fandom)) continue
      const genre = genreSlugForFandom(fandom)
      const members = new Map()
      for (const f of getFiguresByFandom(fandom)) {
        if (f.is_canary) continue
        if (!members.has(f.character_canonical)) members.set(f.character_canonical, [])
        members.get(f.character_canonical).push(f.figure_id)
      }
      const expected = new Set([...members].filter(([, fids]) => characterHubMeetsIndexBar(fids)).map(([c]) => `${BASE}/${genre}/character/${c}`))
      const listed = new Set(sitemap({ id: fandom }).map((e) => e.url).filter((u) => u.includes(`/${genre}/character/`)))
      assert.deepEqual(listed, expected, `character hubs for ${fandom} disagree between sitemap and predicate`)
      hubsChecked += listed.size
    }
    assert.ok(hubsChecked > 100, `sanity: only ${hubsChecked} hubs checked`)
  })

  test('every listed character hub wraps >= 2 members and >= 1 member that is itself indexable (T2)', async () => {
    const ids = (await generateSitemaps()).map((s) => s.id).filter((id) => id !== 'static')
    for (const fandom of getAllFandoms()) {
      if (!ids.includes(fandom)) continue
      const genre = genreSlugForFandom(fandom)
      const members = new Map()
      for (const f of getFiguresByFandom(fandom)) {
        if (f.is_canary) continue
        if (!members.has(f.character_canonical)) members.set(f.character_canonical, [])
        members.get(f.character_canonical).push(f.figure_id)
      }
      for (const e of sitemap({ id: fandom })) {
        const m = e.url.match(new RegExp(`/${genre}/character/([^/]+)$`))
        if (!m) continue
        const fids = members.get(m[1]) ?? []
        assert.ok(fids.length >= 2, e.url)
        // Today the predicate tests "above the T0 bar"; the canary makes at
        // most one fid T1, so this stays true. Wave 1 (spec B3) tightens it
        // to ">= 1 tier-2 member" — see the todo below.
        assert.ok(fids.some((fid) => googleIndexTier(fid) >= 1), e.url)
      }
    }
  })

  test.todo('wave 1 (spec v3 B3): a hub whose only above-bar members are all T1 leaves the main sitemap and its page robots go googlebot-noindex in lockstep')
})
