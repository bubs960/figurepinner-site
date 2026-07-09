import { ImageResponse } from 'next/og'
import { getFigureById, getFigureByStableSuffix, deriveName } from '@/data/kb'
import { fetchFigurePageData } from './_components/FigureDetailContent'
import { GrailCard, FallbackOGCard, OG_SIZE, resolveCardPhoto, loadCardFonts } from './_lib/ogCard'

export const contentType = 'image/png'
export const dynamic = 'force-static' // matches the page's explicit config — don't rely on inference
export const revalidate = 86400 // matches page ISR — figure data + price snapshot don't change faster than this

type Props = { params: Promise<{ figure_id: string }> }

// Dynamic per-figure alt (was a static "FigurePinner — figure detail" for all
// ~22k figures before this — generateImageMetadata is the documented way to
// restore per-figure alt text alongside a default export image function).
export async function generateImageMetadata({ params }: Props) {
  const { figure_id } = await params
  const figure = getFigureById(figure_id) ?? getFigureByStableSuffix(figure_id)
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
  const { figure_id } = await params
  const figure = getFigureById(figure_id) ?? getFigureByStableSuffix(figure_id)

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
