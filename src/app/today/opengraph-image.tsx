import { ImageResponse } from 'next/og'
import { getFigureById } from '@/data/kbDb'
import { GrailCard, FallbackOGCard, OG_SIZE, OG_FALLBACK_CACHE_HEADERS, resolveCardPhoto, loadCardFonts, withCardFonts } from '@/app/figure/[figure_id]/_lib/ogCard'
import { getOrCreateTodaysSpotlight } from './_lib/dailySpotlight'

export const contentType = 'image/png'
// force-dynamic, not force-static -- same D1-at-build-time issue as the page
// itself; see that file's comment.
export const dynamic = 'force-dynamic'

// Shared-cache TTL (2026-09-02, gap sweep finding 8): every unfurl/crawler hit
// paid D1 + R2 photo + Satori (~2-3 s) because the response carried no TTL, so
// the edge never stored it. The spotlight changes at the UTC day boundary, so
// one hour is the honest ceiling here (figure cards use 24 h; see ogCard.tsx).
const TODAY_OG_CACHE_HEADERS = { 'cache-control': 'public, s-maxage=3600, stale-while-revalidate=3600' }

export async function generateImageMetadata() {
  const row = await getOrCreateTodaysSpotlight()
  const figure = row ? await getFigureById(row.figureId).catch(() => null) : null
  return [
    {
      id: 'default',
      alt: figure ? `Today's Grail Spotlight: ${figure.character_canonical}` : 'FigurePinner',
      size: OG_SIZE,
      contentType: 'image/png',
    },
  ]
}

export default async function Image() {
  const row = await getOrCreateTodaysSpotlight()
  const figure = row ? await getFigureById(row.figureId).catch(() => null) : null

  if (!row || !figure) {
    return new ImageResponse(<FallbackOGCard />, { ...OG_SIZE, headers: OG_FALLBACK_CACHE_HEADERS })
  }

  const [photoSrc, fonts] = await Promise.all([
    resolveCardPhoto(figure.canonical_image_url),
    loadCardFonts(),
  ])
  const up = row.trendPct >= 0

  return new ImageResponse(
    (
      <GrailCard
        figure={figure}
        photoSrc={photoSrc}
        status="spotlight"
        price={{
          medianLabel: `${up ? '▲' : '▼'} ${Math.abs(row.trendPct).toFixed(0)}% (90d)`,
          soldCount: row.compCount,
        }}
      />
    ),
    { ...withCardFonts(OG_SIZE, fonts), headers: TODAY_OG_CACHE_HEADERS }
  )
}
