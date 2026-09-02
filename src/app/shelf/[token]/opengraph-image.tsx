import { ImageResponse } from 'next/og'
import { ShelfCard, FallbackOGCard, OG_SIZE, OG_FALLBACK_CACHE_HEADERS, loadCardFonts, withCardFonts } from '@/app/figure/[figure_id]/_lib/ogCard'
import { getShelfShareStats } from '../_lib/shelfShareData'

export const contentType = 'image/png'
export const dynamic = 'force-dynamic' // live D1 lookup per token, never cached/predictable at build time

// Shared-cache TTL (2026-09-02, gap sweep finding 8): three D1 queries + a
// Satori render per unfurl with no TTL. Shelf stats drift as the vault changes,
// so one hour, not the figure card's 24 h.
const SHELF_OG_CACHE_HEADERS = { 'cache-control': 'public, s-maxage=3600, stale-while-revalidate=3600' }

type Props = { params: Promise<{ token: string }> }

export async function generateImageMetadata({ params }: Props) {
  const { token } = await params
  const stats = await getShelfShareStats(token)
  return [
    {
      id: 'default',
      alt: stats ? `My Shelf — ${stats.grails} grails, ${stats.gaps} gaps` : 'FigurePinner',
      size: OG_SIZE,
      contentType: 'image/png',
    },
  ]
}

export default async function Image({ params }: Props) {
  const { token } = await params
  const [stats, fonts] = await Promise.all([getShelfShareStats(token), loadCardFonts()])

  if (!stats) {
    return new ImageResponse(<FallbackOGCard />, { ...OG_SIZE, headers: OG_FALLBACK_CACHE_HEADERS })
  }

  return new ImageResponse(
    <ShelfCard grails={stats.grails} gaps={stats.gaps} />,
    { ...withCardFonts(OG_SIZE, fonts), headers: SHELF_OG_CACHE_HEADERS }
  )
}
