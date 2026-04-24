/**
 * SEO-canonical figure page: /:fandom/:line/:character
 *
 * This is the URL Google should index. We render full content here —
 * no redirect — and set canonical = this pretty URL.
 *
 * Supports two line shapes:
 *   /wrestling/elite/cm-punk           (product_line only)
 *   /wrestling/mattel-elite/cm-punk    (manufacturer-prefixed)
 *
 * When multiple waves match (same char + line), picks the highest wave number.
 * Falls back to genre page if no figure found, 404 if genre also invalid.
 */

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getFiguresByFandom, getAllFandoms, deriveName, type KBFigure } from '@/data/kb'
import FigureDetailContent, { fetchFigurePageData } from '@/app/figure/[figure_id]/_components/FigureDetailContent'
import { prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'

export const dynamic = 'force-dynamic'

const BASE = 'https://figurepinner.com'

// ── Figure lookup ──────────────────────────────────────────────────────────────

function normalizeSlug(s: string) {
  return s.toLowerCase().trim()
}

function findFigure(fandom: string, line: string, slug: string): KBFigure | null {
  const candidates = getFiguresByFandom(fandom)
  if (!candidates.length) return null

  const lineNorm = normalizeSlug(line)
  const slugNorm = normalizeSlug(slug)

  function lineMatches(f: KBFigure): boolean {
    const pl = normalizeSlug(f.product_line)
    const mfr = normalizeSlug(f.manufacturer)
    if (pl === lineNorm) return true
    if (`${mfr}-${pl}` === lineNorm) return true
    return false
  }

  const matches = candidates.filter(
    f => lineMatches(f) && normalizeSlug(f.character_canonical) === slugNorm
  )

  if (!matches.length) return null
  if (matches.length === 1) return matches[0]

  // Multiple waves — return the highest (most recent)
  return matches.sort((a, b) => {
    const wA = parseInt(a.release_wave) || 0
    const wB = parseInt(b.release_wave) || 0
    return wB - wA
  })[0]
}

// ── Metadata ───────────────────────────────────────────────────────────────────

type PageProps = {
  params: Promise<{ genre: string; line: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genre, line, slug } = await params
  const figure = findFigure(genre, line, slug)
  if (!figure) return { title: 'Figure Not Found' }

  const displayName = deriveName(figure)
  const lineName = prettifySlug(figure.product_line)
  const fandomName = prettifySlug(genre)

  const { price } = await fetchFigurePageData(figure.figure_id)
  const median = price?.medianSold ?? price?.avgSold ?? null

  // Canonical = this pretty URL (Google should index this, not /figure/[id])
  const canonical = `${BASE}/${genre}/${line}/${slug}`

  return {
    title: `${displayName} Price Guide — ${lineName} | FigurePinner`,
    description: `${displayName} current market value${median ? `: avg $${median.toFixed(0)}` : ''}. Real eBay sold prices for ${fandomName} action figures.`,
    alternates: { canonical },
    openGraph: {
      title: `${displayName}${median ? ` — $${median.toFixed(0)} avg` : ''} | FigurePinner`,
      description: `Real sold prices for ${displayName}. ${price?.soldCount ?? 0} eBay comps.`,
      images: figure.canonical_image_url
        ? [{ url: figure.canonical_image_url, width: 400, height: 400, alt: displayName }]
        : [],
    },
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function PrettyFigurePage({ params }: PageProps) {
  const { genre, line, slug } = await params
  const figure = findFigure(genre, line, slug)

  if (figure) {
    // Render full content — no redirect, so Google indexes this URL
    return <FigureDetailContent figureId={figure.figure_id} />
  }

  // No figure match — fall back to genre page if valid, else 404
  const fandoms = getAllFandoms()
  if (fandoms.includes(genre)) {
    redirect(`/${genre}`)
  }

  notFound()
}
