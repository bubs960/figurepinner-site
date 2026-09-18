// Answer-first box for guides that have live comp cards but no hand-written shortVersion
// (2026-09-18). The 7/18 Bing re-grade found the page shape Bing's AI answers cite is "plain
// answer + one concrete number" near the top; RUM shows ChatGPT already sending visits to
// exactly these value pages. The eight bidcheck guides carry their numbers ONLY in live comp
// cards, so a typed-in answer would go stale and then contradict the card under it. This
// builds the sentence from the same snapshots, through the same view function the cards use
// (deriveLiveMedianView), at the same render — it cannot disagree with the page.
//
// Honesty rules: only trustworthy-tier comps (>= TRUSTWORTHY_COMPS sold) are quoted, highest
// median first, at most three; fewer than two quotable comps -> no box at all (one number is
// not an answer about a whole guide). A hand-written Article.shortVersion always wins.
import { TRUSTWORTHY_COMPS } from '@/app/figure/[figure_id]/_lib/figureFormatters'
import { formatGroupedNumber } from '@/lib/safeNumber'
import { deriveLiveMedianView } from './liveMedianView'
import type { PriceSnap } from './priceSnaps'

const usd = (n: number) => '$' + formatGroupedNumber(n, Number.isInteger(n) ? 0 : 2)

export function liveShortVersion(
  compBlocks: Array<{ fid: string; label: string }>,
  comps: Map<string, PriceSnap>,
  now: number = Date.now(),
): string | null {
  const seen = new Set<string>()
  const quotable: Array<{ label: string; median: number; count: number }> = []
  for (const b of compBlocks) {
    if (seen.has(b.fid)) continue
    seen.add(b.fid)
    const v = deriveLiveMedianView(comps.get(b.fid), now)
    if (v.hasData && v.median != null && v.count >= TRUSTWORTHY_COMPS) quotable.push({ label: b.label, median: v.median, count: v.count })
  }
  if (quotable.length < 2) return null
  const top = quotable.sort((a, b) => b.median - a.median).slice(0, 3)
  const parts = top.map((q, i) => `${q.label} ${i === 0 ? 'medians' : 'at'} ${usd(q.median)} across ${q.count} sold`)
  return `From live eBay sold data: ${parts.join('; ')}. Check your exact release:`
}
