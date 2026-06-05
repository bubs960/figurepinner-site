/**
 * FigureDetailContent — shared async server component
 * Renders the full figure detail page for a given figureId.
 * Used by both /figure/[figure_id] and /[genre]/[line]/[slug] routes
 * so both get the same content; canonical URL is controlled by generateMetadata.
 */

import { getFigureById, getFiguresByFandom, deriveName, figureUrl, canonicalFigureUrl, SERVED_GENRE_SLUGS } from '@/data/kb'
import NavLogo from '@/app/_components/NavLogo'
import BreadcrumbJsonLd from '@/app/_components/BreadcrumbJsonLd'
import ProBadge from './ProBadge'
import AdSlot from '@/app/components/AdSlot'
import HeroBand from './HeroBand'
import ValueStrip from './ValueStrip'
import LoreBand from './LoreBand'
import MarketPanel from './MarketPanel'
import CollectionPanel from './CollectionPanel'
import CtaRail from './CtaRail'
import EmptyState from './EmptyState'
import RelatedRow from './RelatedRow'
import SellerCard from './SellerCard'
import MobileActionBar from './MobileActionBar'
import { buildEbaySearchUrl, computeTrend, compCountToConfidence, prettifySlug, dataQualityState } from '../_lib/figureFormatters'
import DataQualityBadge from './DataQualityBadge'
import type { LoreInput } from '../_lib/loreRenderer'
import { getLineAttributes } from '../_lib/line-attributes-data'
import { getCharacterNotes } from '../_lib/character-notes-data'
import { seoImageUrl, composeImageSlug } from '../_lib/imageTransform'
import { getSellerListings } from '@/data/bubs-inventory'

const R2_PROXY_BASE = 'https://figurepinner-r2proxy.bubs960.workers.dev'
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

// ── IQR helpers ────────────────────────────────────────────────────────────────

function _percentileFromSorted(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0]
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function _iqrFromPrices(prices: number[]): { p25: number; p75: number } | null {
  const valid = prices.filter(p => p > 0)
  if (valid.length < 4) return null
  const sorted = [...valid].sort((a, b) => a - b)
  return {
    p25: _percentileFromSorted(sorted, 25),
    p75: _percentileFromSorted(sorted, 75),
  }
}

// ── Data fetching ──────────────────────────────────────────────────────────────

// R2 snapshot shape (snake_case from aggregation-cron)
type R2Snapshot = {
  figure_id: string
  avg_sold: number | null
  median_sold: number | null
  min_sold: number | null
  max_sold: number | null
  sold_count: number
  avg_fs: number | null
  fs_count: number
  min_fs: number | null
  recent: Array<{ price: number; title: string; condition: string; sold_date: string; listing_format: string }>
}

export async function fetchFigurePageData(figure_id: string, _v1?: string): Promise<{ price: PriceData | null; imageUrl: string | null }> {
  // Phase 2a (2026-05-11): /api/v1/figure-price retired (410). Pricing now
  // served from R2 snapshots written hourly by the aggregation cron.
  // /api/v1/figure/:fid also retired (410) — imageUrl falls back to
  // local KB canonical_image_url in the caller (FigureDetailContent line ~94).
  const res = await fetch(
    `${R2_PROXY_BASE}/price-summaries/${encodeURIComponent(figure_id)}.json`,
    { next: { revalidate: 3600 }, signal: AbortSignal.timeout(4000) }
  ).catch(() => null)

  if (!res?.ok) return { price: null, imageUrl: null }

  const snap = await res.json() as R2Snapshot
  const recentPrices = (snap.recent ?? []).map((s: { price: number }) => s.price)
  const iqr = _iqrFromPrices(recentPrices)

  const price: PriceData = {
    figureId:    figure_id,
    avgSold:     snap.avg_sold,
    medianSold:  snap.median_sold,
    minSold:     snap.min_sold,
    maxSold:     snap.max_sold,
    p25Sold:     iqr?.p25 ?? null,
    p75Sold:     iqr?.p75 ?? null,
    soldCount:   snap.sold_count,
    avgFS:       snap.avg_fs,
    fsCount:     snap.fs_count,
    minFS:       snap.min_fs,
    soldHistory: snap.recent ?? [],
  }

  return { price, imageUrl: null }
}

// ── Main component ─────────────────────────────────────────────────────────────

