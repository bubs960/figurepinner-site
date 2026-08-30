import type { Metadata } from 'next'
import { getFigureById } from '@/data/kbDb'
import { deriveName } from '@/data/kbHelpers'
import { getOrCreateTodaysSpotlight } from './_lib/dailySpotlight'
import { SpotlightView, EmptyState } from './_components/SpotlightView'

// force-dynamic, not force-static: this reads D1 via getCloudflareContext(),
// which cannot be called at build/prerender time (no Cloudflare binding
// exists then) — the exact class of error the vault/shelf pages already
// avoid the same way. Cost stays low regardless: every request is one cheap
// D1 SELECT; only the first request of the UTC day pays the R2-fetch cost
// (see getOrCreateTodaysSpotlight's own write-once behavior).
export const dynamic = 'force-dynamic'

const BASE = 'https://figurepinner.com'

export async function generateMetadata(): Promise<Metadata> {
  const row = await getOrCreateTodaysSpotlight()
  if (!row) {
    return {
      title: "Today's Grail Spotlight",
      description: 'One real figure a day, picked by genuine sold-comp momentum.',
      alternates: { canonical: `${BASE}/today` },
    }
  }
  // Tier B: D1 read; dynamic route, null fallback below already handles a miss
  const figure = await getFigureById(row.figureId).catch(() => null)
  const name = figure ? deriveName(figure) : 'a real figure'
  const direction = row.trendPct >= 0 ? 'up' : 'down'
  return {
    title: `Today's Grail Spotlight: ${name}`,
    description: `${name} is ${direction} ${Math.abs(row.trendPct).toFixed(0)}% over 90 days on real eBay solds — ${row.compCount} comps behind the read.`,
    alternates: { canonical: `${BASE}/today` },
  }
}

export default async function TodayPage() {
  const row = await getOrCreateTodaysSpotlight()
  if (!row) return <EmptyState />
  return <SpotlightView row={row} isToday />
}
