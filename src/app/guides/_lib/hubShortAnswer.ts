// The fandom hubs' answer-first sentence (2026-09-18).
//
// The `-hub` guides are 84% of all guide impressions on Bing, and the page shape Bing's AI
// answers (and ChatGPT) cite is "plain answer + one concrete number" near the top. The hub hero
// is deliberately compressed so the HubAnswerCard lands in viewport 1, so this sentence opens
// the BODY instead: first thing after the hero, ahead of the stat strip.
//
// Every number comes from the payload the page already renders (the same top-comps table sits
// right below), so it cannot disagree with the page. Rules: only a trustworthy comp (>= 10 sold)
// may be named; nothing qualifies -> no sentence; the payload's own generated_at is printed, so
// a stale refresh is visible instead of hidden.
import { TRUSTWORTHY_COMPS } from '@/app/figure/[figure_id]/_lib/figureFormatters'
import { formatGroupedNumber } from '@/lib/safeNumber'
import { formatShortDateWithYear } from '@/lib/safeDate'
import type { TopCompPayload } from '../_data/fandomHubs'

export type HubShortAnswer = {
  name: string
  url: string
  /** Text that follows the linked figure name. */
  afterName: string
  /** Catalog coverage sentence; empty when the hub has no vault totals (the wrestling parent). */
  coverage: string
  asOf: string
}

export function hubShortAnswer(
  topComps: TopCompPayload | null,
  totals: { totalFigs: number; pricedFigs: number },
): HubShortAnswer | null {
  const top = (topComps?.figures ?? [])
    .filter((f) => f.sold_count >= TRUSTWORTHY_COMPS && f.price > 0)
    .sort((a, b) => b.price - a.price)[0]
  if (!top || !topComps) return null
  const generated = new Date(topComps.generated_at)
  if (Number.isNaN(generated.getTime())) return null
  return {
    name: top.name,
    url: top.url,
    afterName: ` (${top.line}) is the top of this market right now, a $${formatGroupedNumber(top.price)} median across ${top.sold_count} real eBay sales.`,
    coverage:
      totals.totalFigs > 0
        ? ` We track ${formatGroupedNumber(totals.totalFigs)} figures here and ${formatGroupedNumber(totals.pricedFigs)} have live sold comps.`
        : '',
    asOf: formatShortDateWithYear(generated),
  }
}
