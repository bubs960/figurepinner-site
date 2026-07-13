import { ImageResponse } from 'next/og'
import { getFigureById } from '@/data/kb'
import { GrailCard, FallbackOGCard, OG_SIZE, resolveCardPhoto, loadCardFonts } from '@/app/figure/[figure_id]/_lib/ogCard'
import { getSpotlightByDate } from '../_lib/dailySpotlight'

export const contentType = 'image/png'
// force-dynamic, not force-static -- same D1-at-build-time issue as the page
// itself; see that file's comment.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ date: string }> }

export async function generateImageMetadata({ params }: Props) {
  const { date } = await params
  const row = await getSpotlightByDate(date)
  const figure = row ? getFigureById(row.figureId) : null
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
  const figure = row ? getFigureById(row.figureId) : null

  if (!row || !figure) {
    return new ImageResponse(<FallbackOGCard />, OG_SIZE)
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
    { ...OG_SIZE, fonts }
  )
}
