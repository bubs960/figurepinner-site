import { ImageResponse } from 'next/og'
import { getFigureById, getFigureByStableSuffix } from '@/data/kbDb'
import { deriveName } from '@/data/kbHelpers'
import { fetchFigurePageData } from './_components/FigureDetailContent'
import { derivePriceContract } from './_lib/priceContract'
import { GrailCard, FallbackOGCard, OG_SIZE, resolveCardPhoto, loadCardFonts, withCardFonts } from './_lib/ogCard'

export const contentType = 'image/png'
export const dynamic = 'force-static' // matches the page's explicit config — don't rely on inference
export const revalidate = 86400 // matches page ISR — figure data + price snapshot don't change faster than this

type Props = { params: Promise<{ figure_id: string }> }

// Dynamic per-figure alt (was a static "FigurePinner — figure detail" for all
// ~22k figures before this — generateImageMetadata is the documented way to
// restore per-figure alt text alongside a default export image function).
export async function generateImageMetadata({ params }: Props) {
  const { figure_id } = await params
  const figure = (await getFigureById(figure_id)) ?? (await getFigureByStableSuffix(figure_id))
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
  const figure = (await getFigureById(figure_id)) ?? (await getFigureByStableSuffix(figure_id))

  if (!figure) {
    return new ImageResponse(<FallbackOGCard />, OG_SIZE)
  }

  const [{ price }, photoSrc, fonts] = await Promise.all([
    fetchFigurePageData(figure.figure_id),
    resolveCardPhoto(figure.canonical_image_url),
    loadCardFonts(),
  ])

  // Census-addendum transparent-split fix (2026-07-17): this card used to read
  // price.medianSold/avgSold directly -- the raw pooled figure, bypassing
  // derivePriceContract entirely. For the 3,839-fid affected population
  // (pooled label, real sealed+loose buckets both present), that showed a
  // blended number in the social-share image while the page itself now shows
  // (post 13b0cf6) a real per-condition headline -- a reader who clicks
  // through from the shared card sees a different number than the card
  // promised. Card is a small fixed-width line (same space constraint as
  // MobileActionBar), so it leads with ONE number, same sealed > loose >
  // pooled selection as mobileActionBarPrice, with an honest condition
  // suffix rather than a bare unlabeled figure.
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
