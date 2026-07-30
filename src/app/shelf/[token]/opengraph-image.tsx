import { ImageResponse } from 'next/og'
import { ShelfCard, FallbackOGCard, OG_SIZE, loadCardFonts, withCardFonts } from '@/app/figure/[figure_id]/_lib/ogCard'
import { getShelfShareStats } from '../_lib/shelfShareData'

export const contentType = 'image/png'
export const dynamic = 'force-dynamic' // live D1 lookup per token, never cached/predictable at build time

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
    return new ImageResponse(<FallbackOGCard />, OG_SIZE)
  }

  return new ImageResponse(
    <ShelfCard grails={stats.grails} gaps={stats.gaps} />,
    withCardFonts(OG_SIZE, fonts)
  )
}
