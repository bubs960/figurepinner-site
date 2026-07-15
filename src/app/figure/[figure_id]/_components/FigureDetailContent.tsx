/**
 * FigureDetailContent — shared async server component
 * Renders the full figure detail page for a given figureId.
 * Used by both /figure/[figure_id] and /[genre]/[line]/[slug] routes
 * so both get the same content; canonical URL is controlled by generateMetadata.
 */

import { notFound } from 'next/navigation'
import { getFigureById, getFiguresByFandom, deriveName, figureUrl, prettyFigureUrl, isNumericWave } from '@/data/kb'
import { genreSlugForFandom } from '@/lib/genreFigures'
import AdSlot from '@/app/components/AdSlot'
import HeroBand from './HeroBand'
import BidCheck from './BidCheck'
import LoreBand from './LoreBand'
import FigureEnrichment from './FigureEnrichment'
import MarketPanel from './MarketPanel'
import CollectionPanel from './CollectionPanel'
import CtaRail from './CtaRail'
import EmptyState from './EmptyState'
import RelatedRow from './RelatedRow'
import SellerCard from './SellerCard'
import MobileActionBar from './MobileActionBar'
import { buildEbaySearchUrl, EBAY_CAMPAIGN_ID, formatCurrency, computeTrend, compCountToConfidence, prettifySlug, dataQualityState } from '../_lib/figureFormatters'
import DataQualityBadge from './DataQualityBadge'
import type { LoreInput } from '../_lib/loreRenderer'
import { enrichedDescription } from '../_lib/enrichedCopy'
import { getLineAttributes } from '../_lib/line-attributes-data'
import { getCharacterNotes } from '../_lib/character-notes-data'
import { getSellerListings } from '@/data/bubs-inventory'
import SeoSummary, { LINE_RETAIL_PRICE } from './SeoSummary'
import { derivePriceContract } from '../_lib/priceContract'
import { thumb } from '@/lib/imageUrl'
import SiteHeader from '@/app/components/SiteHeader'
import BreadcrumbJsonLd from '@/app/_components/BreadcrumbJsonLd'
import JsonLd from '@/app/_components/JsonLd'
import FunnelEvent from '@/app/_components/FunnelEvent'

const API_BASE = 'https://figurepinner-api.bubs960.workers.dev'
// EBAY_CAMPAIGN_ID now lives in figureFormatters.ts (single source of truth,
// so this fallback can't drift out of sync with other call sites again).

// ── API types ──────────────────────────────────────────────────────────────────

/** Per-condition aggregate bucket (matcher's 5/14 aggregation cron). */
export type CondBucket = {
  median: number | null; avg: number | null; min: number | null; max: number | null
  p10: number | null; p90: number | null; count: number
}

type PriceData = {
  figureId: string
  avgSold: number | null
  medianSold?: number | null
  minSold?: number | null
  maxSold?: number | null
  p25Sold?: number | null
  p75Sold?: number | null
  soldCount: number
  avgFS: number | null
  fsCount: number
  minFS: number | null
  soldHistory: Array<{
    price: number
    title: string
    condition: string
    sold_date: string
    listing_format: string
    /** Cron-classified bucket — present after matcher's 6/12 title-fallback deploy. */
    condition_effective?: 'sealed' | 'loose' | 'unknown'
  }>
  // Condition split (rendered 6/12 per Steve's critical directive).
  // GATE ON segmentation, not bucket presence — snapshots ship sealed/loose
  // objects even under 'pooled' when a bucket is below the >=5-comp
  // threshold (e.g. CM Punk Elite 1 ships sealed with n=1).
  sealed?: CondBucket | null
  loose?: CondBucket | null
  segmentation?: 'split' | 'sealed-only' | 'loose-only' | 'pooled'
  conditionInference?: { sealed_from_title: number; loose_from_title: number; overrides: number } | null
}

// ── Data fetching ──────────────────────────────────────────────────────────────

const R2_PROXY_BASE = 'https://figurepinner-r2proxy.bubs960.workers.dev'

type R2Snapshot = {
  figure_id: string; avg_sold: number | null; median_sold: number | null
  min_sold: number | null; max_sold: number | null; sold_count: number
  avg_fs: number | null; fs_count: number; min_fs: number | null
  recent: Array<{ price: number; title: string; condition: string; sold_date: string; listing_format: string; condition_effective?: 'sealed' | 'loose' | 'unknown' }>
  sealed?: CondBucket | null
  loose?: CondBucket | null
  condition_segmentation?: 'split' | 'sealed-only' | 'loose-only' | 'pooled'
  condition_inference?: { sealed_from_title: number; loose_from_title: number; overrides: number } | null
}

function _pctile(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0]
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx), hi = Math.ceil(idx)
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function _iqr(prices: number[]): { p25: number; p75: number } | null {
  const v = prices.filter(p => p > 0)
  if (v.length < 4) return null
  const s = [...v].sort((a, b) => a - b)
  return { p25: _pctile(s, 25), p75: _pctile(s, 75) }
}

