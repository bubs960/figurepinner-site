import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { sitemapIndexXml } from '../src/lib/sitemapIndex.ts'
import { getAllFandoms } from '../src/data/kb.ts'
import { GET } from '../src/app/sitemap-index.xml/route.ts'

describe('sitemapIndexXml', () => {
  test('emits a well-formed sitemapindex with one <loc> per entry', () => {
    const xml = sitemapIndexXml([{ id: 'static' }, { id: 'wrestling' }, { id: 'star-wars' }])
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'))
    assert.ok(xml.includes('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'))
    assert.ok(xml.trimEnd().endsWith('</sitemapindex>'))
    assert.equal((xml.match(/<loc>/g) ?? []).length, 3)
    assert.ok(xml.includes('<loc>https://figurepinner.com/sitemap/static.xml</loc>'))
    assert.ok(xml.includes('<loc>https://figurepinner.com/sitemap/star-wars.xml</loc>'))
  })

  test('entries with a lastmod emit it as YYYY-MM-DD; entries without omit the tag', () => {
    const xml = sitemapIndexXml([
      { id: 'static' },
      { id: 'wrestling', lastmod: new Date('2026-08-13') },
      { id: 'motu', lastmod: null },
    ])
    assert.ok(xml.includes('<loc>https://figurepinner.com/sitemap/wrestling.xml</loc><lastmod>2026-08-13</lastmod>'))
    // Never a fabricated date: undated entries carry no lastmod at all.
    assert.ok(xml.includes('<sitemap><loc>https://figurepinner.com/sitemap/static.xml</loc></sitemap>'))
    assert.ok(xml.includes('<sitemap><loc>https://figurepinner.com/sitemap/motu.xml</loc></sitemap>'))
    assert.equal((xml.match(/<lastmod>/g) ?? []).length, 1)
  })

  test('XML-escapes ids so a & in a fandom slug cannot break the document', () => {
    const xml = sitemapIndexXml([{ id: 'd&d' }])
    assert.ok(xml.includes('https://figurepinner.com/sitemap/d&amp;d.xml'))
    assert.ok(!xml.includes('d&d.xml'))
  })
})

describe('GET /sitemap.xml', () => {
  test('serves application/xml listing static + every KB fandom child', async () => {
    const res = await GET()
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('Content-Type'), 'application/xml')
    const body = await res.text()
    assert.ok(body.includes('<loc>https://figurepinner.com/sitemap/static.xml</loc>'))
    // One entry per child sitemap: static + one per fandom, same set robots.ts lists.
    assert.equal((body.match(/<loc>/g) ?? []).length, getAllFandoms().length + 1)
  })

  test('fandom children carry real lastmods; the static child does not (build-verdict item A)', async () => {
    const res = await GET()
    const body = await res.text()
    // Wrestling has census-dated figures and 8/13-8/16 enrichment pours — it
    // must carry a lastmod, and every lastmod in the doc must be a real date.
    assert.match(body, /<loc>https:\/\/figurepinner\.com\/sitemap\/wrestling\.xml<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
    assert.ok(body.includes('<sitemap><loc>https://figurepinner.com/sitemap/static.xml</loc></sitemap>'))
    for (const m of body.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
      assert.match(m[1], /^\d{4}-\d{2}-\d{2}$/, `malformed lastmod: ${m[1]}`)
      assert.ok(!Number.isNaN(new Date(m[1]).getTime()))
    }
  })
})
