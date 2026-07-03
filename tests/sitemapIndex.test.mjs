import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { sitemapIndexXml } from '../src/lib/sitemapIndex.ts'
import { getAllFandoms } from '../src/data/kb.ts'
import { GET } from '../src/app/sitemap-index.xml/route.ts'

describe('sitemapIndexXml', () => {
  test('emits a well-formed sitemapindex with one <loc> per id', () => {
    const xml = sitemapIndexXml(['static', 'wrestling', 'star-wars'])
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'))
    assert.ok(xml.includes('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'))
    assert.ok(xml.trimEnd().endsWith('</sitemapindex>'))
    assert.equal((xml.match(/<loc>/g) ?? []).length, 3)
    assert.ok(xml.includes('<loc>https://figurepinner.com/sitemap/static.xml</loc>'))
    assert.ok(xml.includes('<loc>https://figurepinner.com/sitemap/star-wars.xml</loc>'))
  })

  test('XML-escapes ids so a & in a fandom slug cannot break the document', () => {
    const xml = sitemapIndexXml(['d&d'])
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
})
