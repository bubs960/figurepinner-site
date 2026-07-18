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
import { notFound, redirect, permanentRedirect } from 'next/navigation'
import { getAllFandoms, deriveName, figureUrl, prettyFigureUrl } from '@/data/kb'
import { getFandom, genreSlugForFandom } from '@/lib/genreFigures'
import FigureDetailContent, { fetchFigurePageData } from '@/app/figure/[figure_id]/_components/FigureDetailContent'
import { prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'
import { enrichedDescription } from '@/app/figure/[figure_id]/_lib/enrichedCopy'
import { derivePriceContract } from '@/app/figure/[figure_id]/_lib/priceContract'
import { findFigureMatches } from './_lib/findFigureMatches'

// ISR — this is the SEO-canonical indexed figure URL; user-specific bits load
// client-side in FigureDetailContent so caching is safe. Was force-dynamic;
// restored per Genta audit 2026-06-06 P1.
export const dynamic = 'force-static'
export const revalidate = 86400 // matches /figure/[figure_id] — same content, same KV budget

const BASE = 'https://figurepinner.com'

// ── Metadata ───────────────────────────────────────────────────────────────────

type PageProps = {
  params: Promise<{ genre: string; line: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { genre, line, slug } = await params

  // Genre-alias 308 lives HERE as well as in the page body: generateMetadata
  // runs before the response streams, so this emits a real 308 (the page-body
  // copy is the fallback). See the [line] route's resolveLineAlias comment.
  const canonicalGenre = genreSlugForFandom(getFandom(genre))
  if (canonicalGenre !== genre) permanentRedirect(`/${canonicalGenre}/${line}/${slug}`)

  const matches = findFigureMatches(genre, line, slug)
  const figure = matches[0]
  if (!figure) return { title: 'Figure Not Found' }

  const displayName = deriveName(figure)
  const lineName = prettifySlug(figure.product_line)
  const fandomName = prettifySlug(genre)

  const { price } = await fetchFigurePageData(figure.figure_id)

  // FIX-1 (webaudit transparent-split gate, 2026-07-17 s4, "sibling-surface
  // trap sighting #6"): this route's own generateMetadata used to read raw
  // pooled medianSold/avgSold directly, bypassing derivePriceContract
  // entirely -- on the SEO-CANONICAL INDEXED route, no less, the one Google
  // actually sees. That both showed a blended figure for the 3,839-fid
  // affected population (contradicting the page's own now-fixed HeroBand
  // headline) AND ignored the <3-comp suppression tier (a 1-2-sale median
  // could print here). Same fix already shipped on /figure/[figure_id]/
  // page.tsx -- ported verbatim so both canonical/id routes describe the
  // same figure identically.
  const contract = derivePriceContract(price)

  /** Short "$X sealed / $Y loose" style fragment, or a single-condition/
   *  pooled fragment, or null if no honest price can be stated in this
   *  space. Suppressed (<3 comp) buckets are simply omitted from the
   *  fragment rather than shown as "insufficient comps" -- that caveat
   *  copy only makes sense on the full page, not a truncated meta tag. */
  function compactPriceFragment(): string | null {
    if (contract.hasNoData) return null
    const sealedNum = contract.sealed?.median ?? null
    const looseNum = contract.loose?.median ?? null
    if (sealedNum != null && looseNum != null) {
      return `$${sealedNum.toFixed(0)} sealed / $${looseNum.toFixed(0)} loose median`
    }
    if (sealedNum != null) return `$${sealedNum.toFixed(0)} sealed median`
    if (looseNum != null) return `$${looseNum.toFixed(0)} loose median`
    if (contract.pooled?.median != null) {
      return `$${contract.pooled.median.toFixed(0)} ${contract.pooled.isAvg ? 'average' : 'median'}`
    }
    // Every bucket that exists is suppressed (all <3 comps) -- no honest
    // number fits in a meta tag; the crawlable page body still explains why.
    return null
  }
  const priceFragment = compactPriceFragment()
  const compLabel = price?.soldCount
    ? `${price.soldCount} eBay sold comps.`
    : 'Recent eBay sold-comps context.'
  const hasConfirmedZeroSoldData = price != null && price.soldCount === 0

  const canonical = `${BASE}${prettyFigureUrl(figure)}`

  // Enriched prose leads when it passes the quality gates (S52 meta wiring) —
  // this is the INDEXED canonical route, so it matters most here.
  const enriched = enrichedDescription(figure)
  const priceTail = priceFragment
    ? `Sells for ~${priceFragment} — real eBay solds, free on FigurePinner.`
    : `Real eBay sold prices, free on FigurePinner.`

  return {
    // No '| FigurePinner' here — the root layout title template appends it;
    // hard-coding it too rendered 'Price & Value | FigurePinner | FigurePinner'
    // on every figure SERP title (S52 fix).
    title: `${displayName} — ${lineName} Price & Value`,
    description: enriched
      ? `${enriched} ${priceTail}`
      : priceFragment
        ? `${displayName} ${lineName} sells for ~${priceFragment} (eBay sold data). Check current prices free — FigurePinner tracks real sold data.`
        : `${displayName} ${lineName} price — check what it actually sold for on eBay. FigurePinner tracks real sold comps free.`,
    alternates: { canonical },
    ...(hasConfirmedZeroSoldData
      ? { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }
      : {}),
    // No `images` here — the file-convention opengraph-image.tsx in this same
    // route segment supplies the real Grail Card, superseding the bare product
    // photo this used to point at.
    openGraph: {
      title: `${displayName}${priceFragment ? ` — ${priceFragment}` : ''} | FigurePinner`,
      description: priceFragment
        ? `Real sold prices for ${displayName}: ${priceFragment}. ${compLabel}`
        : `Real sold prices for ${displayName}. ${compLabel}`,
    },
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function PrettyFigurePage({ params }: PageProps) {
  const { genre, line, slug } = await params

  // Exactly ONE slug namespace serves 200 per fandom; every alias 308s to it
  // (2026-07-12 root-cause FIX-2). Before this, /marvel-comics/... and
  // /marvel/... both rendered the same page as twin 200s and Google indexed
  // neither. Thrown before any streaming, so this emits a real 308.
  const canonicalGenre = genreSlugForFandom(getFandom(genre))
  if (canonicalGenre !== genre) permanentRedirect(`/${canonicalGenre}/${line}/${slug}`)

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
