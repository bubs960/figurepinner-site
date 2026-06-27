import type { Metadata } from 'next'
import { getFigureById, deriveName, prettyFigureUrl, hasUniquePrettyFigureUrl } from '@/data/kb'
import FigureDetailContent, { fetchFigurePageData } from './_components/FigureDetailContent'
import { prettifySlug } from './_lib/figureFormatters'

// ISR — figure detail re-rendered at most once per hour per figure_id.
// Public, immutable-per-figure data; user-specific bits (vault status etc.)
// are loaded client-side inside FigureDetailContent so caching is safe.
// (Was force-dynamic via 1b29441, which disabled ISR on this indexed SEO page;
// restored to revalidate per Genta audit 2026-06-06 P1 — comment was already true.)
export const dynamic = 'force-static'
// 24h, not 1h: with the KV incremental cache live, hourly refills of 21k
// long-tail figure pages would cost ~15M KV writes/month. Price snapshots
// refresh on a daily aggregation cadence anyway. (Wallet owns cost calls.)
export const revalidate = 86400

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
  const medianLabel = median != null ? `$${median.toFixed(0)} median` : null
  const compLabel = price?.soldCount
    ? `${price.soldCount} eBay sold comps.`
    : 'Recent eBay sold-comps context.'
  const hasConfirmedZeroSoldData = price != null && price.soldCount === 0

  // Canonical points to the keyword-rich pretty URL
  const canonical = `${BASE}${prettyFigureUrl(local)}`

  return {
    title: `${displayName} — ${line} Price & Value | FigurePinner`,
    description: medianLabel
      ? `${displayName} ${line} sells for ~${medianLabel} (eBay sold median). Check current prices free — FigurePinner tracks real sold data.`
      : `${displayName} ${line} price — check what it actually sold for on eBay. FigurePinner tracks real sold comps free.`,
    alternates: { canonical },
    // Noindex /figure/[id] when the figure has a unique pretty URL — the pretty
    // URL is the canonical and Google was treating both as duplicate pages.
    // For non-unique figures (multiple waves, same slug) /figure/[id] IS the
    // canonical so we leave it indexable.
    ...((hasConfirmedZeroSoldData || hasUniquePrettyFigureUrl(local))
      ? { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }
      : {}),
    openGraph: {
      title: `${displayName}${medianLabel ? ` — ${medianLabel}` : ''} | FigurePinner`,
      description: `Real sold prices for ${displayName}. ${compLabel}`,
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
