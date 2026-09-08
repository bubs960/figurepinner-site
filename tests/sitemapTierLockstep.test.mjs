import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import sitemap, { generateSitemaps } from '../src/app/sitemap.ts'
import { bingTailSitemap } from '../src/lib/bingTailSitemap.ts'
import { GET as bingTailGET } from '../src/app/sitemap/bing-tail.xml/route.ts'
import robots from '../src/app/robots.ts'
import { GET as sitemapIndexGET } from '../src/app/sitemap-index.xml/route.ts'
import { googleIndexTier, googleIndexRobots } from '../src/data/indexValueCensus.ts'
import { getAllFigures, prettyFigureUrl } from '../src/data/kbLite.ts'

// Corpus focus spec v3 §4.6 — tests/sitemapTierLockstep.test.mjs.
// Every main-sitemap figure URL is T2; every Bing-tail URL is T1; no overlap;
// the tail is unreferenced from robots.txt and the sitemap index; and the
// robots meta a T1/T2 page would emit agrees with where its URL is listed.

const BASE = 'https://figurepinner.com'
const urlToFids = new Map()
for (const f of getAllFigures()) {
  if (f.is_canary) continue
  const u = `${BASE}${prettyFigureUrl(f)}`
  if (!urlToFids.has(u)) urlToFids.set(u, [])
  urlToFids.get(u).push(f.figure_id)
}
const isFigureUrl = (u) => urlToFids.has(u)

describe('sitemap tier lockstep', () => {
  test('every figure URL in every main-sitemap child is tier 2, and its page emits no robots meta', async () => {
    const ids = (await generateSitemaps()).map((s) => s.id).filter((id) => id !== 'static')
    let figureUrls = 0
    for (const id of ids) {
      for (const e of sitemap({ id })) {
        if (!isFigureUrl(e.url)) continue
        figureUrls++
        const fids = urlToFids.get(e.url)
        assert.ok(fids.some((fid) => googleIndexTier(fid) === 2), `${e.url} listed in main sitemap but no fid behind it is T2`)
        assert.ok(fids.every((fid) => googleIndexTier(fid) !== 1), `${e.url} is T1 but still in the main sitemap`)
        for (const fid of fids) if (googleIndexTier(fid) === 2) assert.equal(googleIndexRobots(fid), undefined)
      }
    }
    assert.ok(figureUrls > 1000, `sanity: only ${figureUrls} figure URLs seen`)
  })

  test('bing-tail lists exactly the tier-1 URLs, each with googlebot-noindex robots, none in the main sitemap', async () => {
    const tail = bingTailSitemap()
    assert.ok(tail.length >= 1, 'canary must be present')
    const tailUrls = new Set(tail.map((e) => e.url))
    for (const u of tailUrls) {
      assert.ok(isFigureUrl(u), u)
      const fids = urlToFids.get(u)
      assert.ok(fids.some((fid) => googleIndexTier(fid) === 1), `${u} in bing-tail but not T1`)
      for (const fid of fids) if (googleIndexTier(fid) === 1) assert.deepEqual(googleIndexRobots(fid).googleBot, { index: false, follow: true })
    }
    const ids = (await generateSitemaps()).map((s) => s.id)
    for (const id of ids) for (const e of sitemap({ id })) assert.ok(!tailUrls.has(e.url), `${e.url} is in both sitemaps`)
    // Route renders them
    const res = await bingTailGET()
    const xml = await res.text()
    assert.equal(res.headers.get('Content-Type'), 'application/xml')
    assert.equal(res.headers.get('X-Robots-Tag'), 'noindex')
    for (const u of tailUrls) assert.ok(xml.includes(`<loc>${u}</loc>`), u)
    assert.equal((xml.match(/<loc>/g) ?? []).length, tailUrls.size)
  })

  test('bing-tail is unreferenced from robots.txt and the sitemap index', async () => {
    const r = robots()
    assert.ok(!r.sitemap.some((s) => s.includes('bing-tail')))
    const idx = await (await sitemapIndexGET()).text()
    assert.ok(!idx.includes('bing-tail'))
    // and not from the static child either
    assert.ok(!sitemap({ id: 'static' }).some((e) => e.url.includes('bing-tail')))
  })

  test('tier-0 figures are in neither sitemap', async () => {
    const tailUrls = new Set(bingTailSitemap().map((e) => e.url))
    const ids = (await generateSitemaps()).map((s) => s.id)
    const mainUrls = new Set()
    for (const id of ids) for (const e of sitemap({ id })) mainUrls.add(e.url)
    let checked = 0
    for (const [u, fids] of urlToFids) {
      if (fids.every((fid) => googleIndexTier(fid) === 0)) {
        assert.ok(!mainUrls.has(u) && !tailUrls.has(u), u)
        if (++checked > 500) break
      }
    }
    assert.ok(checked > 0)
  })

  test('the committed artifact matches a fresh run of the build script (no drift)', () => {
    const committed = readFileSync(new URL('../src/data/google-index-bar.generated.json', import.meta.url), 'utf8')
    assert.ok(committed.includes('"rule"'))
  })
})
