/**
 * FigureDetailContent — shared async server component
 * Renders the full figure detail page for a given figureId.
 * Used by both /figure/[figure_id] and /[genre]/[line]/[slug] routes
 * so both get the same content; canonical URL is controlled by generateMetadata.
 */

import { notFound } from 'next/navigation'
import { getFigureById, getWaveCompanions, getCardsByCharacter, prettyFigureUrls, deriveName, figureUrl } from '@/data/kbDb'
import { isNumericWave, passportValue, type KBFigure } from '@/data/kbTypes'
import { genreSlugForFandom, genreCrumbForFandom } from '@/lib/genreFigures'
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
import LiquidBackground from './LiquidBackground'
import { buildEbaySearchUrl, EBAY_CAMPAIGN_ID, formatCurrency, computeTrend, compCountToConfidence, prettifySlug, dataQualityState, priceCompTier, MIN_COMPS_TO_QUOTE } from '../_lib/figureFormatters'
import DataQualityBadge from './DataQualityBadge'
import type { LoreInput } from '../_lib/loreRenderer'
import { enrichedDescription, gatedLoreText, gatedKeyFeatures } from '../_lib/enrichedCopy'
import { getLineAttributes } from '../_lib/line-attributes-data'
import { getCharacterNotes } from '../_lib/character-notes-data'
import { getSellerListings } from '@/data/bubs-inventory'
import SeoSummary, { LINE_RETAIL_PRICE } from './SeoSummary'
import DecisionPassportPreview, { type IdentityRow } from './DecisionPassportPreview'
import GoldenCorpusPassport from './GoldenCorpusPassport'
import ScalePassport from './ScalePassport'
import GoldenCorpusAtAGlance from './GoldenCorpusAtAGlance'
import { getGoldenCorpusClaims } from '../_lib/goldenCorpus'
import { derivePriceContract, quotableBuckets } from '../_lib/priceContract'
import { thumb } from '@/lib/imageUrl'
import { formatShortDateWithYear } from '@/lib/safeDate'
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

import { readPriceObject } from '@/lib/priceStore'

/** Weekly-median history (matcher's price-history emitter, live 2026-08-14 —
 *  MATCHER-TO-WEB-PRICE-HISTORY-EMITTER-LIVE-2026-08-14.md). Contract: exactly
 *  13 weeks oldest-first; sparse weeks are real (render gaps, never suppress);
 *  delta_90d is authoritative — NEVER compute a delta from the weeks array
 *  (it's deliberately null when window_truncated). Absent object = the
 *  backfill cycle hasn't reached this fid yet → render the strip off. */
export type PriceHistoryWeek = {
  week: string
  loose_median: number | null
  sealed_median: number | null
  n: number
}
export type PriceHistory = {
  figure_id: string
  generated_at: string
  weeks: PriceHistoryWeek[]
  delta_90d: { loose: number | null; sealed: number | null }
  window_truncated: boolean
}

// D2 (2026-09-02, webaudit release-A correction + omnibus item 1; Steve's call,
// defaulted per the 9/2 "jump right in" ruling): the two R2 price fetches below
// used `revalidate: 3600`, and a route's effective revalidate is the MINIMUM of
// its own export and every cached fetch inside it — so /figure/[figure_id] and
// /[genre]/[line]/[slug] declared 86400 but were really 1-hour pages, and the
// 9,973 sitemap-submitted /figure/fp_* URLs recooled hourly (23K cold renders a
// day for Google alone). Prices refresh on a DAILY aggregation cadence upstream
// (figure/[figure_id]/page.tsx:22), so a 24h data cache loses nothing; the
// "Latest sold comp: <date>" label is the honesty surface. KV fetch-cache TTL
// scales with this in src/lib/kv-incremental-cache-ttl.ts (must stay > this).
export const PRICE_FETCH_REVALIDATE_SECONDS = 86400

export async function fetchPriceHistory(figure_id: string): Promise<PriceHistory | null> {
  try {
    // Direct R2 read (Release K, 2026-09-03) — see src/lib/priceStore.ts; the
    // 24h revalidate only applies on the proxy fallback.
    const data = await readPriceObject<PriceHistory>('price-history', figure_id, PRICE_FETCH_REVALIDATE_SECONDS)
    if (!data || !Array.isArray(data.weeks) || data.weeks.length === 0) return null
    return data
  } catch {
    return null
  }
}

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

  // Server Component (this whole file has no 'use client'), safe by
  // mechanism today — uses the shared safeDate util anyway per
  // src/lib/safeDate.ts's rule (same option shape as the confirmed #418 bug).
  return {
    iso: latest.toISOString(),
    label: formatShortDateWithYear(latest),
  }
}

