import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getFiguresByLine } from '../src/data/kb.ts'
import { fandomsForGenre } from '../src/lib/genreFigures.ts'

/**
 * Class guard: a legacy-slug redirect must never shadow a REAL line.
 *
 * `next.config.ts`'s legacyLines list exists to rescue slugs that were linked
 * or indexed historically but do not correspond to any KB product_line
 * (/dc/dc-multiverse for the KB's "multiverse", etc). Every entry's SOURCE is
 * therefore supposed to be a slug with zero figures behind it.
 *
 * When that assumption breaks, the failure is quiet and expensive: the real
 * line's hub becomes unreachable, every figure under it loses its hub, and
 * because `sitemap.ts` builds from the KB rather than from this list, the
 * sitemap keeps submitting the very URL the config redirects away — handing
 * Google a self-contradicting sitemap entry.
 *
 * Origin (2026-07-27): `['/wrestling/legends', '/wrestling/elite-legends']`.
 * `legends` is Jakks Pacific's WWE Legends line (3 figures); `elite-legends`
 * is Mattel's (181). Different manufacturers, different products — the entry
 * looked like an obvious typo fix and was not. It survived because nothing
 * cross-checked the list against the KB, and the resulting 308 was found by a
 * sitemap census and initially mis-attributed to an unrelated 308 class.
 *
 * Deliberately parses next.config.ts as text: it is a config module with a
 * `redirects()` async function, and importing it here to reach one array is
 * more machinery than the check is worth.
 */
describe('legacy line redirects never shadow a real line', () => {
  const configSrc = readFileSync(new URL('../next.config.ts', import.meta.url), 'utf8')

  function legacyPairs() {
    const start = configSrc.indexOf('const legacyLines')
    assert.notEqual(start, -1, 'legacyLines declaration not found — did next.config.ts move or rename it?')
    // End at the array's own closing bracket. NOT the first ']' — that one
    // lives inside the `Array<[string, string]>` type annotation, a mistake
    // that made the first version of this scan return zero pairs and "pass".
    const end = configSrc.indexOf('\n    ]', start)
    assert.notEqual(end, -1, 'could not find the end of the legacyLines literal')

    // Strip comments before matching. The block documents the removed
    // /wrestling/legends pair verbatim so nobody re-adds it, and without this
    // the scan reads that example as a LIVE entry and fails on a clean config —
    // which is exactly what the first version of this test did.
    const body = configSrc.slice(start, end)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n').filter(l => !l.trim().startsWith('//')).join('\n')

    return [...body.matchAll(/\['([^']+)',\s*'([^']+)'\]/g)]
      .map(m => ({ from: m[1], to: m[2] }))
  }

  function figureCount(path) {
    const [, genre, line] = path.split('/')
    if (!genre || !line) return 0
    return fandomsForGenre(genre).flatMap(f => getFiguresByLine(f, line)).length
  }

  test('the config parser actually parsed something', () => {
    // The first draft of this scan sliced to the wrong ']' and found 0 pairs,
    // which made every assertion below pass vacuously. Same decorative-guard
    // trap as breadcrumbHubCoverage — assert the scanner found real data.
    const n = legacyPairs().length
    assert.ok(n >= 10, `parsed only ${n} legacyLines entries — the parser is broken, not the config`)
  })

  test('no redirect SOURCE is a real KB line', () => {
    const shadowing = legacyPairs()
      .map(p => ({ ...p, n: figureCount(p.from) }))
      .filter(p => p.n > 0)
      .map(p => `${p.from} has ${p.n} real figure(s) but 308s to ${p.to}`)

    assert.deepEqual(shadowing, [],
      `legacy redirect(s) are burying a real line's hub:\n  ${shadowing.join('\n  ')}\n` +
      `sitemap.ts builds from the KB, so it will keep submitting these URLs while the ` +
      `config redirects them away — a self-contradicting sitemap entry. If the two lines ` +
      `really are the same product, fix it in the KB (matcher's side); if they are ` +
      `different products, delete the redirect.`)
  })

  test('every redirect TARGET is a real line', () => {
    // The other direction: a redirect pointing at a dead slug turns a
    // recoverable legacy URL into a 404 with an extra hop.
    const dead = legacyPairs()
      .filter(p => figureCount(p.to) === 0)
      .map(p => `${p.from} -> ${p.to} (target has no figures)`)

    assert.deepEqual(dead, [],
      `legacy redirect(s) point at a slug with no figures — the hop ends in a 404:\n  ${dead.join('\n  ')}`)
  })

  test('/wrestling/legends resolves on its own and is NOT redirected', () => {
    // The specific regression, pinned by name. Cheap, and it names the real
    // products so the next person does not "helpfully" re-add the redirect.
    assert.equal(figureCount('/wrestling/legends'), 3,
      'Jakks Pacific WWE Legends should have 3 figures — if the KB changed, re-read this test')
    assert.ok(figureCount('/wrestling/elite-legends') > 100,
      "Mattel's Elite Legends should still be the large, separate line")
    // Checked against the PARSED pairs, not the raw source: the config
    // deliberately names this pair in a comment so it does not get re-added,
    // and a raw-text match would read that documentation as a live entry.
    assert.equal(legacyPairs().find(p => p.from === '/wrestling/legends'), undefined,
      "/wrestling/legends must not be in legacyLines — it is Jakks Pacific's own line, " +
      "not a typo for Mattel's elite-legends")
  })
})
