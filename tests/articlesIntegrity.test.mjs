// Guards against the two defect classes found by webaudit's 2026-07-17/18
// articles.ts integrity probes: (1) a duplicate `slug` silently shadows a
// richer entry behind ARTICLES.find()'s first-match semantics (this is what
// broke star-wars-black-series-hub and transformers-hub — the thin 6/21
// entries shipped ahead of the data-dense originals and made them
// unreachable dead weight, a real Bing ranking regression); (2) a
// "[[label|/guides/slug]]" further-reading link pointing at a slug that
// doesn't exist (404, link-equity leak). Both are exactly the class a
// hand-maintained multi-thousand-line data file will regress on again.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { ARTICLES } from '../src/app/guides/_data/articles.ts'

describe('articles.ts integrity', () => {
  test('no duplicate slugs (ARTICLES.find() is first-match-wins — a dup silently unpublishes the later entry)', () => {
    const seen = new Map()
    const dupes = []
    for (const [i, a] of ARTICLES.entries()) {
      if (seen.has(a.slug)) dupes.push(`'${a.slug}' at index ${seen.get(a.slug)} and ${i}`)
      else seen.set(a.slug, i)
    }
    assert.deepEqual(dupes, [], `duplicate article slugs found: ${dupes.join('; ')}`)
  })

  // Known-missing further-reading targets from webaudit's 2026-07-17 integrity
  // probe (WEBAUDIT-TO-WEB-ARTICLES-INTEGRITY-ADDENDUM-2026-07-17.md item 2) —
  // titles the hub authors clearly intended to write, not yet written. Webaudit's
  // own recommendation: fold into round-3 guide research rather than delete the
  // links or fake a redirect. Grandfathered here so the guard still hard-fails
  // on any NEW dead link (the regression class this test exists to catch)
  // without blocking today's deploy on content that doesn't exist yet. Shrink
  // this list as each guide gets written or the link gets re-slugged.
  const KNOWN_MISSING_GUIDE_LINKS = new Set([
    'wwe-elite-hub -> /guides/wwe-elite-price-guide-2026',
    'wwe-elite-hub -> /guides/classic-superstars-vs-elite-legends',
    'star-wars-black-series-hub -> /guides/star-wars-black-series-price-guide-2026',
    'star-wars-black-series-hub -> /guides/star-wars-vintage-collection-price-guide',
    'star-wars-black-series-hub -> /guides/haslab-star-wars-price-guide',
    'dc-multiverse-hub -> /guides/dc-multiverse-price-guide-2026',
    'dc-multiverse-hub -> /guides/batman-animated-series-figure-guide',
    'dc-multiverse-hub -> /guides/dc-universe-classics-price-guide',
  ])

  test('every internal [[label|/guides/slug]] further-reading link resolves to a real slug (except the known-missing grandfather list above)', () => {
    const knownSlugs = new Set(ARTICLES.map((a) => a.slug))
    const linkPattern = /\[\[[^\]|]+\|(\/guides\/[a-z0-9-]+)\]\]/g
    const broken = []
    for (const a of ARTICLES) {
      for (const block of a.body) {
        const texts = block.type === 'ul' ? block.items : [block.text]
        for (const text of texts) {
          if (!text) continue
          for (const match of text.matchAll(linkPattern)) {
            const target = match[1].replace(/^\/guides\//, '')
            if (!knownSlugs.has(target)) broken.push(`${a.slug} -> ${match[1]}`)
          }
        }
      }
    }
    const newlyBroken = broken.filter((b) => !KNOWN_MISSING_GUIDE_LINKS.has(b))
    assert.deepEqual(newlyBroken, [], `NEW dead /guides/ links found (not on the known-missing list): ${newlyBroken.join('; ')}`)

    // If a grandfathered link starts resolving (the guide finally gets written),
    // fail loudly so the list gets trimmed instead of silently going stale.
    const noLongerMissing = [...KNOWN_MISSING_GUIDE_LINKS].filter((b) => !broken.includes(b))
    assert.deepEqual(noLongerMissing, [], `these grandfathered links now resolve -- remove from KNOWN_MISSING_GUIDE_LINKS: ${noLongerMissing.join('; ')}`)
  })
})
