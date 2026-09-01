/**
 * /guides/red-white-blue — "Red, White & Blue" seasonal hub (July 4th).
 *
 * Campaign landing page for the rwb-jul4 paid flight
 * (Bridge/STANDALONE-CAP-CAMPAIGN-PLAN-2026-07-03.md): a multi-fandom grid of
 * character squares — image + name + live median range — each tile linking to
 * that character's figures. Static route wins over /guides/[slug], so this
 * does NOT live in ARTICLES; the sitemap lists it explicitly.
 *
 * Tiles are image-gated at render (Steve rule: no tile without a photo) and
 * price ranges come from the same R2 price-summary snapshots the guide pages
 * use, sampled per character so the ISR render's fan-out stays bounded.
 */

import type { Metadata } from 'next'
import {
  getFiguresByFandom,
  getFigureById,
  prettyFigureUrl,
  type KBFigure,
} from '@/data/kbLite'
import { genreSlugForFandom } from '@/lib/genreFigures'
import { fetchPriceSnaps } from '../_lib/priceSnaps'
import { RWB_ROSTER, RWB_PRICE_SAMPLE_CAP, type RwbRosterEntry } from './rwbRoster'
import SiteHeader from '@/app/components/SiteHeader'
import FigureThumb from '@/app/components/FigureThumb'
import AdSlot from '@/app/components/AdSlot'
import JsonLd from '@/app/_components/JsonLd'
import { SectionLabel, Card, CtaButton } from '@/app/components/ui'

const BASE = 'https://figurepinner.com'
const CANONICAL = `${BASE}/guides/red-white-blue`

export const revalidate = 86400

const FANDOM_LABEL: Record<string, string> = {
  'marvel-comics': 'Marvel',
  'wrestling': 'Wrestling',
  'gi-joe': 'G.I. Joe',
  'dc': 'DC',
  'spawn': 'Spawn',
}

const FANDOM_ACCENT: Record<string, string> = {
  'marvel-comics': '#e23636',
  'wrestling': '#e53238',
  'gi-joe': '#2e7d32',
  'dc': '#3a6fbf',
  'spawn': '#546e7a',
}

export const metadata: Metadata = {
  title: { absolute: 'Red, White & Blue Action Figures — Real Sold Prices | FigurePinner' },
  description:
    'Captain America to Hulk Hogan to G.I. Joe — every red, white & blue action figure worth collecting, priced by real eBay sold data. Live median ranges per character, free.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'Red, White & Blue Action Figures — Real Sold Prices',
    description:
      'Captain America, Mr. America, Sgt. Slaughter, Wonder Woman and more — the stars-and-stripes shelf, priced by real eBay solds.',
    url: CANONICAL,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Red, White & Blue Action Figures — Real Sold Prices',
    description: 'The stars-and-stripes shelf, priced by real eBay solds. Free.',
  },
}

type Tile = {
  entry: RwbRosterEntry
  href: string
  image: string
  figCount: number
  priceFids: string[]
}

/** Resolve a roster entry into a renderable tile, or null if image-gated out. */
function resolveTile(entry: RwbRosterEntry): Tile | null {
  const figures = getFiguresByFandom(entry.fandom).filter(
    (f) => f.character_canonical === entry.character,
  )
  if (!figures.length) return null

  const seed = entry.seedFid ? getFigureById(entry.seedFid) : null
  const withImage = figures.filter((f) => f.canonical_image_url)
  if (!withImage.length) return null

  const image = seed?.canonical_image_url ?? withImage[0].canonical_image_url!

  // Single-release characters land on the figure page itself — a one-figure
  // character hub is a dead end; the figure page has the full price panel.
  const href = figures.length === 1
    ? prettyFigureUrl(figures[0])
    : `/${genreSlugForFandom(entry.fandom)}/character/${entry.character}`

  // Bounded price-snapshot sample: seed figure always included. Evenly spaced
  // across the character's releases (KB orders roughly by manufacturer/line),
  // so the range spans budget lines AND premium ones (Hot Toys, Mezco) instead
  // of clustering in whichever line happens to sort first.
  const sample: KBFigure[] = []
  if (seed) sample.push(seed)
  const step = Math.max(1, Math.ceil(figures.length / RWB_PRICE_SAMPLE_CAP))
  for (let i = 0; i < figures.length && sample.length < RWB_PRICE_SAMPLE_CAP; i += step) {
    const f = figures[i]
    if (seed && f.figure_id === seed.figure_id) continue
    sample.push(f)
  }

  return { entry, href, image, figCount: figures.length, priceFids: sample.map((f) => f.figure_id) }
}

