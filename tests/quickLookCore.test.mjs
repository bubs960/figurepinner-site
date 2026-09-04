import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { computeCardPosition, CARD_W, CARD_EST_H, EDGE, HOVER_INTENT_MS } from '../src/app/components/quickLookCore.ts'

// Release N (2026-09-04): the viewport-clamp rules are shared by QuickLookAnchor
// (hook) and QuickLookDelegate (page-level). These pin the S54/S56 behaviours
// so neither consumer can drift: beside-not-over, flip at the right edge,
// never above EDGE, never below the viewport, short-viewport floor.

const VW = 1280, VH = 800

describe('quick-look card position', () => {
  test('sits to the RIGHT of the anchor with the 14px gap when it fits', () => {
    const p = computeCardPosition({ top: 300, left: 100, right: 220, height: 120 }, VW, VH)
    assert.equal(p.left, 220 + 14)
  })

  test('flips to the LEFT when the right side has no room', () => {
    const p = computeCardPosition({ top: 300, left: 1000, right: 1120, height: 120 }, VW, VH)
    assert.equal(p.left, 1000 - 14 - CARD_W)
  })

  test('clamp-last wins horizontally when neither side fits (right edge respected, as the hook always did)', () => {
    const p = computeCardPosition({ top: 300, left: 5, right: 400, height: 120 }, 360, VH)
    assert.equal(p.left, 360 - CARD_W - EDGE)
    assert.ok(p.left + CARD_W + EDGE <= 360)
  })

  test('is vertically centred on the anchor when there is room', () => {
    const p = computeCardPosition({ top: 400, left: 100, right: 220, height: 100 }, VW, 1200)
    assert.equal(p.top, Math.round(450 - CARD_EST_H / 2))
  })

  test('clamps at the TOP edge (the S54 clipped-image fix)', () => {
    const p = computeCardPosition({ top: 10, left: 100, right: 220, height: 40 }, VW, VH)
    assert.equal(p.top, EDGE)
  })

  test('clamps at the BOTTOM edge', () => {
    const p = computeCardPosition({ top: 780, left: 100, right: 220, height: 40 }, VW, VH)
    assert.equal(p.top, VH - CARD_EST_H - EDGE)
  })

  test('short viewport: never goes above EDGE even when the inner bounds invert', () => {
    const p = computeCardPosition({ top: 100, left: 100, right: 220, height: 40 }, VW, 300)
    assert.equal(p.top, EDGE)
  })

  test('hover intent stays at the S56 value', () => {
    assert.equal(HOVER_INTENT_MS, 450)
  })
})
