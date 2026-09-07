// Release T (2026-09-07): related guides are fandom-aware, and the two
// verified guide facts stay fixed.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { guideFandom, relatedGuidesForFandom, FANDOM_HUB_SLUG } from '../src/app/guides/_lib/guideFandom.ts'
import { ARTICLES } from '../src/app/guides/_data/articles.ts'
import { ROLEPLAY_RE, dedupeById, hygieneVaultTop } from '../src/app/guides/_lib/vaultHygiene.ts'

const slugs = new Set(ARTICLES.map(a => a.slug))

describe('guideFandom', () => {
  test('slug rules', () => {
    assert.equal(guideFandom('marvel-legends-price-guide-2026'), 'marvel-comics')
    assert.equal(guideFandom('star-wars-black-series-hub'), 'star-wars')
    assert.equal(guideFandom('most-valuable-wwe-elite-figures'), 'wrestling')
    assert.equal(guideFandom('mcfarlane-dc-multiverse-guide'), 'dc')
    assert.equal(guideFandom('read-ebay-sold-listings'), 'general')
  })
  test('every hub slug in the map is a real article', () => {
    for (const s of Object.values(FANDOM_HUB_SLUG)) assert.ok(slugs.has(s), s)
  })
  test('Vader gets Star Wars, not wrestling; Snake Eyes gets G.I. Joe; wrestling keeps its trio', () => {
    const sw = relatedGuidesForFandom('star-wars').map(g => g.href)
    assert.ok(sw.includes('/guides/star-wars-black-series-hub') && !sw.some(h => h.includes('wrestling')))
    assert.ok(relatedGuidesForFandom('gi-joe').map(g => g.href).includes('/guides/gi-joe-hub'))
    assert.equal(relatedGuidesForFandom('wrestling').length, 3)
    for (const g of [...sw, ...relatedGuidesForFandom('marvel-comics').map(x => x.href)]) assert.ok(slugs.has(g.replace('/guides/', '')), g)
  })
})

describe('guide facts (external audit F4, BAF sweep)', () => {
  const marvel = JSON.stringify(ARTICLES.find(a => a.slug === 'marvel-legends-price-guide-2026'))
  test('Shriek is gone; Wolfsbane carries the Zabu example', () => {
    assert.ok(!/Shriek/.test(marvel)); assert.ok(/Wolfsbane/.test(marvel))
  })
  test('Onslaught = Toy Biz Series 13 (2006); Fin Fang Foom = 2008', () => {
    assert.ok(marvel.includes('Onslaught BAF (Toy Biz Series 13, 2006)'))
    assert.ok(marvel.includes('Fin Fang Foom BAF wave (2008'))
    assert.ok(!marvel.includes('Series 8)'))
  })
  test('DC hub: vintage lines sit in their own section', () => {
    const dc = ARTICLES.find(a => a.slug === 'dc-multiverse-hub')
    const idx = dc.body.findIndex(b => b.type === 'h2' && /Beyond Multiverse/.test(b.text))
    assert.ok(idx > 0)
    const mv = dc.body.find(b => b.type === 'h2' && /Most valuable DC Multiverse/.test(b.text))
    const list = dc.body[dc.body.indexOf(mv) + 1]
    assert.ok(!list.items.some(t => /Super Powers vintage/.test(t)))
    assert.ok(!JSON.stringify(dc).includes('40-90%'))
  })
})

describe('vault hygiene (F5)', () => {
  test('roleplay filtered, duplicates collapsed', () => {
    assert.ok(ROLEPLAY_RE.test('Reva (The Third Sister) Force FX Elite Lightsaber'))
    assert.ok(!ROLEPLAY_RE.test('Darth Vader (ANH)'))
    assert.equal(dedupeById([{ figure_id: 'a' }, { figure_id: 'a' }, { figure_id: 'b' }]).length, 2)
    const rows = [{ figure_id: 'x', name: 'Reva Force FX Elite Lightsaber' }, { figure_id: 'y', name: 'Darth Vader' }]
    assert.equal(hygieneVaultTop('6-black-series', rows).length, 1)
    assert.equal(hygieneVaultTop('roleplay', rows).length, 2)
  })
})
