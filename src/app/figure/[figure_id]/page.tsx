import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { getFigureById, getFigureByStableSuffix, deriveName, prettyFigureUrl } from '@/data/kb'
import { FIGURE_ID_REDIRECTS } from '@/data/figure-id-redirects'
import FigureDetailContent, { fetchFigurePageData } from './_components/FigureDetailContent'
import { prettifySlug } from './_lib/figureFormatters'
import { enrichedDescription } from './_lib/enrichedCopy'
import { derivePriceContract } from './_lib/priceContract'

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
  if (!local) {
    // Rekey/merge map first (exact old fid), then the stable-suffix fallback.
    // prettyFigureUrl, not figureUrl: land the 308 on the survivor's canonical
    // URL (falls back to the id URL itself for ambiguous figures) — webaudit
    // gate condition on b0ba762.
    const canonical = getFigureById(FIGURE_ID_REDIRECTS[figure_id] ?? '') ?? getFigureByStableSuffix(figure_id)
    if (canonical) permanentRedirect(prettyFigureUrl(canonical))
    return { title: 'Figure Not Found' }
  }

  const displayName = deriveName(local)
  const line = prettifySlug(local.product_line)
  const fandom = prettifySlug(local.fandom)

  const { price } = await fetchFigurePageData(figure_id)

  // FPPS-01 (2026-07-15, Steve's binding decisions): meta tags must never
  // assert a single pooled price when condition-split data exists. Compact,
  // condition-aware label builder for the tight space meta tags allow --
  // omits price entirely rather than picking one condition to lead with,
  // per Steve's explicit "flag rather than quietly pick" rule.
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

  // Canonical points to the keyword-rich pretty URL
  const canonical = `${BASE}${prettyFigureUrl(local)}`

  // Enriched prose leads when it passes the quality gates (S52 meta wiring —
  // differentiates ~18K near-identical descriptions); templated fallback else.
  const enriched = enrichedDescription(local)
  const priceTail = priceFragment
    ? `Sells for ~${priceFragment} — real eBay solds, free on FigurePinner.`
    : `Real eBay sold prices, free on FigurePinner.`

  return {
    // No '| FigurePinner' here — the root layout title template appends it;
    // hard-coding it too rendered 'Price & Value | FigurePinner | FigurePinner'
    // on every figure SERP title (S52 fix).
    title: `${displayName} — ${line} Price & Value`,
    description: enriched
      ? `${enriched} ${priceTail}`
      : priceFragment
        ? `${displayName} ${line} sells for ~${priceFragment} (eBay sold data). Check current prices free — FigurePinner tracks real sold data.`
        : `${displayName} ${line} price — check what it actually sold for on eBay. FigurePinner tracks real sold comps free.`,
    alternates: { canonical },
    // Zero-sold-data pages stay noindexed (deliberate quality policy). The
    // has-unique-pretty-URL noindex was REMOVED 2026-07-12: hard-noindexing
    // ~11K indexed fid pages while their pretty replacements sat unindexed
    // drove the 22K→6K index collapse. Consolidation now rides the canonical
    // hint alone — Google may keep serving fid pages until it trusts the
    // pretty set, which is the desired behavior while domain authority is
    // thin. See WEBAUDIT-TO-WEB-GOOGLE-ZERO-ROOTCAUSE-2026-07-12.md (FIX-4).
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function FigureDetailPage({ params }: PageProps) {
  const { figure_id } = await params
  if (!getFigureById(figure_id)) {
    const canonical = getFigureById(FIGURE_ID_REDIRECTS[figure_id] ?? '') ?? getFigureByStableSuffix(figure_id)
    if (canonical) permanentRedirect(prettyFigureUrl(canonical))
  }
  return <FigureDetailContent figureId={figure_id} />
}
