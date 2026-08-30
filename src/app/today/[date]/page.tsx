import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFigureById, prettyFigureUrl } from '@/data/kbDb'
import { deriveName } from '@/data/kbHelpers'
import { getSpotlightByDate } from '../_lib/dailySpotlight'
import { SpotlightView } from '../_components/SpotlightView'

// force-dynamic, not force-static -- same reason as /today/page.tsx: D1 via
// getCloudflareContext() cannot run at build/prerender time. Read-only here
// (never computes, never writes -- see dailySpotlight.ts), so the request
// cost is a single cheap D1 SELECT regardless of traffic.
export const dynamic = 'force-dynamic'

const BASE = 'https://figurepinner.com'

type Props = { params: Promise<{ date: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params
  const row = await getSpotlightByDate(date)
  if (!row) return { title: 'Spotlight not found', robots: { index: false, follow: false } }

  const figure = await getFigureById(row.figureId).catch(() => null)
  const name = figure ? deriveName(figure) : 'a real figure'
  const direction = row.trendPct >= 0 ? 'up' : 'down'

  return {
    title: `Grail Spotlight — ${date}: ${name}`,
    description: `${name} was ${direction} ${Math.abs(row.trendPct).toFixed(0)}% over 90 days on real eBay solds — ${row.compCount} comps behind the read.`,
    // Canonicalizes to the FIGURE page, not itself (P3 §3 spec, W3): this
    // archive page is a real, distinct, indexable discovery surface, but
    // the figure page stays the single authoritative source for that
    // figure's data — never a swarm of near-duplicate "spotlight" pages
    // competing with it for rank.
    alternates: { canonical: figure ? `${BASE}${await prettyFigureUrl(figure)}` : `${BASE}/today` },
  }
}

export default async function SpotlightArchivePage({ params }: Props) {
  const { date } = await params
  const row = await getSpotlightByDate(date)
  if (!row) notFound()
  return <SpotlightView row={row} isToday={false} />
}