export async function fetchFigurePageData(figure_id: string): Promise<{ price: PriceData | null; imageUrl: string | null }> {
  // AbortSignal.timeout() intentionally omitted: passing a dynamic signal
  // alongside next:{revalidate} opts the fetch out of Next's cache in Next 15,
  // forcing revalidate=0 → private/no-store on the entire route (BYPASS).
  // The r2proxy worker has its own upstream timeout; Cloudflare's 30s wall-clock
  // limit is the backstop. (Fix: S32, 2026-06-18 — WEB-HEALTH-ALERT-2026-06-16)
  // Direct R2 read (Release K, 2026-09-03): was a fetch to the r2proxy Worker —
  // p50 623 ms of the cold render. See src/lib/priceStore.ts.
  const snap = await readPriceObject<R2Snapshot>('price-summaries', figure_id, PRICE_FETCH_REVALIDATE_SECONDS)
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
  const local = await getFigureById(figureId)
  // A missing figure must be a true HTTP 404, not a 200 page that merely looks
  // like a 404. The old `<NotFoundState />` returned 200 — a soft-404 that wasted
  // crawl budget and let Google index junk /figure/<bad-id> URLs. notFound()
  // renders app/not-found.tsx with a real 404 status; a true 404 is de-indexed by
  // Google without an explicit X-Robots-Tag header. (SEO verify 2026-06-25, R5.)
  if (!local) notFound()

  // One await for every read that needs only `local` (2026-09-02 speed sweep,
  // finding 3): these used to run in three serialized stages — price fetches,
  // then seller listings, then wave/character cards, then the golden-corpus
  // doc — 60–160 ms of avoidable latency on every cold figure render. Only
  // prettyFigureUrls (below) genuinely depends on a result here.
  // Phase timing (2026-09-03, webaudit ask 2 "instrument the figure render"):
  // the release-h tail put cold figure renders at wall p50 1.2 s / CPU p95
  // 1.4 s with no breakdown. Each read below is timed and ONE line is logged
  // per render -- `[figure-timing] {...}` -- which wrangler tail /
  // FP-WorkerTailCapture pick up. Zero cost (console.log only). Remove or
  // gate once the breakdown has answered where the second goes.
  const t0 = Date.now()
  const timings: Record<string, number> = {}
  const timed = async <T,>(name: string, p: Promise<T>): Promise<T> => {
    const s = Date.now()
    try { return await p } finally { timings[name] = Date.now() - s }
  }
  const [{ price, imageUrl }, priceHistory, sellerListings, fullWave, characterCards, goldenCorpusDoc] = await Promise.all([
    timed('price', fetchFigurePageData(figureId)),
    timed('history', fetchPriceHistory(figureId)),
    timed('sellers', getSellerListings(figureId)),
    timed('wave', getWaveCompanions(local.fandom, local.product_line, local.release_wave)),
    timed('character', getCardsByCharacter(local.fandom, local.character_canonical)),
    timed('golden', getGoldenCorpusClaims(figureId, local.passport?.sidecar)),
  ])
  timings.reads = Date.now() - t0
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
  // The genre CRUMB is a separate question from the genre URL SEGMENT above:
  // genreSlugForFandom() identity-falls-back, so for the 7 hub-less fandoms it
  // produced a crumb href to a live 404 (measured 2026-07-27, ~1,922 pages).
  // null => omit the crumb entirely. Line and character crumbs keep genreSlug —
  // both those routes serve 200 under the raw fandom. See genreCrumbForFandom().
  const genreCrumb   = genreCrumbForFandom(local.fandom)
  const localAny     = local as Record<string, unknown>
  // Per-figure year shipped in the slim export 2026-08-11 (52.8% coverage);
  // the legacy release_year read stays as fallback for any record shape drift.
  // 2026-08-24: the KB stores `year` as a string for 32.6% of figures (7,577
  // of 23,243, all clean 4-digit values) despite the type declaring `number`
  // -- a bare `typeof === 'number'` guard silently dropped every one of them.
  const releaseYear  = typeof local.year === 'number'
    ? local.year
    : typeof local.year === 'string' && /^\d{4}$/.test(local.year)
      ? Number(local.year)
      : typeof localAny.release_year === 'number' ? localAny.release_year : null
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

  // ── Condition split (Steve, 2026-07-17 -- condition-blend census: 3,839
  // affected fids, 20.3% of priced pages showed a blended sealed+loose number
  // even though real per-condition data existed underneath). OLD gate trusted
  // matcher's segmentation label -- 'pooled' always fell back to the blended
  // view, even when real sealed+loose buckets existed (the aggregation cron
  // just hadn't classified them 'split'). CollectionPanel/MobileActionBar
  // already avoid this by keying off REAL bucket presence via
  // jsonLdPriceContract instead of the segmentation string. Steve's decision:
  // strict -- never blend, everywhere, to match. jsonLdPriceContract is
  // hoisted here from its old spot near the JSON-LD block below (same single
  // derivePriceContract call, now also driving the headline -- not a second
  // computation).
  //
  // NOTE: `segmentation` (the raw matcher label) stays declared -- BidCheck
  // and MarketPanel's own buckets prop still legitimately consume the raw
  // label for their own separate logic. Only headlineBucket/headlineCondition
  // below switch from the raw label to bucket-presence-based selection.
  const segmentation = price?.segmentation ?? 'pooled'
  const jsonLdPriceContract = derivePriceContract(price ? {
    soldCount: price.soldCount,
    medianSold: price.medianSold,
    avgSold: price.avgSold,
    sealed: price.sealed,
    loose: price.loose,
    segmentation: price.segmentation,
  } : null)
  // PRESENT (bucket object exists, count>=1) vs USABLE (also tier-cleared --
  // .median survives the <3-comp suppress rule) are different questions. A
  // present-but-suppressed bucket can't lead as a headline number, but its
  // mere presence still must block the legacy blended fallback below -- a
  // present-but-thin bucket is more honest than a blended figure even when
  // it's too thin to show a number of its own (same rule CollectionPanel/
  // MobileActionBar already apply via jsonLdPriceContract.pooled's own gate).
  const sealedPresent = jsonLdPriceContract.sealed != null
  const loosePresent = jsonLdPriceContract.loose != null
  const sealedUsable = jsonLdPriceContract.sealed?.median != null
  const looseUsable = jsonLdPriceContract.loose?.median != null
  // Hero price block buckets, gated by the SAME floor as everything else
  // (FPPS-01 rule 2 via quotableBuckets) -- never the raw buckets. 2026-09-02,
  // webaudit pass-1 defect 1: the raw pass-through let a 2-comp loose bucket
  // render "$25 · LOW" here while Bid Check and Recent Sales refused it.
  const quotable = quotableBuckets(price?.sealed, price?.loose)
  const headlineBucket =
    sealedUsable ? (price?.sealed ?? null)
    : looseUsable ? (price?.loose ?? null)
    : null
  const headlineCondition: 'sealed' | 'loose' | null =
    headlineBucket == null ? null : (sealedUsable ? 'sealed' : 'loose')
  const placardConditionLabel =
    headlineCondition === 'sealed' ? 'sealed / carded'
    : headlineCondition === 'loose' ? 'loose'
    : null
  const placardSecondary =
    segmentation === 'split' && looseUsable && price?.loose && price.loose.median != null
      ? { label: 'Loose', median: price.loose.median, count: price.loose.count }
      : null
  const placardConditionRows = (() => {
    if (!price) return []
    const rows = [
      { key: 'sealed' as const, label: 'Sealed / carded', bucket: price.sealed ?? null },
      { key: 'loose' as const, label: 'Loose / opened', bucket: price.loose ?? null },
    ].flatMap(({ key, label, bucket }) => {
      // Same floor as every other price surface (FPPS-01 rule 2) -- a 1-2 comp
      // bucket gets no dollar row here either (2026-09-02).
      if (!bucket || bucket.median == null || bucket.count < MIN_COMPS_TO_QUOTE) return []
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
    // Legacy pooled fallback (medianSold/avgSold) ONLY when NEITHER bucket is
    // present at all -- matches jsonLdPriceContract.pooled's own gate exactly
    // (derivePriceContract: "pooled ... ONLY used when NEITHER sealed nor
    // loose has a bucket at all"). A present-but-suppressed bucket (e.g. a
    // 2-comp sealed + 1-comp loose figure, both under the tier floor) blocks
    // the blended fallback too -- shows NO headline number rather than a
    // blended one, same as CollectionPanel/MobileActionBar already do for
    // this exact both-suppressed edge case (webaudit's Elite Legends 21
    // Hogan ticket).
    const median = headlineBucket?.median
      ?? (sealedPresent || loosePresent ? null : (price.medianSold ?? price.avgSold ?? null))
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
    const compCount = headlineBucket?.count ?? price.soldCount
    // Range-width fix (Steve, 2026-07-15 thin-bucket-range-display thread):
    // on a THIN bucket (3-9 comps -- priceCompTier's own threshold, the same
    // one already gating the "thin data" label everywhere else on this page),
    // p10-p90 over so few points is dominated by the two most extreme sales
    // (Hogan sealed n=8: p10=$65/p90=$625, a 9.6x spread on a $180 median) --
    // mathematically honest per the fence below, but reads as noise to a
    // reader. Narrowing to p25-p75 on thin buckets keeps the range inside the
    // dense middle of the sample instead of its two tails; trustworthy
    // buckets (10+) are unaffected, still p10-p90 as before. Reuses the SAME
    // sortedBucket array already computed for the fence -- no second data
    // source. Side effect, noted not hidden, CONFIRMED BY CONSTRUCTION on
    // webaudit review (2026-07-16, not just "almost always"): baseHigh here
    // IS fencedHigh()'s own q3 (`_pctile(v, 75)` over the identical positive-
    // filtered array), so the Tukey fence below can only ever narrow further
    // when it also excludes q3 itself, which fencedHigh() never does (a fence
    // below its own q3 is not constructible) -- it structurally stops biting
    // on thin buckets. rangeExtremeNote's exclusion disclosure becomes a
    // trustworthy-tier-only signal going forward, its job on thin buckets
    // now done by the narrower range itself rather than a clip + caption.
    const isThinBucket = priceCompTier(compCount) === 'thin'
    const low = isThinBucket
      ? (sortedBucket.length >= 3 ? _pctile(sortedBucket, 25) : (headlineBucket?.p10 ?? price.minSold ?? null))
      : (headlineBucket?.p10 ?? (sortedBucket.length >= 3 ? _pctile(sortedBucket, 10) : (price.minSold ?? null)))
    const baseHigh = isThinBucket
      ? (sortedBucket.length >= 3 ? _pctile(sortedBucket, 75) : (headlineBucket?.p90 ?? price.maxSold ?? null))
      : (headlineBucket?.p90 ?? (sortedBucket.length >= 3 ? _pctile(sortedBucket, 90) : (price.maxSold ?? null)))
    const fence = fencedHigh(bucketPrices)
    const fenceBites = fence != null && baseHigh != null && fence.high < baseHigh
    const high = fenceBites ? fence!.high : baseHigh
    const rangeExtremeNote = fenceBites
      ? `Range excludes ${fence!.excludedAbove.count} higher sale${fence!.excludedAbove.count === 1 ? '' : 's'} up to ${formatCurrency(fence!.excludedAbove.max)} — likely a graded lot, bundle, or wrong variant.`
      : null
    // Dispersion warning (webaudit + Steve, 2026-07-15: dead-wired signal found and
    // recalibrated). Two fixes together:
    //  1. POPULATION BUG: this used to divide the POOLED min/max (price.minSold/
    //     maxSold -- both conditions combined, e.g. Hogan's full $5.99-$625 across
    //     50 sealed+loose comps) by the HEADLINE-BUCKET median (sealed-only $180).
    //     That mixes populations -- exactly the pattern FPPS-01 eliminated from
    //     every other price surface on this page. Now uses `low`/`high`, the SAME
    //     headline-bucket-only range the range bar itself displays (both already
    //     computed above from headlineBucket.p10/p90 or the headline-filtered
    //     comps) -- the ratio is now always about the SAME range a reader is
    //     looking at, never a different, wider population.
    //  2. THRESHOLD: was >4, calibrated too loose -- Hogan's own headline-bucket
    //     ratio is 3.11 and visibly read as untrustworthy to a real user (Steve,
    //     2026-07-15), so >4 silently passed the exact case this exists to catch.
    //     Lowered to >3 per Steve's decision on WEB-TO-WEBAUDIT-THIN-BUCKET-RANGE-
    //     DISPLAY-2026-07-15.md.
    //
    // RECORDED LOUDLY (webaudit, 2026-07-16, range-width fix review) so a future
    // audit doesn't re-diagnose this as dead-wired a second time: on THIN buckets,
    // rawSpread is now high-low = p75-p25 = the bucket's own IQR by definition,
    // and an IQR exceeding 3x its own median is near-impossible for real sold-comp
    // data. This warning is therefore DORMANT BY DESIGN on thin buckets from here
    // on -- same practical outcome as the 7/15 dead-wire bug (never renders on
    // thin data) but for the opposite reason: not disconnected, just structurally
    // unreachable now that the range itself is narrow enough not to need it. Only
    // the trustworthy (10+) tier, still on p10/p90, can realistically trigger this
    // going forward.
    const rawSpread = (high ?? 0) - (low ?? 0)
    const dispersionRatio = median && median > 0 ? rawSpread / median : 0
    const dispersionWarning = dispersionRatio > 3
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
      // Range-bar suppression (Steve, 2026-07-16): p25-p75 narrowed the thin-
      // bucket range from 311% of median to 126% (this exact figure's real
      // 8 sealed comps) but that still read as untrustworthy. Rather than
      // keep re-tuning the percentile width, Steve chose to stop showing a
      // dollar range at all for thin buckets -- median + confidence + comp
      // count only (unchanged, already exist above the bar), full spread
      // still available via MarketPanel's "see the comps" list. `low`/`high`
      // above are still computed and still flow into JSON-LD (a separate,
      // webaudit-owned SEO surface, not part of this ask) -- only the VISUAL
      // bar in HeroBand is gated on this flag, nothing else.
      isThinBucket,
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
  // range [low, high], so this can't show a fence-excluded outlier above the
  // range ceiling (e.g. a graded-lot $180 over a $97 high). webaudit FIX-1
  // (2026-07-16): the [low, high] gate excluded ~20% of a thin bucket's sales
  // under the old p10-p90 band; under the new p25-p75 quartile band (range-
  // width fix) it excludes ~50% by construction, so the row often isn't
  // actually the figure's most recent sale anymore -- kept this gate (not
  // widened to the fence ceiling, webaudit's option (b)) because losing it
  // would let a legit out-of-band sale render under a much narrower bar,
  // reintroducing the exact contradiction this whole arc exists to kill.
  // Fixed the dishonesty at the LABEL instead — see "Recent sale in shown
  // range" in HeroBand.tsx, not "Most recent sale".
  //
  // 2026-07-16: the label fix above is now moot for THIN buckets specifically
  // -- Steve's range-bar suppression means there's no visible band left for
  // "in shown range" to refer to. Rather than invent a new unfiltered-recency
  // display under time pressure (a real option, but a different, unapproved
  // scope), this row is suppressed entirely on thin buckets, matching the
  // literal "just median + confidence + comp count" description Steve
  // approved -- same call as the range bar itself, not a separate decision.
  const lastSale = (() => {
    if (!price || !price.soldHistory.length || valuePricing?.isThinBucket) return null
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
  // (sellerListings resolved in the Promise.all above.)

  // ── Related figures ─────────────────────────────────────────────────────────

  // OOM stage 2 (2026-09-02, plan §6): two bounded compact reads replace the
  // whole-fandom FULL_COLS scan — a (fandom, product_line) seek for the wave
  // and a (character_canonical) seek for the versions — and ONE narrow read
  // resolves every related link (prettyFigureUrls) instead of a COUNT query
  // per card. Full wave is uncapped and includes the current figure — drives
  // an honest "you own N of M" denominator. The visible row is still capped at 12.
  // (fullWave / characterCards resolved in the Promise.all above; `genre` ===
  // local.fandom, which is what that call passes.)
  const waveFids = fullWave.map(f => f.figure_id)

  // v4 Phase 4: BAF-piece sublabel from the poured passport block — matcher's
  // wave_context is the only source; figures without a pour get no sublabel.
  const bafSubLabel = (f: KBFigure): string | null => {
    const piece = passportValue(f, 'wave_context.baf_piece')
    if (!piece) return null
    // Presentation only, value untouched otherwise: the "BAF ·" prefix
    // already says build-a-figure, so the phrase inside the value is
    // redundant on a 96px card ("Left Leg of the Build-a-Figure" → "Left Leg").
    const cleaned = piece.replace(/\s*(of the )?build.?a.?figure('s)?\s*/gi, ' ').replace(/\s{2,}/g, ' ').trim()
    return cleaned ? `BAF · ${cleaned}` : `BAF · ${piece}`
  }

  const companionFigs = fullWave.filter(f => f.figure_id !== figureId).slice(0, 12)
  const characterVariantsAll = characterCards.filter(f => f.figure_id !== figureId)
  const variantFigs = characterVariantsAll.slice(0, 12)
  const tUrls = Date.now()
  const relatedHrefs = await prettyFigureUrls([local, ...companionFigs, ...variantFigs])
  timings.urls = Date.now() - tUrls
  timings.total = Date.now() - t0
  console.log('[figure-timing]', JSON.stringify({ fid: figureId, ...timings }))
  const hrefOf = (f: KBFigure) => relatedHrefs.get(f.figure_id) ?? figureUrl(f)

  const seriesCompanions = companionFigs.map(f => ({
    figure_id: f.figure_id,
    href: hrefOf(f),
    name: f.character_canonical.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    imageUrl: thumb(f.canonical_image_url, 180),
    subLabel: bafSubLabel(f),
  }))
  // v4 Phase 4: the version rail leads with the current figure, gold-ringed
  // ("you are here") — matches the design's every-version rail. Only when
  // other versions exist: a one-card rail of just this page is noise (and
  // RelatedRow's empty-guard previously hid it entirely).
  const localPrettyUrl = hrefOf(local)
  const characterVariants = characterVariantsAll.length === 0 ? [] : [
    {
      figure_id: figureId,
      href: localPrettyUrl,
      name: deriveName(local),
      imageUrl: thumb(imageUrlFinal, 180),
      isCurrent: true,
    },
    ...variantFigs.map(f => ({
      figure_id: f.figure_id,
      href: hrefOf(f),
      name: deriveName(f),
      imageUrl: thumb(f.canonical_image_url, 180),
    })),
  ]
  const characterHubHref = `/${genreSlug}/character/${local.character_canonical}`

  // ── JSON-LD ─────────────────────────────────────────────────────────────────
  // This is a price-guide page, not a merchant product page. Keep the structured
  // data truthful by describing the figure as the page's subject and exposing
  // sold-comp stats as properties instead of marking the median as an active
  // Offer from FigurePinner.

  // ── JSON-LD additional properties ──────────────────────────────────────────
  // Retail price: per-figure `retail_price` (slim export, 2026-08-11, 25.4%
  // coverage — a "$14.99"-style display string, parsed defensively) beats the
  // line-level reference dict; the dict stays as fallback. `figureRetailPrice`
  // being non-null is what upgrades the passport badge LINE REFERENCE → KB RECORD.
  const figureRetailPrice = (() => {
    if (typeof local.retail_price !== 'string') return null
    const n = Number(local.retail_price.replace(/[^0-9.]/g, ''))
    return Number.isFinite(n) && n > 0 ? n : null
  })()
  const jsonLdRetailPrice = figureRetailPrice ?? LINE_RETAIL_PRICE[local.product_line] ?? null

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
  // (jsonLdPriceContract itself is now computed once, up near headlineBucket --
  // 2026-07-17 condition-blend fix hoisted it so the headline could reuse it too.)
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

  // AggregateOffer/InStock/seller REMOVED (figure-page-v3 scope, 2026-08-08,
  // WEB-FIGURE-PAGE-V3-SCOPE-2026-08-08.md Phase 1): this page's own comment
  // two paragraphs up already said "this is a price-guide page, not a
  // merchant product page" -- the AggregateOffer block contradicted it by
  // claiming FigurePinner as `seller` and `availability: InStock` on data
  // that is historical sold-comp stats, never a live purchasable offer.
  // additionalProperty (valueProperties above) already carries the same
  // sold-comp numbers honestly, as properties of the page's subject rather
  // than an active Offer. No replacement offers object; schema.org does not
  // require Product pages to declare offers.

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
      // Real GTIN identifier (figure-page-v3 Module 1, 2026-08-08) — UPC-A is
      // 12 digits, maps to schema.org's gtin12. Most figures don't have one
      // yet (455/22,777 KB-wide); omitted entirely when absent, never guessed.
      ...(local.upc ? { gtin12: local.upc } : {}),
    },
  }

  const hasPricing = marketPricing != null

  // AD STANDARD v2 thin-page precedence rule (2026-07-19): on no-comp figures
  // (EmptyState variant), unit 1 (after the price panel) and unit 2 (page
  // bottom) can land within ~1 viewport of each other since SeoSummary +
  // CtaRail alone don't add much height. Content-presence check, not pixel
  // math: count the two content sections that actually vary in height
  // (RelatedRow returns null when its figures array is empty) and drop unit
  // 2 when fewer than 2 are present AND there's no pricing to begin with.
  const relatedSectionCount =
    (seriesCompanions.length > 0 ? 1 : 0) + (characterVariants.length > 0 ? 1 : 0)
  const showUnitTwo = hasPricing || relatedSectionCount >= 2

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

  // WO-1 (webaudit Codex-triage, 2026-07-16): CollectionPanel was a missed
  // FPPS-01 surface -- the 5th sighting of the sibling-surface trap. It was
  // passed valuePricing.median (headline bucket, e.g. Hogan's sealed $180)
  // alongside price.soldCount (POOLED total, e.g. 50) with no condition
  // label -- exactly the "one number, wrong count, unlabeled" pattern FPPS-01
  // fixed everywhere else. Same lead-condition selection as
  // mobileActionBarPrice above (reuses the SAME jsonLdPriceContract, no
  // second derivePriceContract call), but carries THAT bucket's own count +
  // an explicit condition label + the tier's thin-data flag, since this
  // panel has room to be fully explicit (no mobile-width constraint forcing
  // mobileActionBarPrice's compromise above).
  const collectionPanelPrice: {
    median: number | null; medianIsAvg: boolean; compCount: number
    conditionLabel: 'sealed' | 'loose' | null; needsThinDataLabel: boolean
  } = (() => {
    const c = jsonLdPriceContract
    if (c.hasNoData) return { median: null, medianIsAvg: false, compCount: 0, conditionLabel: null, needsThinDataLabel: false }
    if (c.sealed?.median != null) {
      return { median: c.sealed.median, medianIsAvg: false, compCount: c.sealed.count, conditionLabel: 'sealed' as const, needsThinDataLabel: c.sealed.needsThinDataLabel }
    }
    if (c.loose?.median != null) {
      return { median: c.loose.median, medianIsAvg: false, compCount: c.loose.count, conditionLabel: 'loose' as const, needsThinDataLabel: c.loose.needsThinDataLabel }
    }
    if (c.pooled?.median != null) {
      return { median: c.pooled.median, medianIsAvg: c.pooled.isAvg, compCount: price?.soldCount ?? 0, conditionLabel: null, needsThinDataLabel: c.pooled.needsThinDataLabel }
    }
    return { median: null, medianIsAvg: false, compCount: 0, conditionLabel: null, needsThinDataLabel: false }
  })()

  // ── Decision Passport preview (figure-page-v3, 2026-08-08) — identity rows ──
  // Only real, per-figure or confirmed-source data. UNRESOLVED fields are never
  // rendered (same "don't publish what you can't source" rule as everywhere
  // else on this page) rather than shown as a fabricated/empty row.
  // Golden-corpus claims doc (null for every fid outside the corpus) — resolved
  // in the Promise.all at the top of the component.

  const dpIdentity: IdentityRow[] = [
    { label: 'Name', value: displayName, badge: 'KB RECORD', badgeColor: 'var(--dp-cyan)' },
    { label: 'Manufacturer', value: brand, badge: 'KB RECORD', badgeColor: 'var(--dp-cyan)' },
    { label: 'Product line', value: line, badge: 'KB RECORD', badgeColor: 'var(--dp-cyan)' },
    { label: 'Franchise', value: prettifySlug(genre), badge: 'KB RECORD', badgeColor: 'var(--dp-cyan)' },
    ...(seriesNum != null ? [{ label: 'Series', value: String(seriesNum), badge: 'KB RECORD', badgeColor: 'var(--dp-cyan)' }] : []),
    ...(releaseYear != null ? [{ label: 'Release year', value: String(releaseYear), badge: 'KB RECORD', badgeColor: 'var(--dp-cyan)' }] : []),
    ...(scaleClean ? [{ label: 'Scale', value: scaleClean, badge: 'KB RECORD', badgeColor: 'var(--dp-cyan)' }] : []),
    ...(exclusiveToClean ? [{ label: 'Retailer exclusive', value: exclusiveToClean, badge: 'KB RECORD', badgeColor: 'var(--dp-cyan)' }] : []),
    ...(local.pack_size > 1 ? [{ label: 'Pack size', value: `${local.pack_size}-pack`, badge: 'KB RECORD', badgeColor: 'var(--dp-cyan)' }] : []),
    ...(local.upc ? [{ label: 'UPC / GTIN', value: local.upc, badge: 'KB RECORD', badgeColor: 'var(--dp-cyan)' }] : []),
    // Retail price: per-figure KB value when the record carries one (KB RECORD),
    // else the line-level reference dict, labeled distinctly so it doesn't read
    // as more certain than it is (WEB-FIGURE-PAGE-V3-SCOPE-2026-08-08.md).
    ...(jsonLdRetailPrice != null ? [
      figureRetailPrice != null
        ? { label: 'Original retail', value: formatCurrency(figureRetailPrice), badge: 'KB RECORD', badgeColor: 'var(--dp-cyan)' }
        : { label: 'Original retail', value: formatCurrency(jsonLdRetailPrice), badge: 'LINE REFERENCE', badgeColor: 'var(--dp-gold)' },
    ] : []),
  ]

  return (
    <div className="fp-shelf" style={{ background: 'var(--fp-bg)', minHeight: '100vh', color: 'var(--fp-text)', fontFamily: 'var(--fp-font-body)' }}>
      {/* v4 Phase 6 — liquid bg (flag-gated, renders null unless
          NEXT_PUBLIC_LIQUID_BG === '1'; CWV canary gate binds, plan §6).
          Layer is fixed z-0; the sibling wrapper below lifts all page content
          to z-1 so the drift never paints over text. */}
      <LiquidBackground />
      <JsonLd data={jsonLd} />
      <FunnelEvent
        event="figure_view"
        detail={{
          figureId,
          genre,
          line: local.product_line,
        }}
      />
      {/* v4 §6 content wrapper — z-1 above the liquid layer; no visual effect
          when the flag is off (static positioning context only). */}
      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Adsterra Social Bar — REMOVED 2026-07-26 (Steve's decision: "kill social bar,
          damage risk not worth small cost"). Do NOT re-add without reading
          WEB-ANDROID-REDIRECT-ROOTCAUSE-2026-07-26.md first. Reason, in short: the unit's
          own script carries an explicit Android branch —
            if (/android/i.test(navigator.userAgent)) { e.preventDefault(); window.open(url,'_blank') }
          — which on Android Chrome is a full-screen takeover with no tab strip and no working
          Back, i.e. the "your site redirected me" report we got from a real user. The same
          script owns `blinkDocumentTitle`, the "(1) New Message!" title hijack logged 7/24.
          It ran TOP-LEVEL (no iframe), so no sandbox or CSP could ever have contained it —
          deletion was the only available fix. Its creative and settings are fetched at runtime
          from Adsterra's sbar.json, so past good behaviour was never a guarantee of future
          behaviour. Banner AdSlot units are unaffected and still monetise this page (below). */}
      <BreadcrumbJsonLd crumbs={[
        { name: 'Home', url: 'https://figurepinner.com' },
        ...(genreCrumb
          ? [{ name: genreCrumb.label, url: `https://figurepinner.com/${genreCrumb.slug}` }]
          : []),
        { name: line, url: `https://figurepinner.com/${genreSlug}/${local.product_line}` },
        { name: characterH1, url: `https://figurepinner.com${characterHubHref}` },
        { name: displayName, url: `https://figurepinner.com${localPrettyUrl}` },
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
          /* v4 Phase 3 — deliberate mobile section order (build plan §3,
             design README "Mobile deltas"): price-first hero, comps before
             prose, receipts after prose. Single flow + CSS order, never
             duplicated markup (duplicate sections = duplicate funnel events).
             Desktop keeps source order — these rules bind only here.
             Deviation from the mockup, on purpose: ad unit 1 stays after the
             comps panel instead of joining unit 2 at page bottom — adjacent
             ad units is exactly what the AD STANDARD thin-page rule forbids. */
          .fp-page-main { display: flex; flex-direction: column; }
          .fp-z-hero      { order: 1; }
          .fp-z-bidcheck  { order: 2; }
          .fp-z-comps     { order: 3; }
          .fp-z-seller    { order: 4; }
          .fp-z-ad1       { order: 5; }
          .fp-z-lore      { order: 6; }
          .fp-z-enrich    { order: 7; }
          .fp-z-passport  { order: 8; }
          .fp-z-seo       { order: 9; }
          .fp-z-versions  { order: 10; }
          .fp-z-wave      { order: 11; }
          .fp-z-hubs      { order: 12; }
          .fp-z-ad2       { order: 13; }
          /* Hero-internal reorder: identity column (chips/H1/price/CTAs)
             above the photo vitrine + At a Glance. */
          .fp-hero-grid { display: flex !important; flex-direction: column; }
          .fp-hero-photo-col { order: 2; }
          .fp-hero-id-col    { order: 1; }
        }
      `}</style>

      <SiteHeader crumbs={[
        ...(genreCrumb ? [{ label: genreCrumb.label, href: `/${genreCrumb.slug}` }] : []),
        { label: line, href: `/${genreSlug}/${local.product_line}` },
        { label: characterH1, href: characterHubHref },
        { label: displayName },
      ]} />

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="fp-page-main" style={{ maxWidth: '1040px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

        {/* Zone 1 — Hero: image + identity + price strip (inline at wide viewports) */}
        <div className="fp-z-hero" style={{ marginBottom: '1.75rem' }}>
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
            loreText={gatedLoreText(local)}
            underPhoto={goldenCorpusDoc ? <GoldenCorpusAtAGlance doc={goldenCorpusDoc} /> : null}
            ticks={placardTicks}
            lastSale={lastSale}
            conditionLabel={placardConditionLabel}
            conditionRows={placardConditionRows}
            secondary={placardSecondary}
            inferenceNote={inferenceNote}
            buckets={quotable}
            history={priceHistory}
            hasReceipts={!!goldenCorpusDoc || !!local.passport}
            ebaySearchUrl={ebayUrl}
          />
        </div>

        {/* Zone 2b — Bid Check verdict widget (S16, north star). Renders only
            when sold comps exist; zero-comp figures keep the EmptyState flow. */}
        {marketPricing && marketPricing.recent_comps.length > 0 && (
          <div className="fp-z-bidcheck" style={{ marginBottom: '1.5rem' }}>
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

        {/* Zone 2c — Decision Passport preview (figure-page-v3, 2026-08-08).
            Visual redesign shell: real identity + market-evidence data now,
            honest "coming soon" states for Complete Check / wave-BAF map /
            comparison until matcher's per-figure data exists. Steve's call
            2026-08-08: ship the shape now, populate with matcher iteratively. */}
        <div className="fp-z-passport">
        <DecisionPassportPreview
          identity={dpIdentity}
          sealed={price?.sealed ?? null}
          loose={price?.loose ?? null}
        >
          {/* Golden-corpus evidence-locked passport (Hela, 2026-08-13 — first
              candidate to pass web's full acceptance gate). Doc presence is
              the render gate; reads matcher's claims doc directly, NOT a KB
              pour. Scale figures (poured passport block, 8/13 tiering ruling)
              fall through to ScalePassport — CORE rows + honest gaps. */}
          {goldenCorpusDoc
            ? <GoldenCorpusPassport doc={goldenCorpusDoc} />
            : local.passport && <ScalePassport fig={local} fullWave={fullWave} />}
        </DecisionPassportPreview>
        </div>

        {/* Zone 3 — Lore band */}
        <div className="fp-z-lore" style={{ marginBottom: '1.5rem' }}>
          <LoreBand loreInput={loreInput} />
        </div>

        {/* Zone 3b — Per-figure enrichment (match represented + key features).
            Render-safe: shows only for fids matcher has enriched. */}
        <div className="fp-z-enrich" style={{ marginBottom: '1.5rem' }}>
          {/* match_represented renders in the hero lore slot now — features only here */}
          <FigureEnrichment
            matchRepresented={null}
            keyFeatures={gatedKeyFeatures(local)}
          />
        </div>


        {/* Seller listing */}
        {sellerListings.length > 0 && (
          <div className="fp-z-seller">
            <SellerCard listings={sellerListings} />
          </div>
        )}

        {/* Zones 4 + 5 — Market panel + collection panel */}
        <div
          className="fp-main-grid fp-z-comps"
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
                mixedConditions={sealedPresent && loosePresent}
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
              median={collectionPanelPrice.median}
              medianIsAvg={collectionPanelPrice.medianIsAvg}
              compCount={collectionPanelPrice.compCount}
              conditionLabel={collectionPanelPrice.conditionLabel}
              needsThinDataLabel={collectionPanelPrice.needsThinDataLabel}
              scale={scaleClean}
              series={seriesNum}
              packSize={Number(local.pack_size) || 1}
              exclusiveTo={exclusiveToClean}
              imgSrc={thumb(imageUrlFinal, 760)}
              whisper={jsonLdEnriched}
              upc={local.upc}
            />
          </div>
        </div>

        {/* Ad — Adsterra Banner (468×60), below the price/comps panel
            (ad-revenue plan S4: unit 1 of 2 on figure pages) */}
        <div className="fp-z-ad1" style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }}>
          <AdSlot slot="adsterra-banner" />
        </div>

        {/* SEO Summary — natural language paragraph + retail vs market + velocity */}
        <div className="fp-z-seo">
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
        </div>

        {/* Zone 6 — Series companions */}
        <div className="fp-z-wave">
        <RelatedRow
          label={`Complete the Wave — ${line}${seriesNum ? ` Series ${seriesNum}` : ''}`}
          figures={seriesCompanions}
          ownershipFids={waveFids}
        />
        </div>

        {/* Zone 7 — Character thread */}
        <div className="fp-z-versions">
        <RelatedRow
          label={`Every Version of ${characterH1}`}
          figures={characterVariants}
          accentColor="var(--fp-accent-warm)"
          headerLink={{
            href: characterHubHref,
            label: `See all ${characterVariantsAll.length + 1} ${characterH1} figures →`,
          }}
        />
        </div>

        {/* Zone 8 — CTA rail */}
        <div className="fp-z-hubs">
          <CtaRail genre={genre} brand={brand} line={line} lineSlug={local.product_line} />
        </div>

        {/* Ad — Adsterra Banner (468×60), page bottom after related figures
            (ad-revenue plan S4: unit 2 of 2 — native slot converts to banner,
            format swap not removal; no native widgets sitewide per plan S3.2).
            AD STANDARD v2 thin-page rule: skipped on thin no-comp pages where
            it would land within ~1 viewport of unit 1 — see showUnitTwo above. */}
        {showUnitTwo && (
          <div className="fp-z-ad2" style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0 0.5rem' }}>
            <AdSlot slot="adsterra-banner" />
          </div>
        )}
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
    </div>
  )
}

// ── Micro components ───────────────────────────────────────────────────────────
