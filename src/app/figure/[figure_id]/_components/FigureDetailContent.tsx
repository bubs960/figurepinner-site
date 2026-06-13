/**
 * FigureDetailContent — shared async server component
 * Renders the full figure detail page for a given figureId.
 * Used by both /figure/[figure_id] and /[genre]/[line]/[slug] routes
 * so both get the same content; canonical URL is controlled by generateMetadata.
 */

import { getFigureById, getFiguresByFandom, deriveName, figureUrl } from '@/data/kb'
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
import { buildEbaySearchUrl, formatCurrency, computeTrend, compCountToConfidence, prettifySlug, dataQualityState } from '../_lib/figureFormatters'
import DataQualityBadge from './DataQualityBadge'
import type { LoreInput } from '../_lib/loreRenderer'
import { getLineAttributes } from '../_lib/line-attributes-data'
import { getCharacterNotes } from '../_lib/character-notes-data'
import { getSellerListings } from '@/data/bubs-inventory'
import { thumb } from '@/lib/imageUrl'
import SiteHeader from '@/app/components/SiteHeader'

const API_BASE = 'https://figurepinner-api.bubs960.workers.dev'
// Fallback campid is the live EPN campaign — restored after bceb185 silently
// reverted it to ''. Without it, a build missing .env.production ships campid= blank
// (working-looking eBay links that pay $0). Do NOT remove. See Genta audit 2026-06-06 P1.
// `||` (not `??`) on purpose: an env var set to "" must also fall back — `??`
// would keep the empty string and ship a blank campid. (Affiliate-leak audit 2026-06-13.)
const EBAY_CAMPAIGN_ID = process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID || '5339147406'

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

