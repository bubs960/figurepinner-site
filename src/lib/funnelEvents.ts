// Single source of truth for the funnel event vocabulary — shared by
// funnelClient.ts (client-side FunnelEvent type) and api/funnel/route.ts
// (server-side allowlist). Unifying the source, not just testing two
// hand-copied lists stay in sync, closes the drift class at its root
// (webaudit process guard #2, WEBAUDIT-FINAL-CYCLE-PLAN-2026-07-12.md §6).
export const FUNNEL_EVENTS = [
  'landing',
  'search_submit',
  'search_result_click',
  'figure_view',
  'ebay_exit',
  'price_receipt_open',
  'ad_impression',
  'ad_viewable',
  'shelf_ticker_open',
  'sparkline_drawn',
  'collection_claim_ritual_played',
  'shelf_shared',
] as const

export type FunnelEvent = typeof FUNNEL_EVENTS[number]