export default async function FigureDetailContent({ figureId }: { figureId: string }) {
  const local = getFigureById(figureId)
  if (!local) return <NotFoundState />

  const { price, imageUrl } = await fetchFigurePageData(figureId)

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

  const ebayUrl = buildEbaySearchUrl(brand, line, local.release_wave, displayName, EBAY_CAMPAIGN_ID)

  // ── ValueStrip props ────────────────────────────────────────────────────────

  const valuePricing = price && price.soldCount > 0 ? {
    median:        price.medianSold ?? price.avgSold ?? null,
    trend_90d_pct: computeTrend(price.soldHistory),
    low:           price.minSold ?? null,
    high:          price.maxSold ?? null,
    p25:           price.p25Sold ?? null,
    p75:           price.p75Sold ?? null,
    confidence:    compCountToConfidence(price.soldCount),
    comp_count:    price.soldCount,
  } : null

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
      imageUrl: f.canonical_image_url ?? null,
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
      imageUrl: f.canonical_image_url ?? null,
    }))

  // ── JSON-LD ─────────────────────────────────────────────────────────────────

  // SEO-friendly image URL for structured data. Google uses the URL path
  // as a ranking signal in Image Search, so /api/img/cm-punk-elite-series-124
  // outperforms /api/img?u=encoded-hash.
  const imageSlug = composeImageSlug({ character: local.character_canonical, line: local.product_line, series: seriesNum, brand })
  const seoImage = imageUrlFinal ? seoImageUrl(imageUrlFinal, imageSlug) : undefined

  // priceValidUntil: 30 days from render — eBay comps refresh hourly, 30d is conservative
  const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name:        displayName,
    description: `${displayName} action figure by ${brand}. ${line}${seriesNum ? ` Series ${seriesNum}` : ''}.`,
    brand:       { '@type': 'Brand', name: brand },
    image:       seoImage,
    category:    prettifySlug(genre),
    offers: valuePricing?.median != null ? {
      '@type':         'Offer',
      price:           valuePricing.median.toFixed(2),
      priceCurrency:   'USD',
      itemCondition:   'https://schema.org/UsedCondition',
      availability:    'https://schema.org/InStock',
      priceValidUntil: priceValidUntil,
      url:             ebayUrl,
      seller:          { '@type': 'Organization', name: 'eBay' },
      description:     `Based on ${price!.soldCount} recent eBay sold listings`,
    } : undefined,
  }

  // P1: BreadcrumbList — 4-level for served genres, 2-level otherwise
  const isServedGenre = SERVED_GENRE_SLUGS.includes(genre ?? '')
  const canonicalUrl  = canonicalFigureUrl(local)
  const breadcrumbs = isServedGenre ? [
    { name: 'Home',               url: 'https://figurepinner.com/' },
    { name: prettifySlug(genre),  url: `https://figurepinner.com/${genre}` },
    { name: line,                 url: `https://figurepinner.com/${genre}/${local.product_line}` },
    { name: displayName,          url: `https://figurepinner.com${canonicalUrl}` },
  ] : [
    { name: 'Home',         url: 'https://figurepinner.com/' },
    { name: displayName,    url: `https://figurepinner.com/figure/${local.figure_id}` },
  ]

  const hasPricing = marketPricing != null

  return (
    <div style={{ background: 'var(--fp-bg)', minHeight: '100vh', color: 'var(--fp-text)', fontFamily: 'var(--fp-font-body)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BreadcrumbJsonLd crumbs={breadcrumbs} />

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          .fp-hero-grid  { grid-template-columns: 1fr !important; }
          .fp-main-grid  { grid-template-columns: 1fr !important; }
          .fp-cta-rail   { grid-template-columns: 1fr !important; }
          .fp-right-col  { position: static !important; }
        }
        @media (max-width: 540px) {
          .fp-value-strip { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--nav-bg-translucent)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--fp-border)',
        padding: '0 1.5rem', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--fp-dim)', overflow: 'hidden' }}>
          <NavLogo size="sm" />
          <Chevron />
          <a href={`/${genre}`} style={{ color: 'var(--fp-muted)', textDecoration: 'none', flexShrink: 0 }}>
            {prettifySlug(genre)}
          </a>
          <Chevron />
          <span style={{ color: 'var(--fp-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </span>
        </div>
        <ProBadge />
      </nav>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

        {/* Zone 1 — Hero: image + identity */}
        <div style={{ marginBottom: '1.75rem' }}>
          <HeroBand
            className="fp-hero-grid"
            imageUrl={imageUrlFinal}
            characterName={characterH1}
            brand={brand}
            lineName={lineAttrs?.display_name ?? line}
            series={seriesNum}
            scale={local.scale ?? null}
            eraLabel={lineAttrs?.era_label ?? null}
            releaseYear={releaseYear}
            rarityTier={null}
            genre={genre}
          />
        </div>

        {/* Zone 2 — Value strip */}
        {valuePricing && (
          <div style={{ marginBottom: '1.5rem' }}>
            <ValueStrip className="fp-value-strip" pricing={valuePricing} />
          </div>
        )}

        {/* Zone 3 — Lore band */}
        <div style={{ marginBottom: '1.5rem' }}>
          <LoreBand loreInput={loreInput} />
        </div>

        {/* Ad slot — wrapperStyle passed so outer margin also collapses when unfilled */}
        <AdSlot slot="rectangle" wrapperStyle={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }} />

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
            </div>

            {hasPricing ? (
              <MarketPanel
                pricing={marketPricing}
                isPro={false}
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
              isPro={false}
            />
          </div>
        </div>

        {/* Zone 5b — About This Figure (indexed content, dwell-time driver) */}
        <AboutSection
          name={displayName}
          brand={brand}
          line={line}
          seriesNum={seriesNum}
          releaseYear={releaseYear}
          scale={local.scale}
          packSize={Number(local.pack_size) || 1}
          exclusiveTo={local.exclusive_to}
          characterNotes={getCharacterNotes(local.character_canonical)?.notes ?? null}
          median={valuePricing?.median ?? null}
          soldCount={price?.soldCount ?? 0}
          genre={genre}
        />

        {/* Zone 6 — Series companions */}
        <RelatedRow
          label={`Others In ${line}${seriesNum ? ` Series ${seriesNum}` : ''}`}
          figures={seriesCompanions}
        />

        {/* Zone 7 — Character thread */}
        <RelatedRow
          label={`More ${characterH1} Figures`}
          figures={characterVariants}
          accentColor="var(--hunting)"
        />

        {/* Zone 8 — CTA rail */}
        <CtaRail genre={genre} brand={brand} line={line} />

        {/* Sell nudge — not affiliate, just UX */}
        <div style={{ textAlign: 'center', padding: '1rem 0 0' }}>
          <a
            href="https://www.ebay.com/sell"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.75rem', color: 'var(--fp-dim)', textDecoration: 'none' }}
          >
            Have one of these? Sell it on eBay →
          </a>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--fp-border)', padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--fp-dim)', margin: 0 }}>
          © {new Date().getFullYear()} FigurePinner ·{' '}
          <a href={`/${genre}`} style={{ color: 'var(--fp-dim)', textDecoration: 'none' }}>
            More {prettifySlug(genre)} figures
          </a>{' '}·{' '}
          <a href="/about"   style={{ color: 'var(--fp-dim)', textDecoration: 'none' }}>About</a>{' '}·{' '}
          <a href="/privacy" style={{ color: 'var(--fp-dim)', textDecoration: 'none' }}>Privacy</a>
        </p>
      </footer>

      {/* ── Mobile sticky action bar ────────────────────────────────────────── */}
      <MobileActionBar
        trackHref="/sign-up"
        ebaySearchUrl={ebayUrl}
        figureName={displayName}
        isSignedIn={false}
      />
    </div>
  )
}

