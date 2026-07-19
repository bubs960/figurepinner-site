/**
 * Character hub page — /[genre]/character/[character_slug]
 * e.g. /wrestling/character/john-cena
 *      /marvel/character/spider-man
 *      /dc/character/batman
 *
 * SEO purpose: ranks for "[Character] action figure" queries — shows every
 * release of that character across all lines, grouped by product line then wave.
 * No external pricing fetched — KB data only. Fast, cacheable, crawlable.
 *
 * ISR: generateStaticParams returns [] — on-demand ISR, no build-time prerender.
 * Same pattern as /figure/[figure_id] (S32 fix, 2026-06-18).
 */

import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import {
  getFiguresByFandom,
  getAllFandoms,
  deriveName,
  figureUrl,
  prettyFigureUrl,
  type KBFigure,
} from '@/data/kb'
import { fandomsForGenre, getFandom, genreSlugForFandom } from '@/lib/genreFigures'
import { prettifySlug, buildEbaySearchUrl, EBAY_CAMPAIGN_ID } from '@/app/figure/[figure_id]/_lib/figureFormatters'
import AdSlot from '@/app/components/AdSlot'
import TrackedLink from '@/app/components/TrackedLink'
import FigureThumb from '@/app/components/FigureThumb'
import QuickLookAnchor from '@/app/components/QuickLookAnchor'
import { thumb } from '@/lib/imageUrl'
import SiteHeader from '@/app/components/SiteHeader'
import BreadcrumbJsonLd from '@/app/_components/BreadcrumbJsonLd'
import JsonLd from '@/app/_components/JsonLd'

export const revalidate = 86400

// On-demand ISR — no pre-builds at build time (returns []), but registers
// the route in PrerenderManifest.dynamicRoutes so OpenNext emits s-maxage.
export function generateStaticParams() {
  return []
}

// ─── Genre / fandom mapping (keep in sync with [line]/page.tsx) ──────────────

const GENRE_ACCENT: Record<string, string> = {
  'wrestling':                    '#e53238',
  'marvel':                       '#e23636',
  'star-wars':                    '#3d7bca',
  'dc':                           '#3a6fbf',
  'transformers':                 '#c44f0e',
  'gijoe':                        '#3d7a3d',
  'masters-of-the-universe':      '#8b2be2',
  'teenage-mutant-ninja-turtles': '#3d7a3d',
  'power-rangers':                '#c43d3d',
  'indiana-jones':                '#8b6914',
  'ghostbusters':                 '#c4941c',
  'mythic-legions':               '#546e7a',
  'thundercats':                  '#c44f0e',
  'action-force':                 '#3a6fbf',
  'dungeons-dragons':             '#7b2be2',
  'neca':                         '#37474f',
  'spawn':                        '#212121',
}

// URL slug → KB fandom remap + NECA rollup: single source of truth is
// lib/genreFigures.ts (consolidated S52+1 — this page used to carry its own
// copy of SLUG_TO_FANDOM/NECA_FANDOM, same pattern as [line]/page.tsx).

// ─── Data helpers ─────────────────────────────────────────────────────────────

/** All figures for a genre + character slug combination. */
function figuresForCharacter(genre: string, characterSlug: string): KBFigure[] {
  return fandomsForGenre(genre).flatMap(fandom =>
    getFiguresByFandom(fandom).filter(
      f => f.character_canonical === characterSlug
    )
  )
}