function money(n: number): string {
  return `$${n < 100 ? Math.round(n) : Math.round(n).toLocaleString('en-US')}`
}

export default async function RedWhiteBluePage() {
  const tiles = RWB_ROSTER.map(resolveTile).filter((t): t is Tile => t !== null)

  const snaps = await fetchPriceSnaps(tiles.flatMap((t) => t.priceFids))

  const ranges = new Map<string, string>()
  for (const t of tiles) {
    const medians = t.priceFids
      .map((fid) => snaps.get(fid)?.median_sold)
      .filter((m): m is number => typeof m === 'number' && m > 0)
    if (!medians.length) continue
    const lo = Math.min(...medians)
    const hi = Math.max(...medians)
    ranges.set(
      t.entry.character + t.entry.fandom,
      lo === hi ? `${money(lo)} median` : `${money(lo)}–${money(hi)} median`,
    )
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Red, White & Blue Action Figures',
    description: metadata.description,
    url: CANONICAL,
    hasPart: tiles.map((t) => ({
      '@type': 'WebPage',
      name: t.entry.label,
      url: `${BASE}${t.href}`,
    })),
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
      <JsonLd data={jsonLd} />
      <SiteHeader crumbs={[{ label: 'Guides', href: '/guides' }, { label: 'Red, White & Blue' }]} />

      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '3rem 1.25rem 5rem' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <SectionLabel color="#e53238" style={{ letterSpacing: '0.14em', marginBottom: '0.75rem' }}>
            ★ ★ ★ &nbsp;July 4th Special&nbsp; ★ ★ ★
          </SectionLabel>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2.1rem, 6vw, 3.25rem)',
            lineHeight: 1.05, letterSpacing: '0.01em', margin: '0 0 1rem', color: 'var(--fp-text)',
          }}>
            <span style={{ color: '#e53238' }}>Red</span>
            {', '}
            <span style={{ color: 'var(--fp-text)' }}>White</span>
            {' & '}
            <span style={{ color: '#3d7bca' }}>Blue</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--fp-muted)', lineHeight: 1.65, maxWidth: '640px', margin: '0 auto' }}>
            The stars-and-stripes shelf, across every fandom — Captain America to Hulk Hogan to G.I. Joe.
            Every price below is a live median from real eBay sold listings, not asking-price fiction.
          </p>
        </div>

        {/* Tile grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem',
        }}>
          {tiles.map((t) => {
            const accent = FANDOM_ACCENT[t.entry.fandom] ?? 'var(--fp-accent)'
            const range = ranges.get(t.entry.character + t.entry.fandom)
            return (
              <Card
                key={t.entry.fandom + t.entry.character}
                as="a"
                href={t.href}
                style={{
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  borderTop: `3px solid ${accent}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <FigureThumb
                    image={t.image}
                    size={148}
                    radius={10}
                    fallback={{ kind: 'monogram', name: t.entry.label, accent }}
                    alt={`${t.entry.label} action figure`}
                  />
                </div>
                <div>
                  <SectionLabel color={accent} style={{ fontSize: '0.68rem', marginBottom: '0.3rem' }}>
                    {FANDOM_LABEL[t.entry.fandom] ?? t.entry.fandom}
                  </SectionLabel>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.08rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '0.35rem' }}>
                    {t.entry.label}
                  </div>
                  {t.entry.tagline && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.45, marginBottom: '0.5rem' }}>
                      {t.entry.tagline}
                    </div>
                  )}
                  <div style={{ fontSize: '0.82rem', color: 'var(--fp-muted)' }}>
                    {t.figCount === 1 ? '1 figure' : `${t.figCount} figures`}
                    {range && (
                      <span style={{ color: 'var(--fp-text)', fontWeight: 600 }}> · {range}</span>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '2.5rem 0' }}>
          <AdSlot slot="adsterra-banner" />
        </div>

        {/* Footer CTA */}
        <div style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--fp-muted)', margin: '0 0 1.25rem' }}>
            Chasing a figure that isn&apos;t on this shelf? Every median on FigurePinner comes from
            real eBay sold data — {`look yours up free.`}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <CtaButton href="/search?q=captain+america">All Captain America figures →</CtaButton>
            <CtaButton href="/gijoe" variant="secondary">A Real American Hero: G.I. Joe →</CtaButton>
          </div>
        </div>
      </div>
    </main>
  )
}
