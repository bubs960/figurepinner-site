/**
 * SEO-canonical figure page: /:fandom/:line/:character
 *
 * This URL is indexable only when it maps to one exact figure. Ambiguous
 * character/line aliases redirect to /figure/<id>, because one pretty slug can
 * represent many waves of the same character.
 *
 * Supports two line shapes:
 *   /wrestling/elite/cm-punk           (product_line only)
 *   /wrestling/mattel-elite/cm-punk    (manufacturer-prefixed)
 *
 * When multiple waves match (same char + line), redirects to the highest wave.
 * Falls back to genre page if no figure found, 404 if genre also invalid.
 */

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getFiguresByFandom, getAllFandoms, deriveName, figureUrl, prettyFigureUrl, type KBFigure } from '@/data/kb'
import { getFandom } from '@/lib/genreFigures'
import FigureDetailContent, { fetchFigurePageData } from '@/app/figure/[figure_id]/_components/FigureDetailContent'
import { prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'

// ISR — this is the SEO-canonical indexed figure URL; user-specific bits load
// client-side in FigureDetailContent so caching is safe. Was force-dynamic;
// restored per Genta audit 2026-06-06 P1.
export const dynamic = 'force-static'
export const revalidate = 86400 // matches /figure/[figure_id] — same content, same KV budget

const BASE = 'https://figurepinner.com'

// ── Figure lookup ──────────────────────────────────────────────────────────────

function normalizeSlug(s: string) {
  return s.toLowerCase().trim()
}

function findFigureMatches(fandom: string, line: string, slug: string): KBFigure[] {
  // `fandom` is the URL [genre] slug, which diverges from the KB fandom for the
  // remapped fandoms (gijoe→gi-joe, marvel→marvel-comics, teenage-mutant-ninja-turtles→tmnt).
  // Remap via getFandom so /gijoe/<line>/<char> resolves, matching the line/character routes.
  const candidates = getFiguresByFandom(getFandom(fandom))
  if (!candidates.length) return []

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

  return matches.sort((a, b) => {
    const wA = parseInt(a.release_wave) || 0
    const wB = parseInt(b.release_wave) || 0
    return wB - wA
  })
}

// ── Metadata ───────────────────────────────────────────────────────────────────

type PageProps = {
  params: Promise<{ genre: string; line: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genre, line, slug } = await params
  const matches = findFigureMatches(genre, line, slug)
  const figure = matches[0]
  if (!figure) return { title: 'Figure Not Found' }

  const displayName = deriveName(figure)
  const lineName = prettifySlug(figure.product_line)
  const fandomName = prettifySlug(genre)

  const { price } = await fetchFigurePageData(figure.figure_id)
  const median = price?.medianSold ?? price?.avgSold ?? null
  const medianLabel = median != null ? `$${median.toFixed(0)} median` : null
  const compLabel = price?.soldCount
    ? `${price.soldCount} eBay sold comps.`
    : 'Recent eBay sold-comps context.'
  const hasConfirmedZeroSoldData = price != null && price.soldCount === 0

  const canonical = `${BASE}${prettyFigureUrl(figure)}`

  return {
    title: `${displayName} — ${lineName} Price & Value | FigurePinner`,
    description: medianLabel
      ? `${displayName} ${lineName} sells for ~${medianLabel} (eBay sold median). Check current prices free — FigurePinner tracks real sold data.`
      : `${displayName} ${lineName} price — check what it actually sold for on eBay. FigurePinner tracks real sold comps free.`,
    alternates: { canonical },
    ...(hasConfirmedZeroSoldData
      ? { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }
      : {}),
    openGraph: {
      title: `${displayName}${medianLabel ? ` — ${medianLabel}` : ''} | FigurePinner`,
      description: `Real sold prices for ${displayName}. ${compLabel}`,
      images: figure.canonical_image_url
        ? [{ url: figure.canonical_image_url, width: 400, height: 400, alt: displayName }]
        : [],
    },
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function PrettyFigurePage({ params }: PageProps) {
  const { genre, line, slug } = await params
  const matches = findFigureMatches(genre, line, slug)
  const figure = matches[0]

  if (figure) {
    if (matches.length > 1) {
      redirect(figureUrl(figure))
    }
    return <FigureDetailContent figureId={figure.figure_id} />
  }

  // No figure match — fall back to genre page if the genre resolves, else 404.
  // Check the remapped fandom (getFandom) so remapped-slug genres (gijoe, marvel,
  // teenage-mutant-ninja-turtles) redirect to their genre page instead of 404ing.
  const fandoms = getAllFandoms()
  if (fandoms.includes(getFandom(genre))) {
    redirect(`/${genre}`)
  }

  notFound()
}
