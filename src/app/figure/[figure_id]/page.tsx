import type { Metadata } from 'next'
import { getFigureById, deriveName, prettyFigureUrl } from '@/data/kb'
import FigureDetailContent, { fetchFigurePageData } from './_components/FigureDetailContent'
import { prettifySlug } from './_lib/figureFormatters'

export const dynamic = 'force-dynamic'

const BASE = 'https://figurepinner.com'

type PageProps = {
  params: Promise<{ figure_id: string }>
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { figure_id } = await params
  const local = getFigureById(figure_id)
  if (!local) return { title: 'Figure Not Found' }

  const displayName = deriveName(local)
  const line = prettifySlug(local.product_line)
  const fandom = prettifySlug(local.fandom)

  const { price } = await fetchFigurePageData(figure_id)
  const median = price?.medianSold ?? price?.avgSold ?? null

  // Canonical points to the keyword-rich pretty URL
  const canonical = `${BASE}${prettyFigureUrl(local)}`

  return {
    title: `${displayName} Price Guide — ${line} | FigurePinner`,
    description: `${displayName} current market value${median ? `: avg $${median.toFixed(0)}` : ''}. Real eBay sold prices for ${fandom} action figures.`,
    alternates: { canonical },
    openGraph: {
      title: `${displayName}${median ? ` — $${median.toFixed(0)} avg` : ''} | FigurePinner`,
      description: `Real sold prices for ${displayName}. ${price?.soldCount ?? 0} eBay comps.`,
      images: local.canonical_image_url
        ? [{ url: local.canonical_image_url, width: 400, height: 400, alt: displayName }]
        : [],
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function FigureDetailPage({ params }: PageProps) {
  const { figure_id } = await params
  return <FigureDetailContent figureId={figure_id} />
}