/** Tukey "far out" upper fence (Q3 + 3·IQR) over a set of comp prices, used to
 *  cap the displayed range ceiling so a lone graded-lot / bundle / wrong-variant
 *  sale can't define it.
 *
 *  Why this is needed beyond the snapshot p10/p90: on a THIN bucket the 90th
 *  percentile lands ON the outlier (Cody Elite 3 loose, n=9 → p90 = the $249.95
 *  CIB lot), so P10–P90 alone leaves the contradiction in place. The fence is
 *  data-adaptive — a genuinely wide, multi-comp tail has a large IQR so the
 *  fence sits high and nothing is clipped; a tight cluster + one extreme has a
 *  small IQR so the extreme falls outside the fence and is disclosed instead.
 *
 *  3·IQR (the "extreme outlier" threshold), not 1.5 — sold-comp prices are
 *  right-skewed (log-normal-ish), and 1.5·IQR over-flags the normal upper tail.
 *  Returns the highest real comp at/under the fence + the count/max of comps
 *  above it. <4 comps → null (caller keeps the snapshot percentiles). */
function fencedHigh(prices: number[]): { high: number; excludedAbove: { count: number; max: number } } | null {
  const v = prices.filter(p => p > 0).sort((a, b) => a - b)
  if (v.length < 4) return null
  const q1 = _pctile(v, 25), q3 = _pctile(v, 75)
  const fence = q3 + 3 * (q3 - q1)
  const within = v.filter(p => p <= fence)
  const aboveCount = v.length - within.length
  if (!aboveCount || !within.length) return null
  return { high: within[within.length - 1], excludedAbove: { count: aboveCount, max: v[v.length - 1] } }
}

// A real sold_date is an ISO date string ("2025-12-01" or a full timestamp).
// null/0/"" coerce via `new Date()` to 1970-01-01 (NOT NaN, so they slip past
// the NaN filter and render as "Jan 1, 1970"), and a bare "0" coerces to
// 2000-01-01. Requiring a YYYY-MM-DD prefix rejects all of those, and a sanity
// floor (no eBay figure comp predates 2000) also rejects a literal "1970-01-01"
// string — returning null so the "Latest sold comp" line is suppressed. Self-
// heals once the nightly cron writes real ISO dates.
const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/
const MIN_VALID_SOLD_MS = Date.UTC(2000, 0, 1)

function latestSoldDate(soldHistory: PriceData['soldHistory']): { iso: string; label: string } | null {
  const dates = soldHistory
    .filter(comp => typeof comp.sold_date === 'string' && ISO_DATE_PREFIX.test(comp.sold_date))
    .map(comp => new Date(comp.sold_date))
    .filter(date => !Number.isNaN(date.getTime()) && date.getTime() >= MIN_VALID_SOLD_MS)

  if (!dates.length) return null

  const latest = dates.reduce((best, date) => (
    date.getTime() > best.getTime() ? date : best
  ))

  return {
    iso: latest.toISOString(),
    label: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(latest),
  }
}

export async function fetchFigurePageData(figure_id: string): Promise<{ price: PriceData | null; imageUrl: string | null }> {
  // AbortSignal.timeout() intentionally omitted: passing a dynamic signal
  // alongside next:{revalidate} opts the fetch out of Next's cache in Next 15,
  // forcing revalidate=0 → private/no-store on the entire route (BYPASS).
  // The r2proxy worker has its own upstream timeout; Cloudflare's 30s wall-clock
  // limit is the backstop. (Fix: S32, 2026-06-18 — WEB-HEALTH-ALERT-2026-06-16)
  const res = await fetch(
    `${R2_PROXY_BASE}/price-summaries/${encodeURIComponent(figure_id)}.json`,
    { next: { revalidate: 3600 } }
  ).catch(() => null)
  if (!res?.ok) return { price: null, imageUrl: null }
  const snap = await res.json().catch(() => null) as R2Snapshot | null
  if (!snap) return { price: null, imageUrl: null }
  const iqr = _iqr((snap.recent ?? []).map((s: { price: number }) => s.price))
  return {
    price: {
      figureId: figure_id, avgSold: snap.avg_sold, medianSold: snap.median_sold,
      minSold: snap.min_sold, maxSold: snap.max_sold,
      p25Sold: iqr?.p25 ?? null, p75Sold: iqr?.p75 ?? null,
      soldCount: snap.sold_count, avgFS: snap.avg_fs, fsCount: snap.fs_count,
      minFS: snap.min_fs, soldHistory: snap.recent ?? [],
      sealed: snap.sealed ?? null,
      loose: snap.loose ?? null,
      segmentation: snap.condition_segmentation ?? 'pooled',
      conditionInference: snap.condition_inference ?? null,
    },
    imageUrl: null,
  }
}

/** Bucket a recent comp the way the aggregation cron does: the cron's own
 *  condition_effective wins when present (post matcher's 6/12 deploy);
 *  otherwise eBay's structured condition (New/Open Box → sealed,
 *  Used/For Parts → loose; blank/other → unknown). */
function compBucket(c: { condition: string; condition_effective?: string }): 'sealed' | 'loose' | 'unknown' {
  if (c.condition_effective === 'sealed' || c.condition_effective === 'loose') return c.condition_effective
  const cond = (c.condition ?? '').toLowerCase()
  if (!cond) return 'unknown'
  if (cond.includes('new') || cond.includes('open box')) return 'sealed'
  if (cond.includes('used') || cond.includes('parts')) return 'loose'
  return 'unknown'
}

