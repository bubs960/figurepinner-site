// Drift gate for enrichment-dates.generated.json — added 2026-08-27 with the
// sitemap-lastmod enrichment fix.
//
// The generated map feeds sitemap lastmods (sitemap.ts lastContentDate). A
// provenance-sidecar sync that lands WITHOUT regenerating the map would ship
// stale lastmods silently — exactly the "enrichment deploy moves zero
// lastmods" gap this whole fix closes, reintroduced one sync later. npm test
// runs inside `npm run deploy`, so a stale map fails the deploy with a
// regeneration command instead of shipping.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildEnrichmentDateMap } from '../scripts/generate-enrichment-dates.mjs'

const require = createRequire(import.meta.url)
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const committed = require('../src/data/enrichment-dates.generated.json')

describe('enrichment-dates.generated.json', () => {
  test('matches a fresh rebuild from the provenance sidecar metas (stale ⇒ run: npm run kb:enrichment-dates)', () => {
    const { dates } = buildEnrichmentDateMap(join(ROOT, 'src', 'data', 'figures-provenance'))
    assert.deepEqual(committed, dates,
      'committed map differs from the sidecar metas — regenerate with: npm run kb:enrichment-dates')
  })

  test('every entry is fid -> YYYY-MM-DD', () => {
    for (const [fid, date] of Object.entries(committed)) {
      assert.match(fid, /^fp_[a-z0-9_-]+$/, `bad fid key: ${fid}`)
      assert.match(date, /^\d{4}-\d{2}-\d{2}$/, `bad date for ${fid}: ${date}`)
      assert.ok(!Number.isNaN(new Date(date).getTime()), `unparseable date for ${fid}: ${date}`)
    }
  })

  test('map is non-empty (a sudden empty map means the sidecar dir moved, not that enrichment vanished)', () => {
    assert.ok(Object.keys(committed).length >= 100,
      `only ${Object.keys(committed).length} entries — expected hundreds; did figures-provenance/ move?`)
  })
})
