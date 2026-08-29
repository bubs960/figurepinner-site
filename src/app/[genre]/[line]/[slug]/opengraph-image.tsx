import { ImageResponse } from 'next/og'
import { deriveName } from '@/data/kbHelpers'
import { fetchFigurePageData } from '@/app/figure/[figure_id]/_components/FigureDetailContent'
import { derivePriceContract } from '@/app/figure/[figure_id]/_lib/priceContract'
import { GrailCard, FallbackOGCard, OG_SIZE, resolveCardPhoto, loadCardFonts, withCardFonts } from '@/app/figure/[figure_id]/_lib/ogCard'
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

  // FIX-1 (webaudit transparent-split gate, 2026-07-17 s4) — identical bug,
  // identical fix, to /figure/[figure_id]/opengraph-image.tsx: raw pooled
  // medianSold/avgSold bypassed derivePriceContract entirely. Leads with the
  // real headline bucket (sealed > loose > pooled), same as the page's own
  // meta description now does.
  const contract = derivePriceContract(price)
  const lead = contract.sealed?.median != null
    ? { median: contract.sealed.median, count: contract.sealed.count, suffix: ' sealed' }
    : contract.loose?.median != null
      ? { median: contract.loose.median, count: contract.loose.count, suffix: ' loose' }
      : contract.pooled?.median != null
        ? { median: contract.pooled.median, count: price?.soldCount ?? 0, suffix: '' }
        : null

  return new ImageResponse(
    (
      <GrailCard
        figure={figure}
        photoSrc={photoSrc}
        price={{
          medianLabel: lead != null ? `$${lead.median.toFixed(0)}${lead.suffix}` : null,
          soldCount: lead?.count ?? price?.soldCount ?? 0,
        }}
      />
    ),
    withCardFonts(OG_SIZE, fonts)
  )
}
