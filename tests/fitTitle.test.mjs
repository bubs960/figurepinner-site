import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fitAbsoluteTitle, fitFigureTitle, TITLE_MAX, BRAND_SUFFIX } from '../src/lib/fitTitle.ts'

test('fitAbsoluteTitle: short titles keep the brand, long ones lose only the brand', () => {
  const short = 'Vintage Kenner Star Wars Vehicles Guide | FigurePinner'
  assert.equal(fitAbsoluteTitle(short), short)
  const long = 'Darth Vader Figure Value — Real Sold Prices, Black Series to Hot Toys | FigurePinner'
  assert.equal(fitAbsoluteTitle(long), 'Darth Vader Figure Value — Real Sold Prices, Black Series to Hot Toys')
  const unbranded = 'x'.repeat(80)
  assert.equal(fitAbsoluteTitle(unbranded), unbranded)
})

test('fitFigureTitle: ladder stops at the first fit', () => {
  // 1. fits with the brand -> plain string, the layout template appends the brand
  assert.equal(fitFigureTitle('CM Punk (Elite Series 1) Price & Value'), 'CM Punk (Elite Series 1) Price & Value')
  // 2. brand dropped
  const orton = 'Randy Orton (Legacy 2009) (Elite Series 2) Price & Value' // 56 + 15 = 71
  assert.deepEqual(fitFigureTitle(orton), { absolute: orton })
  // 3. short tail, wave kept
  const destro = 'Destro (3.75" Retro Collection · 3.75 Retro Action Figures) Price & Value' // 73
  assert.deepEqual(fitFigureTitle(destro), { absolute: 'Destro (3.75" Retro Collection · 3.75 Retro Action Figures) Price' })
  // 4. wave dropped, full tail
  const luke = 'Luke Skywalker (Jedi Knight) (6" Black Series · Blue Wave 2014-2015) Price & Value' // 82
  assert.deepEqual(fitFigureTitle(luke), { absolute: 'Luke Skywalker (Jedi Knight) (6" Black Series) Price & Value' })
  // 6. nothing fits: brand dropped, never a mid-word cut
  const pack = 'Fallen Order 3 Pack: Cal Kestis, Purge Trooper & Second Sister (6" Black Series · Exclusives) Price & Value'
  assert.deepEqual(fitFigureTitle(pack), { absolute: pack })
})

test('fitFigureTitle: every fitted result is within the limit or is the unchanged base', () => {
  for (let n = 20; n < 120; n++) {
    const base = 'N'.repeat(n) + ' (Line · Wave 12) Price & Value'
    const out = fitFigureTitle(base)
    const rendered = typeof out === 'string' ? out + BRAND_SUFFIX : out.absolute
    assert.ok(rendered.length <= TITLE_MAX || rendered === base, n + ': ' + rendered.length)
  }
})

// Gate: a new guide may not ship a <title> Bing will flag. Trim the metaTitle
// (the ' | FigurePinner' suffix is dropped automatically and does not count).
test('every guide metaTitle renders at <= 70 characters', () => {
  const dir = new URL('../src/app/guides/_data/', import.meta.url)
  const over = []
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
    const src = readFileSync(new URL(f, dir), 'utf8')
    for (const m of src.matchAll(/metaTitle:\s*(['"`])((?:\\.|(?!\1).)*)\1/g)) {
      const raw = JSON.parse('"' + m[2].replace(/\\'/g, "'").replace(/"/g, '\\"') + '"')
      const rendered = fitAbsoluteTitle(raw)
      if (rendered.length > TITLE_MAX) over.push(rendered.length + ' ' + f + ': ' + rendered)
    }
  }
  assert.deepEqual(over, [])
})