/** Group figures by product_line, then by release_wave within each line. */
function groupByLineAndWave(figures: KBFigure[]): Array<{
  lineSlug: string
  lineLabel: string
  totalFigs: number
  waves: Array<{ waveKey: string; waveLabel: string; figures: KBFigure[] }>
}> {
  // Group by product_line
  const lineMap = new Map<string, KBFigure[]>()
  for (const f of figures) {
    const pl = f.product_line
    if (!lineMap.has(pl)) lineMap.set(pl, [])
    lineMap.get(pl)!.push(f)
  }

  // Sort lines by figure count desc, then alpha
  const sortedLines = [...lineMap.entries()].sort(([aSlug, aFigs], [bSlug, bFigs]) => {
    if (bFigs.length !== aFigs.length) return bFigs.length - aFigs.length
    return aSlug.localeCompare(bSlug)
  })

  return sortedLines.map(([lineSlug, lineFigs]) => {
    // Group by wave within line
    const waveMap = new Map<string, KBFigure[]>()
    for (const f of lineFigs) {
      const w = f.release_wave || 'Unknown'
      if (!waveMap.has(w)) waveMap.set(w, [])
      waveMap.get(w)!.push(f)
    }

    const waves = [...waveMap.entries()]
      .sort(([a], [b]) => {
        const na = parseInt(a), nb = parseInt(b)
        if (!isNaN(na) && !isNaN(nb)) return na - nb
        if (a === 'Unknown') return 1
        if (b === 'Unknown') return -1
        return a.localeCompare(b)
      })
      .map(([waveKey, waveFigs]) => ({
        waveKey,
        waveLabel:
          waveKey === 'Unknown'
            ? 'Other'
            : isNaN(parseInt(waveKey))
            ? waveKey
            : `Series ${waveKey}`,
        figures: waveFigs.sort((a, b) => deriveName(a).localeCompare(deriveName(b))),
      }))

    return {
      lineSlug,
      lineLabel: prettifySlug(lineFigs[0]?.v1_line ?? lineSlug),
      totalFigs: lineFigs.length,
      waves,
    }
  })
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ genre: string; character_slug: string }>
}): Promise<Metadata> {
  const { genre, character_slug } = await params

  // Genre-alias 308 (2026-07-12 root-cause FIX-2) — in generateMetadata for a
  // real pre-streaming 308; page body carries the fallback copy.
  const canonicalGenre = genreSlugForFandom(getFandom(genre))
  if (canonicalGenre !== genre) permanentRedirect(`/${canonicalGenre}/character/${character_slug}`)

  const figures = figuresForCharacter(genre, character_slug)
  if (!figures.length) {
    return { title: 'Not Found', robots: { index: false, follow: false } }
  }

  const charName = prettifySlug(character_slug)
  const genreName = prettifySlug(genre)
  const lineCount = new Set(figures.map(f => f.product_line)).size
  const year = new Date().getFullYear()

  const title = `${charName} Action Figure Price Guide — All ${lineCount} Lines`
  const description = `${charName} action figure prices across ${figures.length} releases in ${lineCount} line${lineCount !== 1 ? 's' : ''}. Real eBay sold prices for ${genreName} figures. Updated daily — ${year}.`

  return {
    title,
    description,
    openGraph: {
      title: `${title} | FigurePinner`,
      description: `Every ${charName} ${genreName} figure — ${figures.length} releases, ${lineCount} lines. Real eBay sold prices.`,
      images: figures.find(f => f.canonical_image_url)?.canonical_image_url
        ? [{ url: figures.find(f => f.canonical_image_url)!.canonical_image_url! }]
        : [],
    },
    alternates: {
      canonical: `https://figurepinner.com/${genre}/character/${character_slug}`,
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CharacterHubPage({
  params,
}: {
  params: Promise<{ genre: string; character_slug: string }>
}) {
  const { genre, character_slug } = await params

  // Genre-alias 308 fallback (real 308 comes from generateMetadata above).
  const canonicalGenre = genreSlugForFandom(getFandom(genre))
  if (canonicalGenre !== genre) permanentRedirect(`/${canonicalGenre}/character/${character_slug}`)

  // Guard: genre must be valid
  const validFandoms = getAllFandoms()
  if (!fandomsForGenre(genre).some(f => validFandoms.includes(f))) notFound()

  const figures = figuresForCharacter(genre, character_slug)
  if (!figures.length) notFound()

  const charName = prettifySlug(character_slug)
  const genreName = prettifySlug(genre)
  const accent = GENRE_ACCENT[genre] ?? '#FF5F00'
  const lineGroups = groupByLineAndWave(figures)
  const lineCount = lineGroups.length
  const totalCount = figures.length
  const ebayHref = buildEbaySearchUrl(charName, genreName, '', '', null, EBAY_CAMPAIGN_ID)

  // Hero image — prefer figure with an image
  const heroFig = figures.find(f => f.canonical_image_url)
  const heroImage = heroFig?.canonical_image_url ?? null

  // All figure images for strip (up to 6, deduplicated)
  const imageStrip = figures
    .filter(f => f.canonical_image_url)
    .slice(0, 6)
    .map(f => f.canonical_image_url!)

  // JSON-LD: CollectionPage
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${charName} Action Figure Price Guide`,
    description: `All ${charName} ${genreName} figures with real eBay sold prices`,
    url: `https://figurepinner.com/${genre}/character/${character_slug}`,
    ...(heroImage ? { image: heroImage } : {}),
    mainEntity: {
      '@type': 'ItemList',
      name: `${charName} Figures`,
      numberOfItems: totalCount,
      itemListElement: figures.slice(0, 50).map((f, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://figurepinner.com${prettyFigureUrl(f)}`,
        name: deriveName(f),
      })),
    },
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd crumbs={[
        { name: 'Home', url: 'https://figurepinner.com' },
        { name: genreName, url: `https://figurepinner.com/${genre}` },
        { name: charName, url: `https://figurepinner.com/${genre}/character/${character_slug}` },
      ]} />
      <style>{`
        /* Lift+tilt+glow promoted from the homepage ShelfCase pattern
           (src/app/page.tsx:290, WP2 2026-07-05). Targets .char-card-mount,
           NOT the .char-card anchor itself — the anchor also carries
           QuickLookAnchor's hover handlers, and QuickLookAnchor reads the
           anchor's getBoundingClientRect() to position its portaled preview
           card. Transforming the anchor directly would move that rect out
           from under the popover's own measurement; the same anchor/mount
           split RelatedRow.tsx already uses (fp-relrow-card / fp-relrow-mount)
           avoids that entirely by keeping the anchor transform-free. */
        .char-card:hover .char-card-mount {
          border-color: ${accent}55 !important;
          background: ${accent}0A !important;
          transform: translateY(-4px) rotate(-0.6deg);
          box-shadow: 0 14px 22px rgba(0,0,0,.35), 0 0 0 1px ${accent}40, 0 0 16px ${accent}29;
        }
        @media (prefers-reduced-motion: reduce) {
          .char-card:hover .char-card-mount { transform: none; }
        }
        .line-section + .line-section {
          margin-top: 2.5rem;
        }
      `}</style>

      <SiteHeader
        crumbs={[
          { label: genreName, href: `/${genre}` },
          { label: charName },
        ]}
      />

      {/* ── Hero ── */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1rem, 5vw, 3rem)',
          background: `linear-gradient(135deg, ${accent}08 0%, transparent 60%)`,
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

          {/* Hero image */}
          {heroImage && (
            <div style={{ flexShrink: 0 }} className="hero-img-wrap">
              <FigureThumb
                image={heroImage}
                size={120}
                radius={12}
                cdnWidth={240}
                fallback={{ kind: 'icon', accent }}
                eager
              />
            </div>
          )}

          <div style={{ flex: 1 }}>
            {/* Genre pill */}
            <a
              href={`/${genre}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: accent, textDecoration: 'none',
                background: `${accent}15`, border: `1px solid ${accent}30`,
                borderRadius: '9999px', padding: '0.2rem 0.625rem',
                marginBottom: '1rem',
              }}
            >
              {genreName}
            </a>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text)',
                margin: '0 0 0.625rem',
              }}
            >
              {charName} Figure Price Guide
            </h1>

            <p style={{ fontSize: '1rem', color: 'var(--fp-muted)', margin: '0 0 1.5rem', maxWidth: 540 }}>
              Every {charName} {genreName} figure — {totalCount.toLocaleString()} release{totalCount !== 1 ? 's' : ''} across{' '}
              {lineCount} line{lineCount !== 1 ? 's' : ''}. Real eBay sold prices.
            </p>

            {/* Image strip */}
            {imageStrip.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {imageStrip.map((url, i) => (
                  <FigureThumb
                    key={i}
                    image={url}
                    size={56}
                    radius={8}
                    cdnWidth={120}
                    fallback={{ kind: 'icon', accent }}
                    eager={i === 0}
                  />
                ))}
                {totalCount > imageStrip.length && (
                  <div
                    style={{
                      width: 56, height: 56, borderRadius: 8, flexShrink: 0,
                      background: 'var(--s1)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700, color: 'var(--fp-muted)',
                    }}
                  >
                    +{(totalCount - imageStrip.length).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Total Figures', value: totalCount.toLocaleString() },
                { label: 'Lines', value: lineCount.toLocaleString() },
              ].map(s => (
                <div key={s.label}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.5rem', fontWeight: 800, color: accent,
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem', color: 'var(--fp-muted)', fontWeight: 500,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 5vw, 3rem) 5rem',
        }}
      >
        {/* Line sections */}
        <div>
          {lineGroups.map((lineGroup, lineIdx) => (
            <section
              key={lineGroup.lineSlug}
              className="line-section"
              style={{ marginTop: lineIdx === 0 ? 0 : '2.5rem' }}
            >
              {/* Line header */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: `2px solid ${accent}22`,
                }}
              >
                <div
                  style={{
                    width: 3, height: '1.125rem', borderRadius: 2,
                    background: accent, flexShrink: 0,
                  }}
                />
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.0625rem', fontWeight: 700,
                    color: 'var(--text)', margin: 0,
                  }}
                >
                  <a
                    href={`/${genre}/${lineGroup.lineSlug}`}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {lineGroup.lineLabel}
                  </a>
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem', color: 'var(--fp-muted)',
                    marginLeft: 'auto', fontWeight: 500,
                  }}
                >
                  {lineGroup.totalFigs} figure{lineGroup.totalFigs !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Wave groups within line — omit wave header when only one wave */}
              {lineGroup.waves.map(({ waveKey, waveLabel, figures: waveFigs }) => (
                <div key={waveKey} style={{ marginBottom: lineGroup.waves.length > 1 ? '1.25rem' : 0 }}>
                  {lineGroup.waves.length > 1 && (
                    <h3
                      style={{
                        fontSize: '0.8rem', fontWeight: 600, color: 'var(--fp-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        margin: '0 0 0.5rem',
                      }}
                    >
                      {waveLabel}
                    </h3>
                  )}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: '0.5rem',
                    }}
                  >
                    {waveFigs.map(f => (
                      <CharFigureCard key={f.figure_id} figure={f} accent={accent} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>

        {/* Bottom CTA — AD STANDARD v2: GRID class, 1 unit, after the last
            content grid, before the closer — position already matched,
            swapped the dead AdSense rectangle call for the live Adsterra key. */}
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <AdSlot slot="adsterra-banner" />
          <div style={{ marginTop: '2rem' }}>
            <a
              href="/sign-up"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: accent, color: '#fff',
                borderRadius: 10,
                fontWeight: 700, fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Track {charName} Prices Free →
            </a>
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--fp-muted)' }}>
              Vault, wantlist, and price alerts — free, no caps
            </p>
            <TrackedLink
              href={ebayHref}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              funnelEvent="ebay_exit"
              funnelDetail={{ target: 'character_hub_cta', character: character_slug }}
              style={{
                display: 'inline-block', marginTop: '1rem',
                fontSize: '0.85rem', fontWeight: 600,
                color: accent, textDecoration: 'none',
                borderBottom: `1px solid ${accent}55`,
              }}
            >
              Hunt {charName} on eBay →
            </TrackedLink>
          </div>
        </div>

        <p
          style={{
            marginTop: '2rem', textAlign: 'center',
            fontSize: '0.68rem', color: 'var(--fp-muted)',
          }}
        >
          FigurePinner may earn a commission from eBay purchases. Prices are based on recent sold listings.
        </p>
      </main>
    </div>
  )
}

// ─── Figure card ──────────────────────────────────────────────────────────────

function CharFigureCard({ figure: f, accent }: { figure: KBFigure; accent: string }) {
  const name = deriveName(f)
  const exclusive =
    f.exclusive_to && f.exclusive_to !== 'None' ? f.exclusive_to : null

  return (
    <QuickLookAnchor
      href={prettyFigureUrl(f)}
      className="char-card"
      image={thumb(f.canonical_image_url, 640)}
      name={name}
      sub={exclusive}
      figureId={f.figure_id}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'var(--text)',
        fontSize: '0.8125rem',
        minWidth: 0,
      }}
    >
      {/* Visual chrome + hover lift/tilt/glow live here, not on the anchor
          above — see the .char-card-mount comment in the <style> block. */}
      <div
        className="char-card-mount"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.625rem 0.75rem',
          background: 'var(--s1)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          minWidth: 0,
          transition: 'border-color 0.12s, background 0.12s, transform .35s cubic-bezier(.22,.61,.36,1), box-shadow .35s',
        }}
      >
        <FigureThumb
          image={f.canonical_image_url}
          size={40}
          radius={4}
          cdnWidth={96}
          fallback={{ kind: 'icon', accent }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              lineHeight: 1.3,
            }}
          >
            {name}
          </div>
          {exclusive && (
            <div style={{ fontSize: '0.65rem', color: accent, marginTop: 1, opacity: 0.85 }}>
              {exclusive}
            </div>
          )}
        </div>
        <svg
          width="10" height="10" viewBox="0 0 12 12" fill="none"
          stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, opacity: 0.6 }}
        >
          <path d="M2 6h8M6 2l4 4-4 4" />
        </svg>
      </div>
    </QuickLookAnchor>
  )
}