function conditionDepthLabel(count: number): string {
  if (count <= 1) return 'early signal'
  if (count < 5) return 'limited'
  return 'condition split'
}

// ── Main component ─────────────────────────────────────────────────────────────

export default async function FigureDetailContent({ figureId }: { figureId: string }) {
  const local = getFigureById(figureId)
  // A missing figure must be a true HTTP 404, not a 200 page that merely looks
  // like a 404. The old `<NotFoundState />` returned 200 — a soft-404 that wasted
  // crawl budget and let Google index junk /figure/<bad-id> URLs. notFound()
  // renders app/not-found.tsx with a real 404 status; a true 404 is de-indexed by
  // Google without an explicit X-Robots-Tag header. (SEO verify 2026-06-25, R5.)
  if (!local) notFound()

  const { price, imageUrl } = await fetchFigurePageData(figureId)
  const latestCompDate = price ? latestSoldDate(price.soldHistory) : null

  // ── Derived display values ──────────────────────────────────────────────────

  const displayName  = deriveName(local)
  const characterH1  = prettifySlug(local.character_canonical)
  const brand        = prettifySlug(local.manufacturer)
  const line         = prettifySlug(local.product_line)
  const genre        = local.fandom
  // Resolving genre URL slug — the figure's raw fandom may differ from the genre
  // route segment (marvel-comics→marvel, tmnt→teenage-mutant-ninja-turtles,
  // gi-joe→gijoe). Crumb links MUST use the slug or they 404. (SEO fix 2026-06-25.)
  const genreSlug    = genreSlugForFandom(local.fandom)
  const localAny     = local as Record<string, unknown>
  const releaseYear  = typeof localAny.release_year === 'number' ? localAny.release_year : null
  // Matcher bug report 2026-07-12: raw parseInt() stops at the first
  // non-digit, so a mangled release_wave slug like "3-75-orange-2013" (scale
  // + color-line + year, not a series number) parsed as "3" and the page
  // fabricated a "Series 3" with no relationship to reality. isNumericWave()
  // is the same real-vs-slug guard deriveName() already uses for this exact
  // field (kbTypes.ts) -- reused here instead of a second ad-hoc check.
  const seriesNum    = isNumericWave(local.release_wave) ? parseInt(local.release_wave, 10) : null
  // Matcher bug report 2026-07-12: `local.scale ?? null` only catches real
  // null/undefined -- the KB stores the literal string "None" for scale on
  // ~48% of fids (10,986/22,790, unmigrated legacy entries), which is truthy
  // and sailed through into SeoSummary's "is a None action figure" sentence.
  // exclusiveTo had the identical bug at one of its two call sites below
  // (the other already had this exact guard) -- computed once here for both
  // instead of leaving the fix duplicated ad hoc at each JSX call site.
  const scaleClean = (local.scale && local.scale !== 'None') ? local.scale : null
  // webaudit's independent sentinel census (2026-07-13 review of daf5b74)
  // found exclusive_to carries two MORE junk literals the original 'None'
  // guard didn't catch: "unspecified" (261 fids) and "Exclusive" (125 fids)
  // -- both truthy, both rendered as "Exclusive retailer: unspecified" or a
  // circular "Exclusive". Census says these 3 are the complete sentinel set
  // for this field; matcher owns the underlying 386-fid KB backfill.
  const EXCLUSIVE_TO_JUNK = new Set(['None', 'unspecified', 'Exclusive'])
  const exclusiveToClean = (local.exclusive_to && !EXCLUSIVE_TO_JUNK.has(local.exclusive_to)) ? local.exclusive_to : null
  const imageUrlFinal = imageUrl ?? local.canonical_image_url ?? null

  // ── eBay URL ────────────────────────────────────────────────────────────────
  // webaudit's 2026-07-13 review flagged this as a non-blocking eBay-CTA
  // quality item, same root cause as the Series-fabrication bug: raw
  // release_wave (a mangled slug like "3-75-orange-2013" on unmigrated
  // entries) was being appended straight into the search terms, polluting
  // the query on exactly the fids this bug class affects. isNumericWave()
  // is the same guard seriesNum already uses for this field.
  const ebayWave = isNumericWave(local.release_wave) ? local.release_wave : null
  const ebayUrl = buildEbaySearchUrl(characterH1, prettifySlug(genre), brand, line, ebayWave, EBAY_CAMPAIGN_ID)

  // ── Condition split (matcher's live aggregation; Steve directive 6/12) ──────
  // The headline market is the statistically valid bucket per segmentation;
  // 'pooled' keeps the legacy blended view. Gate on segmentation, never on
  // bucket presence (buckets ship below-threshold under 'pooled').
  const segmentation = price?.segmentation ?? 'pooled'
  const headlineBucket =
    segmentation === 'split' || segmentation === 'sealed-only' ? (price?.sealed ?? null)
    : segmentation === 'loose-only' ? (price?.loose ?? null)
    : null
  const headlineCondition: 'sealed' | 'loose' | null =
    headlineBucket == null ? null : (segmentation === 'loose-only' ? 'loose' : 'sealed')
  const placardConditionLabel =
    headlineCondition === 'sealed' ? 'sealed / carded'
    : headlineCondition === 'loose' ? 'loose'
    : null
  const placardSecondary =
    segmentation === 'split' && price?.loose && price.loose.median != null
      ? { label: 'Loose', median: price.loose.median, count: price.loose.count }
      : null
  const placardConditionRows = (() => {
    if (!price) return []
    const rows = [
      { key: 'sealed' as const, label: 'Sealed / carded', bucket: price.sealed ?? null },
      { key: 'loose' as const, label: 'Loose / opened', bucket: price.loose ?? null },
    ].flatMap(({ key, label, bucket }) => {
      if (!bucket || bucket.median == null || bucket.count < 1) return []
      const rangeLabel = bucket.min != null && bucket.max != null && bucket.max > bucket.min
        ? `${formatCurrency(bucket.min)}-${formatCurrency(bucket.max)}`
        : null
      return [{
        key,
        label,
        median: bucket.median,
        count: bucket.count,
        depthLabel: conditionDepthLabel(bucket.count),
        rangeLabel,
      }]
    })

    // If a statistically valid bucket is already the headline, keep the
    // condition rows for the other market. Under pooled, show both thin signals.
    return rows.filter(row => row.key !== headlineCondition)
  })()
  const inferenceNote = (() => {
    const inf = price?.conditionInference
    if (!inf) return null
    const n = (inf.sealed_from_title ?? 0) + (inf.loose_from_title ?? 0)
    return n > 0 ? `Includes ${n} comp${n === 1 ? '' : 's'} classified from the listing title.` : null
  })()

  const valuePricing = (() => {
    if (!price || price.soldCount === 0) return null
    const median = headlineBucket?.median ?? price.medianSold ?? price.avgSold ?? null
    // Label truthfulness (S55 FTC audit): the last fallback is the AVERAGE —
    // anything that names this value must not call it a median then.
    const medianIsAvg = headlineBucket?.median == null && price.medianSold == null && price.avgSold != null
    // Display range. Floor + base ceiling = the snapshot bucket percentiles
    // (full corpus) when present, else the soldHistory percentiles. The ceiling
    // is then ADDITIONALLY capped by a Tukey far-out fence over the displayed
    // comps, so a contaminated p90 (thin bucket where p90 sits on a graded-lot
    // outlier — Cody loose n=9, p90 = $249.95) can't define it. The cap only
    // ever narrows (never widens a clean range); when it bites, the clipped
    // extremes are disclosed (standalone audit #2: "label raw extremes").
    const bucketPrices = (headlineCondition
      ? price.soldHistory.filter(s => compBucket(s) === headlineCondition)
      : price.soldHistory
    ).map(s => s.price)
    const sortedBucket = [...bucketPrices].filter(p => p > 0).sort((a, b) => a - b)
    const low = headlineBucket?.p10
      ?? (sortedBucket.length >= 3 ? _pctile(sortedBucket, 10) : (price.minSold ?? null))
    const baseHigh = headlineBucket?.p90
      ?? (sortedBucket.length >= 3 ? _pctile(sortedBucket, 90) : (price.maxSold ?? null))
    const fence = fencedHigh(bucketPrices)
    const fenceBites = fence != null && baseHigh != null && fence.high < baseHigh
    const high = fenceBites ? fence!.high : baseHigh
    const rangeExtremeNote = fenceBites
      ? `Range excludes ${fence!.excludedAbove.count} higher sale${fence!.excludedAbove.count === 1 ? '' : 's'} up to ${formatCurrency(fence!.excludedAbove.max)} — likely a graded lot, bundle, or wrong variant.`
      : null
    // Dispersion warning: when the raw spread is >4x the median, comp set likely
    // contains contaminated listings (wrong series, graded lots, wrong figure).
    // Cap displayed confidence at 4 and surface a caveat label.
    const rawSpread = (price.maxSold ?? 0) - (price.minSold ?? 0)
    const dispersionRatio = median && median > 0 ? rawSpread / median : 0
    const dispersionWarning = dispersionRatio > 4
    const compCount = headlineBucket?.count ?? price.soldCount
    const baseConfidence = compCountToConfidence(compCount)
    const confidence: 1 | 2 | 3 | 4 | 5 = (dispersionWarning && baseConfidence > 4)
      ? 4
      : baseConfidence
    return {
      median,
      medianIsAvg,
      trend_90d_pct: computeTrend(price.soldHistory),
      low,
      high,
      confidence,
      comp_count:         compCount,
      dispersion_warning: dispersionWarning,
      rangeExtremeNote,
    }
  })()

  // ── Placard extras (shelf hero) ─────────────────────────────────────────────
  // Range-bar ticks: recent comp prices normalized into [low, high].
  const placardTicks = (() => {
    if (!price || !valuePricing || valuePricing.low == null || valuePricing.high == null) return []
    const lo = valuePricing.low, hi = valuePricing.high
    if (hi <= lo) return []
    // When a headline bucket drives the placard, only that bucket's comps
    // tick the range bar — unbucketable comps stay off an honest bar.
    const comps = headlineCondition
      ? price.soldHistory.filter(s => compBucket(s) === headlineCondition)
      : price.soldHistory
    return comps.slice(0, 30)
      .map(s => (s.price - lo) / (hi - lo))
      .filter(v => v >= -0.02 && v <= 1.02)
      .map(v => Math.min(1, Math.max(0, v)))
  })()
  // Most recent individual sale — picked by max sold_date (order of recent[]
  // is not trusted). Constrained to the headline bucket and to the DISPLAYED
  // range [low, high], so "most recent sale" can't show a fence-excluded
  // outlier above the range ceiling (e.g. a graded-lot $180 over a $97 high).
  const lastSale = (() => {
    if (!price || !price.soldHistory.length) return null
    const lo = valuePricing?.low ?? -Infinity
    const hi = valuePricing?.high ?? Infinity
    const eligible = price.soldHistory.filter(s =>
      s.sold_date &&
      s.price >= lo && s.price <= hi &&
      (headlineCondition ? compBucket(s) === headlineCondition : true)
    )
    let best: { price: number; sold_date?: string } | null = null
    for (const s of eligible) {
      if (!best || String(s.sold_date) > String(best.sold_date)) best = s
    }
    return best ? { price: best.price } : null
  })()

  // ── MarketPanel props ───────────────────────────────────────────────────────

  const marketPricing = price && price.soldCount > 0 ? {
    median:       price.medianSold ?? price.avgSold ?? null,
    medianIsAvg:  price.medianSold == null && price.avgSold != null,
    comp_count:   price.soldCount,
    chart_points: price.soldHistory.map(s => ({ date: s.sold_date, price: s.price })),
    recent_comps: price.soldHistory.map(s => ({
      title:          s.title,
      price:          s.price,
      sold_date:      s.sold_date,
      condition:      s.condition,
      listing_format: s.listing_format,
    })),
  } : null

  // ── LoreBand props ──────────────────────────────────────────────────────────

  const lineAttrs   = getLineAttributes(local.product_line)
  const loreInput: LoreInput = {
    character_slug:  local.character_canonical,
    brand,
    line_attributes: lineAttrs,
    character_notes: getCharacterNotes(local.character_canonical),
    release_year:    releaseYear,
  }

  // ── Seller listings ─────────────────────────────────────────────────────────

  const sellerListings = getSellerListings(figureId)

  // ── Related figures ─────────────────────────────────────────────────────────

  const allInGenre = getFiguresByFandom(genre)

  // Full wave (uncapped, includes the current figure) — drives an honest
  // "you own N of M" denominator. The visible row is still capped at 12.
  const fullWave = allInGenre.filter(f =>
    f.product_line === local.product_line &&
    f.release_wave === local.release_wave
  )
  const waveFids = fullWave.map(f => f.figure_id)

  const seriesCompanions = fullWave
    .filter(f => f.figure_id !== figureId)
    .slice(0, 12)
    .map(f => ({
      figure_id: f.figure_id,
      href: figureUrl(f),
      name: f.character_canonical.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      imageUrl: thumb(f.canonical_image_url, 180),
    }))

  const characterVariantsAll = allInGenre.filter(f =>
    f.figure_id !== figureId &&
    f.character_canonical === local.character_canonical
  )
  const characterVariants = characterVariantsAll
    .slice(0, 12)
    .map(f => ({
      figure_id: f.figure_id,
      href: figureUrl(f),
      name: deriveName(f),
      imageUrl: thumb(f.canonical_image_url, 180),
    }))
  const characterHubHref = `/${genreSlug}/character/${local.character_canonical}`

  // ── JSON-LD ─────────────────────────────────────────────────────────────────
  // This is a price-guide page, not a merchant product page. Keep the structured
  // data truthful by describing the figure as the page's subject and exposing
  // sold-comp stats as properties instead of marking the median as an active
  // Offer from FigurePinner.

  // ── JSON-LD additional properties ──────────────────────────────────────────
  // Retail price from line-level defaults (same source as SeoSummary).
  const jsonLdRetailPrice = LINE_RETAIL_PRICE[local.product_line] ?? null

  // Sales velocity for JSON-LD — mirrors SeoSummary logic.
  const jsonLdVelocity = (() => {
    const history = price?.soldHistory
    if (!history || history.length < 3) return null
    const dates = history.map(s => new Date(s.sold_date).getTime()).filter(t => !isNaN(t)).sort((a, b) => a - b)
    if (dates.length < 3) return null
    const rangeDays = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24)
    if (rangeDays < 7) return null
    const spd = history.length / rangeDays
    if (spd >= 1)    return `~${Math.round(spd)} per day`
    if (spd >= 0.14) return `~${Math.round(spd * 7)} per week`
    const pm = Math.round(spd * 30)
    return pm >= 1 ? `~${pm} per month` : null
  })()

  // FPPS-01 (2026-07-15, Steve's binding decision 1 + 5): JSON-LD must never
  // emit a single pooled "Median sold price" when sealed and loose both have
  // real data -- that's exactly the pooled-vs-visible-page mismatch webaudit
  // flagged (this figure's page shows $180/$20 split; the OLD JSON-LD here
  // agreed by coincidence because it read the same headlineBucket valuePricing
  // already used, but the field was still misleadingly named as if it were
  // the only price). Both conditions present -> two labeled PropertyValues,
  // no single "Median sold price". One condition (or pooled) -> keep the
  // single labeled property, still tier-gated (suppressed <3-comp buckets
  // emit no price property at all for that condition).
  const jsonLdPriceContract = derivePriceContract(price ? {
    soldCount: price.soldCount,
    medianSold: price.medianSold,
    avgSold: price.avgSold,
    sealed: price.sealed,
    loose: price.loose,
    segmentation: price.segmentation,
  } : null)
  const jsonLdPriceProperties = (() => {
    if (jsonLdPriceContract.hasBothConditions) {
      return [
        jsonLdPriceContract.sealed?.median != null
          ? { '@type': 'PropertyValue', name: 'Sealed / carded median sold price', value: formatCurrency(jsonLdPriceContract.sealed.median) }
          : null,
        jsonLdPriceContract.loose?.median != null
          ? { '@type': 'PropertyValue', name: 'Loose median sold price', value: formatCurrency(jsonLdPriceContract.loose.median) }
          : null,
      ]
    }
    const only = jsonLdPriceContract.sealed?.median != null ? jsonLdPriceContract.sealed
      : jsonLdPriceContract.loose?.median != null ? jsonLdPriceContract.loose
      : null
    if (only) {
      return [{ '@type': 'PropertyValue', name: `${only.label} median sold price`, value: formatCurrency(only.median!) }]
    }
    if (jsonLdPriceContract.pooled?.median != null) {
      return [{ '@type': 'PropertyValue', name: jsonLdPriceContract.pooled.isAvg ? 'Average sold price' : 'Median sold price', value: formatCurrency(jsonLdPriceContract.pooled.median) }]
    }
    return []
  })()

  const valueProperties = [
    ...jsonLdPriceProperties,
    price?.soldCount != null
      ? { '@type': 'PropertyValue', name: 'Sold comp count', value: String(price.soldCount) }
      : null,
    valuePricing?.low != null && valuePricing?.high != null
      ? { '@type': 'PropertyValue', name: 'Recent sold range', value: `${formatCurrency(valuePricing.low)} to ${formatCurrency(valuePricing.high)}` }
      : null,
    // Matcher bug report 2026-07-12: both of these fed the RAW KB field
    // straight into structured data. release_wave is often a mangled slug
    // (not a real series number) -- seriesNum is the already-guarded parsed
    // value used elsewhere on this page, reused here instead of a second
    // raw read. scale uses the same "None" string guard as the visible copy.
    seriesNum != null
      ? { '@type': 'PropertyValue', name: 'Series', value: String(seriesNum) }
      : null,
    scaleClean
      ? { '@type': 'PropertyValue', name: 'Scale', value: scaleClean }
      : null,
    jsonLdRetailPrice != null
      ? { '@type': 'PropertyValue', name: 'Original retail price', value: formatCurrency(jsonLdRetailPrice) }
      : null,
    jsonLdVelocity != null
      ? { '@type': 'PropertyValue', name: 'Sales velocity', value: jsonLdVelocity }
      : null,
    exclusiveToClean
      ? { '@type': 'PropertyValue', name: 'Exclusive retailer', value: exclusiveToClean }
      : null,
  ].filter(Boolean)

  // AggregateOffer — required by Google for Product rich results.
  // FPPS-01 (2026-07-15, Steve's decision 5): AggregateOffer.price is a
  // SINGLE representative value by spec -- it cannot honestly represent two
  // condition-specific medians. When both sealed and loose have real data,
  // omit `price` entirely (lowPrice/highPrice still ship -- that's a genuine
  // range across all comps, not a misleading single figure) rather than
  // picking one condition to report as "the" price, which is exactly the
  // price/page mismatch Google's own Product-schema guidance penalizes.
  // Single-condition or pooled figures keep `price` as before, still gated
  // on the same tier: <3 total comps still omits offers entirely.
  const jsonLdOfferPrice = jsonLdPriceContract.hasBothConditions
    ? null // both conditions honest, but AggregateOffer can't say "two prices"
    : (jsonLdPriceContract.sealed?.median ?? jsonLdPriceContract.loose?.median ?? jsonLdPriceContract.pooled?.median ?? null)
  const jsonLdOffers =
    !jsonLdPriceContract.hasNoData && (price?.soldCount ?? 0) >= 3 && (jsonLdOfferPrice != null || jsonLdPriceContract.hasBothConditions)
      ? {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          ...(jsonLdOfferPrice != null ? { price: jsonLdOfferPrice.toFixed(2) } : {}),
          ...(valuePricing?.low != null ? { lowPrice: valuePricing.low.toFixed(2) } : {}),
          ...(valuePricing?.high != null ? { highPrice: valuePricing.high.toFixed(2) } : {}),
          offerCount: price!.soldCount,
          itemCondition: 'https://schema.org/UsedCondition',
          availability: 'https://schema.org/InStock',
          seller: { '@type': 'Organization', name: 'FigurePinner', url: 'https://figurepinner.com' },
        }
      : undefined

  // Gated enrichment prose replaces the templated boilerplate when present
  // (S52 meta wiring — same gate as generateMetadata, so meta description and
  // structured data tell Google the same differentiated story per figure).
  const jsonLdEnriched = enrichedDescription(local)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${displayName} Price Guide`,
    description: jsonLdEnriched
      ?? `${displayName} action figure price guide by ${brand}. ${line}${seriesNum ? ` Series ${seriesNum}` : ''}.`,
    mainEntity: {
      '@type': 'Product',
      name:        displayName,
      description: jsonLdEnriched
        ?? `${displayName} action figure by ${brand}. ${line}${seriesNum ? ` Series ${seriesNum}` : ''}.`,
      brand:       { '@type': 'Brand', name: brand },
      image:       imageUrlFinal ?? undefined,
      category:    prettifySlug(genre),
      additionalProperty: valueProperties.length ? valueProperties : undefined,
      ...(jsonLdOffers ? { offers: jsonLdOffers } : {}),
    },
  }

  const hasPricing = marketPricing != null

  // FPPS-01 (2026-07-15, folded in per webaudit scope note): MobileActionBar
  // is a fixed-width sticky bar -- genuinely space-constrained like a meta
  // tag, so it can't lay out two full condition rows without breaking its
  // own design. Rather than keep showing ONE unlabeled headline number
  // (the original bug), it shows ONE number but with an honest sub-label
  // naming which condition it is ("Sealed" / "Loose" / "Median sold" for
  // pooled), and suppresses per the same tier as every other surface. This
  // does NOT fully satisfy "show both, always" on this one narrow surface --
  // flagged to webaudit in the fix packet rather than silently redesigning
  // the component's layout under this ticket.
  const mobileActionBarPrice = (() => {
    const c = jsonLdPriceContract
    if (c.hasNoData) return { priceLabel: null, priceSubLabel: null }
    const lead = c.sealed?.median != null ? { median: c.sealed.median, label: 'Sealed' }
      : c.loose?.median != null ? { median: c.loose.median, label: 'Loose' }
      : c.pooled?.median != null ? { median: c.pooled.median, label: c.pooled.isAvg ? 'Average sold' : 'Median sold' }
      : null
    return lead
      ? { priceLabel: formatCurrency(lead.median), priceSubLabel: lead.label }
      : { priceLabel: null, priceSubLabel: null }
  })()

  return (
    <div className="fp-shelf" style={{ background: 'var(--fp-bg)', minHeight: '100vh', color: 'var(--fp-text)', fontFamily: 'var(--fp-font-body)' }}>
      <JsonLd data={jsonLd} />
      <FunnelEvent
        event="figure_view"
        detail={{
          figureId,
          genre,
          line: local.product_line,
        }}
      />
      <BreadcrumbJsonLd crumbs={[
        { name: 'Home', url: 'https://figurepinner.com' },
        { name: prettifySlug(genreSlug), url: `https://figurepinner.com/${genreSlug}` },
        { name: line, url: `https://figurepinner.com/${genreSlug}/${local.product_line}` },
        { name: characterH1, url: `https://figurepinner.com${characterHubHref}` },
        { name: displayName, url: `https://figurepinner.com${prettyFigureUrl(local)}` },
      ]} />

      {/* Shelf design tokens (scoped) + responsive overrides */}
      <style>{`
        .fp-shelf {
          --shelf-cream:     #f2e8d5;
          --shelf-cream-dim: rgba(242,232,213,0.60);
          --shelf-cream-mut: rgba(242,232,213,0.38);
          --shelf-gold:      var(--vitrine-gold);
          --shelf-gold-hi:   var(--vitrine-gold-hi);
          --shelf-line:      rgba(242,232,213,0.08);
          --shelf-line-gold: rgba(224,168,62,0.20);
          --shelf-mount:     linear-gradient(180deg,#fbf7ee 0%,#efe5d0 100%);
        }
        @media (max-width: 768px) {
          .fp-hero-grid  { grid-template-columns: 1fr !important; }
          .fp-main-grid  { grid-template-columns: 1fr !important; }
          .fp-cta-rail   { grid-template-columns: 1fr !important; }
          .fp-right-col  { position: static !important; }
        }
      `}</style>

      <SiteHeader crumbs={[
        { label: prettifySlug(genreSlug), href: `/${genreSlug}` },
        { label: line, href: `/${genreSlug}/${local.product_line}` },
        { label: characterH1, href: characterHubHref },
        { label: displayName },
      ]} />

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

        {/* Zone 1 — Hero: image + identity + price strip (inline at wide viewports) */}
        <div style={{ marginBottom: '1.75rem' }}>
          <HeroBand
            className="fp-hero-grid"
            figureId={figureId}
            imageUrl={thumb(imageUrlFinal, 760)}
            characterName={characterH1}
            brand={brand}
            lineName={lineAttrs?.display_name ?? line}
            series={seriesNum}
            scale={scaleClean}
            eraLabel={lineAttrs?.era_label ?? null}
            releaseYear={releaseYear}
            rarityTier={null}
            genre={genre}
            valuePricing={valuePricing}
            loreText={local.match_represented ?? null}
            ticks={placardTicks}
            lastSale={lastSale}
            conditionLabel={placardConditionLabel}
            conditionRows={placardConditionRows}
            secondary={placardSecondary}
            inferenceNote={inferenceNote}
          />
        </div>

        {/* Zone 2b — Bid Check verdict widget (S16, north star). Renders only
            when sold comps exist; zero-comp figures keep the EmptyState flow. */}
        {marketPricing && marketPricing.recent_comps.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <BidCheck
              comps={marketPricing.recent_comps.map(c => ({ price: c.price, condition: c.condition }))}
              segmentation={segmentation}
              sealedMedian={price?.sealed?.median ?? null}
              sealedCount={price?.sealed?.count ?? 0}
              looseMedian={price?.loose?.median ?? null}
              looseCount={price?.loose?.count ?? 0}
            />
          </div>
        )}

        {/* Zone 3 — Lore band */}
        <div style={{ marginBottom: '1.5rem' }}>
          <LoreBand loreInput={loreInput} />
        </div>

        {/* Zone 3b — Per-figure enrichment (match represented + key features).
            Render-safe: shows only for fids matcher has enriched. */}
        <div style={{ marginBottom: '1.5rem' }}>
          {/* match_represented renders in the hero lore slot now — features only here */}
          <FigureEnrichment
            matchRepresented={null}
            keyFeatures={local.key_features}
          />
        </div>


        {/* Seller listing */}
        {sellerListings.length > 0 && (
          <SellerCard listings={sellerListings} />
        )}

        {/* Zones 4 + 5 — Market panel + collection panel */}
        <div
          className="fp-main-grid"
          style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start', marginBottom: '2rem' }}
        >
          <div>
            {/* Per-figure data quality badge — sets honest expectations
                BEFORE the user sees the price. Powers our move from opaque
                coverage gating toward per-figure transparency. */}
            <div style={{ marginBottom: '1rem' }}>
              <DataQualityBadge
                state={dataQualityState(price?.soldCount ?? 0)}
                compCount={price?.soldCount ?? 0}
                compact={hasPricing}
              />
              {latestCompDate && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--fp-muted)',
                }}>
                  Latest sold comp: <time dateTime={latestCompDate.iso}>{latestCompDate.label}</time>
                </div>
              )}
            </div>

            {hasPricing ? (
              <MarketPanel
                pricing={marketPricing}
                ebaySearchUrl={ebayUrl}
                figureName={displayName}
                buckets={{
                  segmentation,
                  sealed: price?.sealed ?? null,
                  loose: price?.loose ?? null,
                }}
                trendPct={valuePricing?.trend_90d_pct ?? null}
              />
            ) : (
              <EmptyState figureId={figureId} figureName={displayName} ebaySearchUrl={ebayUrl} />
            )}
          </div>

          <div className="fp-right-col" style={{ position: 'sticky', top: '72px' }}>
            <CollectionPanel
              figureId={figureId}
              figureName={displayName}
              brand={brand}
              line={line}
              genre={genre}
              ebaySearchUrl={ebayUrl}
              median={valuePricing?.median ?? null}
              medianIsAvg={valuePricing?.medianIsAvg ?? false}
              compCount={price?.soldCount ?? 0}
              scale={scaleClean}
              series={seriesNum}
              packSize={Number(local.pack_size) || 1}
              exclusiveTo={exclusiveToClean}
              imgSrc={thumb(imageUrlFinal, 760)}
              whisper={jsonLdEnriched}
            />
          </div>
        </div>

        {/* Ad — Adsterra Banner (468×60), below the price/comps panel
            (ad-revenue plan S4: unit 1 of 2 on figure pages) */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }}>
          <AdSlot slot="adsterra-banner" />
        </div>

        {/* SEO Summary — natural language paragraph + retail vs market + velocity */}
        <SeoSummary
          displayName={displayName}
          brand={brand}
          line={line}
          productLine={local.product_line}
          seriesNum={seriesNum}
          scale={scaleClean}
          exclusiveTo={exclusiveToClean}
          soldCount={price?.soldCount ?? 0}
          priceInput={price ? {
            soldCount: price.soldCount,
            medianSold: price.medianSold,
            avgSold: price.avgSold,
            sealed: price.sealed,
            loose: price.loose,
            segmentation: price.segmentation,
          } : null}
          median={valuePricing?.median ?? null}
          medianIsAvg={valuePricing?.medianIsAvg ?? false}
          trendPct={valuePricing?.trend_90d_pct ?? null}
          soldHistory={price?.soldHistory ?? []}
        />

        {/* Zone 6 — Series companions */}
        <RelatedRow
          label={`Complete the Wave — ${line}${seriesNum ? ` Series ${seriesNum}` : ''}`}
          figures={seriesCompanions}
          ownershipFids={waveFids}
        />

        {/* Zone 7 — Character thread */}
        <RelatedRow
          label={`Every Version of ${characterH1}`}
          figures={characterVariants}
          accentColor="var(--fp-accent-warm)"
          headerLink={{
            href: characterHubHref,
            label: `See all ${characterVariantsAll.length + 1} ${characterH1} figures →`,
          }}
        />

        {/* Zone 8 — CTA rail */}
        <CtaRail genre={genre} brand={brand} line={line} lineSlug={local.product_line} />

        {/* Ad — Adsterra Banner (468×60), page bottom after related figures
            (ad-revenue plan S4: unit 2 of 2 — native slot converts to banner,
            format swap not removal; no native widgets sitewide per plan S3.2) */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0 0.5rem' }}>
          <AdSlot slot="adsterra-banner" />
        </div>
      </main>

      {/* Sticky mobile action bar — phones only, feature-flag gated.
          eBay href = the same campid-guarded ebayUrl used everywhere else. */}
      <MobileActionBar
        figureId={figureId}
        ebaySearchUrl={ebayUrl}
        figureName={displayName}
        {...mobileActionBarPrice}
      />

      {/* Footer is rendered globally by the root layout (src/app/layout.tsx). */}
    </div>
  )
}

// ── Micro components ───────────────────────────────────────────────────────────