function latestSoldDate(soldHistory: PriceData['soldHistory']): { iso: string; label: string } | null {
  const dates = soldHistory
    .map(comp => new Date(comp.sold_date))
    .filter(date => !Number.isNaN(date.getTime()))

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
  const res = await fetch(
    `${R2_PROXY_BASE}/price-summaries/${encodeURIComponent(figure_id)}.json`,
    { next: { revalidate: 3600 }, signal: AbortSignal.timeout(4000) }
  ).catch(() => null)
  if (!res?.ok) return { price: null, imageUrl: null }
  const snap = await res.json() as R2Snapshot
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

// ── Main component ─────────────────────────────────────────────────────────────

export default async function FigureDetailContent({ figureId }: { figureId: string }) {
  const local = getFigureById(figureId)
  if (!local) return <NotFoundState />

  const { price, imageUrl } = await fetchFigurePageData(figureId)
  const latestCompDate = price ? latestSoldDate(price.soldHistory) : null

  // ── Derived display values ──────────────────────────────────────────────────

  const displayName  = deriveName(local)
  const characterH1  = prettifySlug(local.character_canonical)
  const brand        = prettifySlug(local.manufacturer)
  const line         = prettifySlug(local.product_line)
  const genre        = local.fandom
  const localAny     = local as Record<string, unknown>
  const releaseYear  = typeof localAny.release_year === 'number' ? localAny.release_year : null
  const seriesNum    = (() => { const n = parseInt(local.release_wave ?? ''); return isNaN(n) ? null : n })()
  const imageUrlFinal = imageUrl ?? local.canonical_image_url ?? null

  // ── eBay URL ────────────────────────────────────────────────────────────────

  const ebayUrl = buildEbaySearchUrl(characterH1, prettifySlug(genre), brand, line, local.release_wave, EBAY_CAMPAIGN_ID)

  // ── Pro gate ────────────────────────────────────────────────────────────────

  // ── ValueStrip props ────────────────────────────────────────────────────────

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
  const inferenceNote = (() => {
    const inf = price?.conditionInference
    if (!inf) return null
    const n = (inf.sealed_from_title ?? 0) + (inf.loose_from_title ?? 0)
    return n > 0 ? `Includes ${n} comp${n === 1 ? '' : 's'} classified from the listing title.` : null
  })()

  const valuePricing = (() => {
    if (!price || price.soldCount === 0) return null
    const median = headlineBucket?.median ?? price.medianSold ?? price.avgSold ?? null
    // P10–P90 range: the headline bucket carries its own percentiles (full
    // corpus); the blended path keeps the soldHistory-derived range.
    // Requires soldHistory to have prices; falls back to raw min/max if not enough data.
    const sortedPrices = [...price.soldHistory.map(s => s.price)].sort((a, b) => a - b)
    const low = headlineBucket?.p10
      ?? (sortedPrices.length >= 3 ? _pctile(sortedPrices, 10) : (price.minSold ?? null))
    const high = headlineBucket?.p90
      ?? (sortedPrices.length >= 3 ? _pctile(sortedPrices, 90) : (price.maxSold ?? null))
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
      trend_90d_pct: computeTrend(price.soldHistory),
      low,
      high,
      confidence,
      comp_count:         compCount,
      dispersion_warning: dispersionWarning,
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
  // Most recent individual sale — picked by max sold_date (same trust level
  // as the existing 'Latest sold comp' line; order of recent[] is not trusted).
  const lastSale = (() => {
    if (!price || !price.soldHistory.length) return null
    let best: { price: number; sold_date?: string } | null = null
    for (const s of price.soldHistory) {
      if (!s.sold_date) continue
      if (!best || String(s.sold_date) > String(best.sold_date)) best = s
    }
    return best ? { price: best.price } : null
  })()

  // ── MarketPanel props ───────────────────────────────────────────────────────

  const marketPricing = price && price.soldCount > 0 ? {
    median:       price.medianSold ?? price.avgSold ?? null,
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

  const seriesCompanions = allInGenre
    .filter(f =>
      f.figure_id !== figureId &&
      f.product_line === local.product_line &&
      f.release_wave === local.release_wave
    )
    .slice(0, 12)
    .map(f => ({
      figure_id: f.figure_id,
      href: figureUrl(f),
      name: f.character_canonical.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      imageUrl: thumb(f.canonical_image_url, 180),
    }))

  const characterVariants = allInGenre
    .filter(f =>
      f.figure_id !== figureId &&
      f.character_canonical === local.character_canonical
    )
    .slice(0, 12)
    .map(f => ({
      figure_id: f.figure_id,
      href: figureUrl(f),
      name: deriveName(f),
      imageUrl: thumb(f.canonical_image_url, 180),
    }))

  // ── JSON-LD ─────────────────────────────────────────────────────────────────
  // This is a price-guide page, not a merchant product page. Keep the structured
  // data truthful by describing the figure as the page's subject and exposing
  // sold-comp stats as properties instead of marking the median as an active
  // Offer from FigurePinner.

  const valueProperties = [
    valuePricing?.median != null
      ? { '@type': 'PropertyValue', name: 'Median sold price', value: formatCurrency(valuePricing.median) }
      : null,
    price?.soldCount != null
      ? { '@type': 'PropertyValue', name: 'Sold comp count', value: String(price.soldCount) }
      : null,
    valuePricing?.low != null && valuePricing?.high != null
      ? { '@type': 'PropertyValue', name: 'Recent sold range', value: `${formatCurrency(valuePricing.low)} to ${formatCurrency(valuePricing.high)}` }
      : null,
    local.release_wave
      ? { '@type': 'PropertyValue', name: 'Series', value: local.release_wave }
      : null,
    local.scale
      ? { '@type': 'PropertyValue', name: 'Scale', value: local.scale }
      : null,
  ].filter(Boolean)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${displayName} Price Guide`,
    description: `${displayName} action figure price guide by ${brand}. ${line}${seriesNum ? ` Series ${seriesNum}` : ''}.`,
    mainEntity: {
      '@type': 'Product',
      name:        displayName,
      description: `${displayName} action figure by ${brand}. ${line}${seriesNum ? ` Series ${seriesNum}` : ''}.`,
      brand:       { '@type': 'Brand', name: brand },
      image:       imageUrlFinal ?? undefined,
      category:    prettifySlug(genre),
      additionalProperty: valueProperties.length ? valueProperties : undefined,
    },
  }

  const hasPricing = marketPricing != null

  return (
    <div className="fp-shelf" style={{ background: 'var(--fp-bg)', minHeight: '100vh', color: 'var(--fp-text)', fontFamily: 'var(--fp-font-body)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Shelf design tokens (scoped) + responsive overrides */}
      <style>{`
        .fp-shelf {
          --shelf-cream:     #f2e8d5;
          --shelf-cream-dim: rgba(242,232,213,0.60);
          --shelf-cream-mut: rgba(242,232,213,0.38);
          --shelf-gold:      #e0a83e;
          --shelf-gold-hi:   #f5c462;
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
        { label: prettifySlug(genre), href: `/${genre}` },
        { label: line, href: `/${genre}/${local.product_line}` },
        { label: displayName },
      ]} />

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

        {/* Zone 1 — Hero: image + identity + price strip (inline at wide viewports) */}
        <div style={{ marginBottom: '1.75rem' }}>
          <HeroBand
            className="fp-hero-grid"
            imageUrl={thumb(imageUrlFinal, 760)}
            characterName={characterH1}
            brand={brand}
            lineName={lineAttrs?.display_name ?? line}
            series={seriesNum}
            scale={local.scale ?? null}
            eraLabel={lineAttrs?.era_label ?? null}
            releaseYear={releaseYear}
            rarityTier={null}
            genre={genre}
            valuePricing={valuePricing}
            loreText={local.match_represented ?? null}
            ticks={placardTicks}
            lastSale={lastSale}
            conditionLabel={placardConditionLabel}
            secondary={placardSecondary}
            inferenceNote={inferenceNote}
          />
        </div>

        {/* Zone 2b — Bid Check verdict widget (S16, north star). Renders only
            when sold comps exist; zero-comp figures keep the EmptyState flow. */}
        {marketPricing && marketPricing.recent_comps.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <BidCheck comps={marketPricing.recent_comps.map(c => ({ price: c.price, condition: c.condition }))} />
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

        {/* Ad slot */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <AdSlot slot="rectangle" />
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
                buckets={segmentation !== 'pooled' ? {
                  segmentation,
                  sealed: price?.sealed ?? null,
                  loose: price?.loose ?? null,
                } : null}
              />
            ) : (
              <EmptyState figureName={displayName} ebaySearchUrl={ebayUrl} />
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
              compCount={price?.soldCount ?? 0}
              scale={local.scale ?? null}
              series={seriesNum}
              packSize={Number(local.pack_size) || 1}
              exclusiveTo={local.exclusive_to ?? null}
            />
          </div>
        </div>

        {/* Zone 6 — Series companions */}
        <RelatedRow
          label={`Complete the Wave — ${line}${seriesNum ? ` Series ${seriesNum}` : ''}`}
          figures={seriesCompanions}
        />

        {/* Zone 7 — Character thread */}
        <RelatedRow
          label={`Every Version of ${characterH1}`}
          figures={characterVariants}
          accentColor="var(--fp-accent-warm)"
        />

        {/* Zone 8 — CTA rail */}
        <CtaRail genre={genre} brand={brand} line={line} lineSlug={local.product_line} />
      </main>

      {/* Sticky mobile action bar — phones only, feature-flag gated.
          eBay href = the same campid-guarded ebayUrl used everywhere else. */}
      <MobileActionBar
        ebaySearchUrl={ebayUrl}
        figureName={displayName}
        priceLabel={valuePricing?.median != null ? formatCurrency(valuePricing.median) : null}
      />

      {/* Footer is rendered globally by the root layout (src/app/layout.tsx). */}
    </div>
  )
}

// ── Micro components ───────────────────────────────────────────────────────────


function NotFoundState() {
  return (
    <main style={{
      background: 'var(--fp-bg)', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--fp-text)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--fp-font-display)', fontSize: '3rem', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>
          404
        </div>
        <p style={{ color: 'var(--fp-muted)', marginBottom: '1.5rem' }}>Figure not found.</p>
        <a href="/" style={{ color: 'var(--fp-accent)', textDecoration: 'none', fontWeight: '600' }}>← Back to search</a>
      </div>
    </main>
  )
}