// ── Micro components ───────────────────────────────────────────────────────────

function AboutSection({
  name, brand, line, seriesNum, releaseYear, scale, packSize,
  exclusiveTo, characterNotes, median, soldCount, genre,
}: {
  name: string; brand: string; line: string; seriesNum: number | null
  releaseYear: number | null; scale: string | null; packSize: number
  exclusiveTo: string | null; characterNotes: string | null
  median: number | null; soldCount: number; genre: string
}) {
  const cleanScale  = scale && scale !== 'None' ? scale : null
  const cleanExcl   = exclusiveTo && exclusiveTo !== 'None' && exclusiveTo !== '' ? exclusiveTo : null
  const multiPack   = packSize > 1

  const intro = [
    `${name} is an action figure by ${brand}`,
    cleanScale ? ` in the ${cleanScale} scale` : '',
    `, part of the ${line} line`,
    seriesNum  ? ` (Series ${seriesNum})` : '',
    releaseYear ? `, first released in ${releaseYear}` : '',
    '.',
  ].join('')

  return (
    <details style={{
      margin: '1.5rem 0',
      border: '1px solid var(--fp-border)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <summary style={{
        padding: '0.875rem 1.25rem',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: '0.85rem',
        background: 'var(--fp-surface-0)',
        userSelect: 'none',
        listStyle: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        About This Figure
        <span style={{ fontSize: '0.75rem', color: 'var(--fp-dim)', fontWeight: 400 }}>▼</span>
      </summary>

      <div style={{ padding: '1rem 1.25rem 1.25rem', fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--fp-text)', background: 'var(--fp-bg)' }}>
        <p style={{ margin: '0 0 0.75rem' }}>{intro}</p>

        {multiPack && (
          <p style={{ margin: '0 0 0.75rem' }}>
            This is a {packSize}-figure pack set.
          </p>
        )}

        {cleanExcl && (
          <p style={{ margin: '0 0 0.75rem' }}>
            Exclusive to {cleanExcl}.
          </p>
        )}

        {characterNotes && (
          <p style={{ margin: '0 0 0.75rem', color: 'var(--fp-muted)' }}>{characterNotes}</p>
        )}

        {median != null && soldCount > 0 && (
          <p style={{ margin: '0 0 0.75rem' }}>
            <strong>Current market value:</strong> ~${median.toFixed(0)} average based on {soldCount} recent
            eBay sold listings. Prices vary by condition — carded (MOC) figures typically command
            a significant premium over loose figures in this line.
          </p>
        )}

        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--fp-dim)' }}>
          Pricing data sourced from eBay completed listings.{' '}
          <a href={`/${genre}`} style={{ color: 'var(--fp-accent)', textDecoration: 'none' }}>
            Browse all {prettifySlug(genre)} figures →
          </a>
        </p>
      </div>
    </details>
  )
}

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
