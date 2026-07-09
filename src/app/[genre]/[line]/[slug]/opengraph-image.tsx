import { ImageResponse } from 'next/og'
import { deriveName } from '@/data/kb'
import { fetchFigurePageData } from '@/app/figure/[figure_id]/_components/FigureDetailContent'
import { GrailCard, FallbackOGCard, OG_SIZE, resolveCardPhoto, loadCardFonts } from '@/app/figure/[figure_id]/_lib/ogCard'
import { findFigureMatches } from './_lib/findFigureMatches'

export const contentType = 'image/png'
export const dynamic = 'force-static' // matches the page's explicit config — don't rely on inference
export const revalidate = 86400 // matches page ISR

type Props = { params: Promise<{ genre: string; line: string; slug: string }> }

export async function generateImageMetadata({ params }: Props) {
  const { genre, line, slug } = await params
  const figure = findFigureMatches(genre, line, slug)[0]
  return [
    {
      id: 'default',
      alt: figure ? deriveName(figure) : 'Figure not found',
      size: OG_SIZE,
      contentType: 'image/png',
    },
  ]
}

export default async function Image({ params }: Props) {
  const { genre, line, slug } = await params
  const figure = findFigureMatches(genre, line, slug)[0]

  if (!figure) {
    return new ImageResponse(<FallbackOGCard />, OG_SIZE)
  }

  const [{ price }, photoSrc, fonts] = await Promise.all([
    fetchFigurePageData(figure.figure_id),
    resolveCardPhoto(figure.canonical_image_url),
    loadCardFonts(),
  ])
  const median = price?.medianSold ?? price?.avgSold ?? null

  return new ImageResponse(
    (
      <GrailCard
        figure={figure}
        photoSrc={photoSrc}
        price={{
          medianLabel: median != null ? `$${median.toFixed(0)}` : null,
          soldCount: price?.soldCount ?? 0,
        }}
      />
    ),
    { ...OG_SIZE, fonts }
  )
}
