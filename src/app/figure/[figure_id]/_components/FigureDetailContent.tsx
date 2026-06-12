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

const API_BASE = 'https://figurepinner-api.bubs960.workers.dev'
// Fallback campid is the live EPN campaign — restored after bceb185 silently
// reverted it to ''. Without it, a build missing .env.production ships campid= blank
// (working-looking eBay links that pay $0). Do NOT remove. See Genta audit 2026-06-06 P1.
const EBAY_CAMPAIGN_ID = process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID ?? '5339147406'

// ── API types ──────────────────────────────────────────────────────────────────

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
  }>
}

// ── Data fetching ──────────────────────────────────────────────────────────────

const R2_PROXY_BASE = 'https://figurepinner-r2proxy.bubs960.workers.dev'

type R2Snapshot = {
  figure_id: string; avg_sold: number | null; median_sold: number | null
  min_sold: number | null; max_sold: number | null; sold_count: number
  avg_fs: number | null; fs_count: number; min_fs: number | null
  recent: Array<{ price: number; title: string; condition: string; sold_date: string; listing_format: string }>
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
    },
    imageUrl: null,
  }
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

  const valuePricing = (() => {
    if (!price || price.soldCount === 0) return null
    const median = price.medianSold ?? price.avgSold ?? null
    // P10–P90 range: much less sensitive to outliers than raw min/max.
    // Requires soldHistory to have prices; falls back to raw min/max if not enough data.
    const sortedPrices = [...price.soldHistory.map(s => s.price)].sort((a, b) => a - b)
    const low  = sortedPrices.length >= 3 ? _pctile(sortedPrices, 10) : (price.minSold ?? null)
    const high = sortedPrices.length >= 3 ? _pctile(sortedPrices, 90) : (price.maxSold ?? null)
    // Dispersion warning: when the raw spread is >4x the median, comp set likely
    // contains contaminated listings (wrong series, graded lots, wrong figure).
    // Cap displayed confidence at 4 and surface a caveat label.
    const rawSpread = (price.maxSold ?? 0) - (price.minSold ?? 0)
    const dispersionRatio = median && median > 0 ? rawSpread / median : 0
    const dispersionWarning = dispersionRatio > 4
    const baseConfidence = compCountToConfidence(price.soldCount)
    const confidence: 1 | 2 | 3 | 4 | 5 = (dispersionWarning && baseConfidence > 4)
      ? 4
      : baseConfidence
    return {
      median,
      trend_90d_pct: computeTrend(price.soldHistory),
      low,
      high,
      confidence,
      comp_count:         price.soldCount,
      dispersion_warning: dispersionWarning,
    }
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
    <div style={{ background: 'var(--fp-bg)', minHeight: '100vh', color: 'var(--fp-text)', fontFamily: 'var(--fp-font-body)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          .fp-hero-grid  { grid-template-columns: 1fr !important; }
          .fp-main-grid  { grid-template-columns: 1fr !important; }
          .fp-cta-rail   { grid-template-columns: 1fr !important; }
          .fp-right-col  { position: static !important; }
        }
        /* Value strip responsive rules.
           At 769–900px viewport the hero is still 2-col but the identity
           column is only ~400–470px wide — too narrow for 4 equal cells
           without clipping the CONFIDENCE label. Wrap to 2×2 at 900px.
           At ≤640px the hero has already collapsed to 1-col so the strip
           is full-width; 2×2 still applies for comfortable reading. */
        @media (max-width: 900px) {
          .fp-value-strip { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,13,28,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--fp-border)',
        padding: '0 1.5rem', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--fp-dim)', overflow: 'hidden' }}>
          <a href="/" style={{
            fontFamily: 'var(--fp-font-display)', fontSize: '1.1rem',
            color: 'var(--fp-text)', textDecoration: 'none', letterSpacing: '0.06em', flexShrink: 0,
          }}>FP</a>
          <Chevron />
          <a href={`/${genre}`} style={{ color: 'var(--fp-muted)', textDecoration: 'none', flexShrink: 0 }}>
            {prettifySlug(genre)}
          </a>
          <Chevron />
          <a href={`/${genre}/${local.product_line}`} style={{ color: 'var(--fp-muted)', textDecoration: 'none', flexShrink: 0 }}>
            {line}
          </a>
          <Chevron />
          <span style={{ color: 'var(--fp-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </span>
        </div>
      </nav>

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
            valueStripClassName="fp-value-strip"
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
          <FigureEnrichment
            matchRepresented={local.match_represented}
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
              <a
                href="/methodology"
                style={{
                  display: 'inline-block', marginTop: '0.5rem',
                  fontSize: '0.75rem', color: 'var(--fp-muted)',
                  textDecoration: 'underline', textUnderlineOffset: '2px',
                }}
              >
                How is this calculated?
              </a>
            </div>

            {hasPricing ? (
              <MarketPanel
                pricing={marketPricing}
                ebaySearchUrl={ebayUrl}
                figureName={displayName}
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
          label={`Others In ${line}${seriesNum ? ` Series ${seriesNum}` : ''}`}
          figures={seriesCompanions}
        />

        {/* Zone 7 — Character thread */}
        <RelatedRow
          label={`More ${characterH1} Figures`}
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

function Chevron() {
  return <span style={{ color: 'var(--fp-border)', margin: '0 0.1rem', flexShrink: 0 }}>›</span>
}

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
