import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { FUNNEL_EVENTS } from '../src/lib/funnelEvents.ts'

const ROUTE_PATH = fileURLToPath(new URL('../src/app/api/funnel/route.ts', import.meta.url))
const routeSource = readFileSync(ROUTE_PATH, 'utf8')

// Every field name any current trackFunnel(event, detail) call site sends,
// across the whole app -- base envelope (funnelClient.ts's payload object)
// plus every key used in a `detail` object literal. MUST be updated by hand
// when a new call site introduces a new field -- this is the same
// maintenance model FUNNEL_EVENTS itself uses (a fixed, reviewed
// vocabulary), just extended to payload fields. Grep for "trackFunnel(" to
// re-derive this list; the comment above each entry says which call site
// introduced it.
const KNOWN_PAYLOAD_FIELDS = [
  // base envelope, sent on every event (funnelClient.ts)
  'event', 'path', 'search', 'source', 'referrer', 'sessionId',
  // ClaimRitual.tsx (collection_claim_ritual_played)
  'flight',
  // AdSlot.tsx / HeroSearch.tsx / SearchInterface.tsx / LiveMedian.tsx
  'target',
  // HeroSearch.tsx / SearchInterface.tsx (search_submit, search_result_click)
  'query', 'figureId',
  // MarketPanel.tsx (price_receipt_open)
  'figure_name', 'comp_count',
  // ShelfTicker.tsx (shelf_ticker_open)
  'figures', 'coverage',
  // LiquidSparkline.tsx (sparkline_drawn)
  'point_count',
  // ShareShelfButton.tsx (shelf_shared)
  'method',
]

// Fields deliberately accepted but never written to Analytics Engine, with
// the reason documented in route.ts's own comment -- not a drift, a choice.
// sessionId REMOVED 2026-08-25 (webaudit postdeploy audit of 50d8dd0,
// finding #2): eb15b32 made it blob13, so it IS persisted now. Leaving it
// here made this test silently skip its check on exactly the field that
// deploy changed -- 135/135 passing gave false comfort on that gap.
const INTENTIONALLY_NOT_PERSISTED = new Set()

describe('sessionId regression guard (read-then-dropped once before, eb15b32)', () => {
  test('sessionId is wired into the blobs array, not just read from body', () => {
    assert.ok(
      /sessionId,\s*\/\/ blob13/.test(routeSource) || /blobs:[\s\S]*sessionId/.test(routeSource),
      'sessionId must remain in the blobs array -- it was read-then-dropped once before (eb15b32)',
    )
  })
})

describe('funnel event allowlist (client union === server ALLOWED_EVENTS)', () => {
  test('funnelClient.ts and api/funnel/route.ts read the SAME FUNNEL_EVENTS source', () => {
    // Both sides import FUNNEL_EVENTS directly (unified source, not two
    // hand-copied lists) -- this assertion is a sanity check on the import
    // itself, not a live drift risk anymore. Real protection is structural:
    // if the import ever gets replaced with a local re-declaration, THIS
    // test starts checking a stale snapshot instead of the live source --
    // grep route.ts for a local `new Set([` literal if this ever looks wrong.
    assert.ok(routeSource.includes("import { FUNNEL_EVENTS } from '@/lib/funnelEvents'"),
      'route.ts must import FUNNEL_EVENTS from the shared module, not hand-copy the event list')
    assert.ok(FUNNEL_EVENTS.length > 0, 'FUNNEL_EVENTS must be non-empty')
  })
})

describe('funnel payload allowlist (fields sent === fields read/persisted)', () => {
  test('every known client-sent field is either read by the server or explicitly documented as dropped', () => {
    for (const field of KNOWN_PAYLOAD_FIELDS) {
      if (INTENTIONALLY_NOT_PERSISTED.has(field)) continue
      const readPattern = new RegExp(`body\\?\\.${field}\\b`)
      assert.ok(
        readPattern.test(routeSource),
        `payload field "${field}" is sent by a trackFunnel() call site but route.ts never reads body?.${field} -- ` +
        `either wire it up (clean()/num() + append to blobs/doubles) or add it to INTENTIONALLY_NOT_PERSISTED with a reason`,
      )
    }
  })

  test('every body?.<field> the server reads is a KNOWN, accounted-for field (catches the inverse drift: server expects something no client sends)', () => {
    const readFields = [...routeSource.matchAll(/body\?\.(\w+)/g)].map(m => m[1])
    assert.ok(readFields.length > 0, 'expected route.ts to read at least one body field')
    const known = new Set([...KNOWN_PAYLOAD_FIELDS, ...INTENTIONALLY_NOT_PERSISTED])
    for (const field of readFields) {
      assert.ok(known.has(field), `route.ts reads body?.${field} but no known trackFunnel() call site sends it -- update KNOWN_PAYLOAD_FIELDS or remove the dead read`)
    }
  })
})
