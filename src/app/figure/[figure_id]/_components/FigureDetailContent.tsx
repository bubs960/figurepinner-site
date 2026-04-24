/**
 * FigureDetailContent — shared async server component
 * Renders the full figure detail page for a given figureId.
 * Used by both /figure/[figure_id] and /[genre]/[line]/[slug] routes
 * so both get the same content; canonical URL is controlled by generateMetadata.
 */

import { currentUser } from '@clerk/nextjs/server'
import { getFigureById, getFiguresByFandom, deriveName, figureUrl } from '@/data/kb'
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
import { buildEbaySearchUrl, computeTrend, compCountToConfidence, prettifySlug } from '../_lib/figureFormatters'
import type { LoreInput } from '../_lib/loreRenderer'
import { getLineAttributes } from '../_lib/line-attributes-data'
import { getCharacterNotes } from '../_lib/character-notes-data'
import { getSellerListings } from '@/data/bubs-inventory'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''
const EBAY_CAMPAIGN_ID = process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID ?? ''

// ── API types ──────────────────────────────────────────────────────────────────

type PriceData = {
  figureId: string
  avgSold: number | null
  medianSold?: number | null
  minSold?: number | null
  maxSold?: number | null
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

export async function fetchFigurePageData(figure_id: string): Promise<{ price: PriceData | null; imageUrl: string | null }> {
  const [priceRes, figureRes] = await Promise.all([
    fetch(
      `${API_BASE}/api/v1/figure-price?figureId=${encodeURIComponent(figure_id)}`,
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(4000) }
    ).catch(() => null),
    fetch(
      `${API_BASE}/api/v1/figure/${encodeURIComponent(figure_id)}`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(4000) }
    ).catch(() => null),
  ])

  const price = priceRes?.ok
    ? await priceRes.json() as PriceData
    : null

  const figureApiData = figureRes?.ok
    ? await figureRes.json() as { figure_id: string; canonical_image_url: string | null }
    : null

  return { price, imageUrl: figureApiData?.canonical_image_url ?? null }
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

  // ── Pro gate ────────────────────────────────────────────────────────────────

  const user  = await currentUser()
  const isPro = user?.publicMetadata?.isPro === true

  // ── ValueStrip props ────────────────────────────────────────────────────────

  const valuePricing = price && price.soldCount > 0 ? {
    median:        price.medianSold ?? price.avgSold ?? null,
    trend_90d_pct: computeTrend(price.soldHistory),
    low:           price.minSold ?? null,
    high:          price.maxSold ?? null,
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name:        displayName,
    description: `${displayName} action figure by ${brand}. ${line}${seriesNum ? ` Series ${seriesNum}` : ''}.`,
    brand:       { '@type': 'Brand', name: brand },
    image:       imageUrlFinal ?? undefined,
    category:    prettifySlug(genre),
    offers: valuePricing?.median != null ? {
      '@type':        'Offer',
      price:          valuePricing.median.toFixed(2),
      priceCurrency:  'USD',
      availability:   'https://schema.org/InStock',
      url:            ebayUrl,
      seller:         { '@type': 'Organization', name: 'eBay' },
      description:    `Based on ${price!.soldCount} recent eBay sold listings`,
    } : undefined,
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
        @media (max-width: 540px) {
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
          <span style={{ color: 'var(--fp-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </span>
        </div>
        {isPro ? (
          <span style={{
            padding: '5px 14px', borderRadius: 'var(--fp-radius-sm)', fontSize: '0.78rem', fontWeight: '700',
            background: 'rgba(0,200,112,0.12)', color: '#00C870',
            border: '1px solid rgba(0,200,112,0.3)', flexShrink: 0, marginLeft: '1rem',
          }}>Pro ✓</span>
        ) : (
          <a href="/pro" style={{
            padding: '5px 14px', borderRadius: 'var(--fp-radius-sm)', fontSize: '0.78rem', fontWeight: '700',
            background: 'var(--fp-accent)', color: '#fff', textDecoration: 'none', flexShrink: 0, marginLeft: '1rem',
          }}>Pro</a>
        )}
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
            {hasPricing ? (
              <MarketPanel
                pricing={marketPricing}
                isPro={isPro}
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
              isPro={isPro}
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
        <CtaRail genre={genre} brand={brand} line={line} />
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
