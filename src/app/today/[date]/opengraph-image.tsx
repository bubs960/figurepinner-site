import { ImageResponse } from 'next/og'
import { getFigureById } from '@/data/kbDb'
import { GrailCard, FallbackOGCard, OG_SIZE, OG_CACHE_HEADERS, OG_FALLBACK_CACHE_HEADERS, resolveCardPhoto, loadCardFonts, withCardFonts } from '@/app/figure/[figure_id]/_lib/ogCard'
import { getSpotlightByDate } from '../_lib/dailySpotlight'

export const contentType = 'image/png'
// force-dynamic, not force-static -- same D1-at-build-time issue as the page
// itself; see that file's comment.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ date: string }> }

export async function generateImageMetadata({ params }: Props) {
  const { date } = await params
  const row = await getSpotlightByDate(date)
  const figure = row ? await getFigureById(row.figureId).catch(() => null) : null
  return [
    {
      id: 'default',
      alt: figure ? `Grail Spotlight ${date}: ${figure.character_canonical}` : 'FigurePinner',
      size: OG_SIZE,
      contentType: 'image/png',
    },
  ]
}

export default async function Image({ params }: Props) {
  const { date } = await params
  const row = await getSpotlightByDate(date)
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
    // Dated spotlight rows are write-once (see dailySpotlight), so the figure
    // card's 24 h shared TTL is safe here (2026-09-02, gap sweep finding 8).
    { ...withCardFonts(OG_SIZE, fonts), headers: OG_CACHE_HEADERS }
  )
}
