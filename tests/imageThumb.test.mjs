// Lock for thumb()'s host cases — added 2026-08-26 with the figurepinner-images
// case (lister's pre-generated 200/450/800 thumbnail buckets, Steve's option #3).
//
// The contract: every recognized host maps a requested render width onto that
// host's real resize mechanism; unrecognized hosts pass through byte-identical.
// The figurepinner-images buckets are FIXED worker-side — if the worker's
// bucket list ever changes, this test and src/lib/imageUrl.ts must move
// together (the worker silently serves the full-res original for a width it
// has no thumb for, so drift here costs bytes invisibly, not errors).
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { thumb } from '../src/lib/imageUrl.ts'

const FP = 'https://figurepinner-images.bubs960.workers.dev/photos/abc123.jpg'

describe('thumb: figurepinner-images (R2 worker buckets 200/450/800)', () => {
  test('picks the smallest bucket >= requested width', () => {
    assert.equal(thumb(FP, 96), `${FP}?width=200`)
    assert.equal(thumb(FP, 160), `${FP}?width=200`)
    assert.equal(thumb(FP, 200), `${FP}?width=200`)
    assert.equal(thumb(FP, 201), `${FP}?width=450`)
    assert.equal(thumb(FP, 450), `${FP}?width=450`)
    assert.equal(thumb(FP, 640), `${FP}?width=800`)
    assert.equal(thumb(FP, 800), `${FP}?width=800`)
  })

  test('width beyond the largest bucket serves the original', () => {
    assert.equal(thumb(FP, 801), FP)
    assert.equal(thumb(FP, 1600), FP)
  })

  test('already-sized URL is left alone', () => {
    assert.equal(thumb(`${FP}?width=450`, 96), `${FP}?width=450`)
  })

  test('existing query string gets & not ?', () => {
    assert.equal(thumb(`${FP}?v=2`, 160), `${FP}?v=2&width=200`)
  })
})

describe('thumb: existing host behavior unchanged', () => {
  test('shopify appends native width param', () => {
    assert.equal(
      thumb('https://cdn.shopify.com/s/files/x.jpg', 160),
      'https://cdn.shopify.com/s/files/x.jpg?width=160',
    )
  })

  test('ebay rewrites the s-lNNN filename bucket', () => {
    assert.equal(
      thumb('https://i.ebayimg.com/images/g/abc/s-l1600.jpg', 160),
      'https://i.ebayimg.com/images/g/abc/s-l225.jpg',
    )
  })

  test('unknown hosts pass through', () => {
    const af411 = 'https://www.actionfigure411.com/images/thumbs/x.jpg'
    assert.equal(thumb(af411, 160), af411)
  })

  test('null/undefined stay null', () => {
    assert.equal(thumb(null), null)
    assert.equal(thumb(undefined), null)
  })
})
