import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fitFigureTitleWithPrice, fitFigureTitle, TITLE_MAX, BRAND_SUFFIX } from '../src/lib/fitTitle.ts'
import { titlePriceFragment, priceInTitleEnabled, PRICE_IN_TITLE_FANDOMS } from '../src/lib/titlePriceTest.ts'

const cond = (median, tier, count = 12) => ({ condition: 'sealed', label: 'x', median, count, tier, needsThinDataLabel: tier === 'thin' })
const contract = (o) => ({ hasNoData: false, hasBothConditions: false, sealed: null, loose: null, pooled: null, ...o })

test('the test is scoped to exactly one fandom', () => {
  assert.deepEqual([...PRICE_IN_TITLE_FANDOMS], ['wrestling'])
  assert.equal(priceInTitleEnabled('wrestling'), true)
  assert.equal(priceInTitleEnabled('star-wars'), false)
  assert.equal(priceInTitleEnabled(undefined), false)
})

test('titlePriceFragment: trustworthy tier only, both conditions or neither, never an average', () => {
  assert.equal(titlePriceFragment(contract({ hasNoData: true })), null)
  assert.equal(
    titlePriceFragment(contract({ hasBothConditions: true, sealed: cond(42.4, 'trustworthy'), loose: cond(17.6, 'trustworthy') })),
    '$42 Sealed / $18 Loose',
  )
  // one side thin -> no number at all (never pick one condition to stand for "the" price)
  assert.equal(titlePriceFragment(contract({ hasBothConditions: true, sealed: cond(180, 'thin'), loose: cond(20, 'trustworthy') })), null)
  // one side suppressed (median null) but present -> still "both conditions" -> no number
  assert.equal(titlePriceFragment(contract({ hasBothConditions: true, sealed: cond(null, 'suppress', 2), loose: cond(20, 'trustworthy') })), null)
  assert.equal(titlePriceFragment(contract({ loose: cond(1234.5, 'trustworthy') })), '$1,235 Loose')
  assert.equal(titlePriceFragment(contract({ sealed: cond(55, 'thin') })), null)
  assert.equal(titlePriceFragment(contract({ pooled: { median: 44, tier: 'trustworthy', needsThinDataLabel: false, isAvg: false } })), '$44 Median')
  assert.equal(titlePriceFragment(contract({ pooled: { median: 44, tier: 'trustworthy', needsThinDataLabel: false, isAvg: true } })), null)
  assert.equal(titlePriceFragment(contract({ pooled: { median: 44, tier: 'thin', needsThinDataLabel: true, isAvg: false } })), null)
})

test('fitFigureTitleWithPrice: ladder keeps the number, never exceeds the limit, falls back cleanly', () => {
  // fits with brand -> plain string (layout template appends the brand)
  assert.equal(fitFigureTitleWithPrice('CM Punk (Elite Series 1) Price & Value', '$42 Loose'), 'CM Punk (Elite Series 1) Price & Value: $42 Loose')
  // brand dropped
  const kane = 'Kane (Elite Series 63) Price & Value'
  assert.deepEqual(fitFigureTitleWithPrice(kane, '$42 Sealed / $18 Loose'), { absolute: 'Kane (Elite Series 63) Price & Value: $42 Sealed / $18 Loose' })
  // a long name still carries a single-condition number (67 chars) …
  const orton = 'Randy Orton (Legacy 2009) (Elite Series 2) Price & Value'
  assert.deepEqual(fitFigureTitleWithPrice(orton, '$42 Loose'), { absolute: 'Randy Orton (Legacy 2009) (Elite Series 2) Price & Value: $42 Loose' })
  // … the short tail buys room for a longer one …
  assert.deepEqual(fitFigureTitleWithPrice(orton, '$1,142 Sealed'), { absolute: 'Randy Orton (Legacy 2009) (Elite Series 2) Price: $1,142 Sealed' })
  // … and a two-condition number that cannot fit (72) is dropped whole, never trimmed to one side
  assert.deepEqual(fitFigureTitleWithPrice(orton, '$42 Sealed / $18 Loose'), fitFigureTitle(orton))
  // no fragment -> identical to the ordinary ladder
  assert.deepEqual(fitFigureTitleWithPrice(orton, null), fitFigureTitle(orton))
  // nothing fits with the number -> ordinary fitted title, no number, no cut
  const long = 'Undertaker, Kane & Paul Bearer Brothers of Destruction 3-Pack (Classic Superstars · Exclusives) Price & Value'
  assert.deepEqual(fitFigureTitleWithPrice(long, '$110 Sealed / $64 Loose'), fitFigureTitle(long))
  for (let n = 10; n < 90; n++) {
    const out = fitFigureTitleWithPrice('N'.repeat(n) + ' (Line · Wave 12) Price & Value', '$42 Sealed / $18 Loose')
    const rendered = typeof out === 'string' ? out + BRAND_SUFFIX : out.absolute
    if (rendered.includes('$')) assert.ok(rendered.length <= TITLE_MAX, n + ': ' + rendered.length)
  }
})
