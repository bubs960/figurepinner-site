/**
 * Character hub — shared resolver, metadata and view for
 *   /[genre]/character/[character_slug]            (page 1, the canonical hub URL)
 *   /[genre]/character/[character_slug]/page/[n]   (pages 2+)
 *
 * Extracted from [character_slug]/page.tsx on 2026-09-02 (Release F) when
 * pagination landed — same split as [genre]/[line]/_lib/lineHub.tsx, for the
 * same reason (Next restricts what a page file may export). Comments moved
 * with the code, not rewritten.
 *
 * SEO purpose: ranks for "[Character] action figure" queries — shows every
 * release of that character across all lines, grouped by product line then wave.
 * No external pricing fetched — KB data only. Fast, cacheable, crawlable.
 *
 * Why pagination (gap sweep finding 1, 2026-09-02): the hub rendered every
 * release of a character with no cap, each card a client QuickLookAnchor —
 * the same unbounded-render shape that took /marvel/marvel-legends to Error
 * 1102 the same day. 96 cards/page bounds the RSC flight, the DOM and the
 * hydration cost; order is unchanged (lines by count desc, waves numeric,
 * names alpha), a line or wave may straddle pages and says so.
 */

import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import {
  getCardsByCharacter,
  getAllFandoms,
  deriveName,
  buildPrettyUrlMap,
  prettyFigureUrlFromMap,
  type KBFigure,
} from '@/data/kbDb'
import { fandomsForGenre, getFandom, genreSlugForFandom, genreCrumbForFandom } from '@/lib/genreFigures'
import { characterHubMeetsIndexBar } from '@/data/indexValueCensus'
import { prettifySlug, buildEbaySearchUrl, EBAY_CAMPAIGN_ID } from '@/app/figure/[figure_id]/_lib/figureFormatters'
import AdSlot from '@/app/components/AdSlot'
import TrackedLink from '@/app/components/TrackedLink'
import FigureThumb from '@/app/components/FigureThumb'
import FigureThumbStatic from '@/app/components/FigureThumbStatic'
import ThumbLoadDelegate from '@/app/components/ThumbLoadDelegate'
import QuickLookAnchor from '@/app/components/QuickLookAnchor'
import { thumb } from '@/lib/imageUrl'
import SiteHeader from '@/app/components/SiteHeader'
import BreadcrumbJsonLd from '@/app/_components/BreadcrumbJsonLd'
import JsonLd from '@/app/_components/JsonLd'
import { pageWindow, pageNavItems, characterHubPath, totalPagesFor, LINE_HUB_PAGE_SIZE } from '@/app/[genre]/[line]/_lib/lineHubPaging'

const BASE = 'https://figurepinner.com'

// ─── Genre / fandom mapping (keep in sync with [line]/_lib/lineHub.tsx) ──────

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
  'ufc':                          '#141414',
}

// URL slug → KB fandom remap + NECA rollup: single source of truth is
// lib/genreFigures.ts (consolidated S52+1 — this page used to carry its own
// copy of SLUG_TO_FANDOM/NECA_FANDOM, same pattern as [line]/page.tsx).

// ─── Data helpers ─────────────────────────────────────────────────────────────

/** All figures for a genre + character slug combination. */
async function figuresForCharacter(genre: string, characterSlug: string): Promise<KBFigure[]> {
  // OOM stage 2 (2026-09-02): a (character_canonical) index seek per fandom,
  // compact cards — instead of every figure in the fandom filtered in JS. The
  // slug is bound exactly as given, matching the old exact-equality filter.
  const figureGroups = await Promise.all(
    fandomsForGenre(genre).map(fandom => getCardsByCharacter(fandom, characterSlug))
  )
  return figureGroups.flat()
}

/**
 * Shared resolver for both routes (metadata + body): genre-alias 308 with the
 * page suffix carried through (2026-07-12 root-cause FIX-2 — exactly one slug
 * namespace serves 200 per fandom; thrown in generateMetadata for a real
 * pre-streaming 308, repeated in the body as the fallback), optional genre
 * validity guard (body only), then the figures. [] = not found (caller decides).
 */
export async function loadCharacterHubFigures(
  genre: string, characterSlug: string, suffix = '', opts: { guardGenre?: boolean } = {},
): Promise<KBFigure[]> {
  const canonicalGenre = genreSlugForFandom(getFandom(genre))
  if (canonicalGenre !== genre) permanentRedirect(`/${canonicalGenre}/character/${characterSlug}${suffix}`)

  if (opts.guardGenre) {
    // Guard: genre must be valid
    const validFandoms = await getAllFandoms()
    if (!fandomsForGenre(genre).some(f => validFandoms.includes(f))) notFound()
  }

  return figuresForCharacter(genre, characterSlug)
}

type WaveGroup = { waveKey: string; waveLabel: string; figures: KBFigure[] }
type LineGroup = { lineSlug: string; lineLabel: string; totalFigs: number; waves: WaveGroup[] }

/** Group figures by product_line, then by release_wave within each line. */
function groupByLineAndWave(figures: KBFigure[]): LineGroup[] {
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

// ─── Paging (Release F) ───────────────────────────────────────────────────────

type OrderedCard = { f: KBFigure; line: LineGroup; wave: WaveGroup; lineStart: number; waveStart: number }

/** Display order flattened to one list, each card knowing where its line and
 *  wave begin so a page can tell whether it is showing a continuation. */
function orderedCards(lineGroups: LineGroup[]): OrderedCard[] {
  const out: OrderedCard[] = []
  let i = 0
  for (const line of lineGroups) {
    const lineStart = i
    for (const wave of line.waves) {
      const waveStart = i
      for (const f of wave.figures) {
        out.push({ f, line, wave, lineStart, waveStart })
        i++
      }
    }
  }
  return out
}

type PageLineSection = {
  line: LineGroup
  /** True when this line started on an earlier page. */
  continued: boolean
  /** Cards of this line on THIS page. */
  count: number
  waves: Array<{ wave: WaveGroup; continued: boolean; figures: KBFigure[] }>
}

/** Regroup one page's window back into line → wave sections, in order. */
function sectionsForWindow(items: OrderedCard[], start: number): PageLineSection[] {
  const sections: PageLineSection[] = []
  let idx = start
  for (const card of items) {
    let sec = sections[sections.length - 1]
    if (!sec || sec.line !== card.line) {
      sec = { line: card.line, continued: idx > card.lineStart, count: 0, waves: [] }
      sections.push(sec)
    }
    let wv = sec.waves[sec.waves.length - 1]
    if (!wv || wv.wave !== card.wave) {
      wv = { wave: card.wave, continued: idx > card.waveStart, figures: [] }
      sec.waves.push(wv)
    }
    wv.figures.push(card.f)
    sec.count++
    idx++
  }
  return sections
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export function characterHubMetadata(genre: string, characterSlug: string, figures: KBFigure[], page: number): Metadata {
  if (!figures.length) {
    return { title: 'Not Found', robots: { index: false, follow: false } }
  }

  const charName = prettifySlug(characterSlug)
  const genreName = prettifySlug(genre)
  const lineCount = new Set(figures.map(f => f.product_line)).size
  const year = new Date().getFullYear()
  const totalPages = totalPagesFor(figures.length)
  const paged = totalPages > 1
  const pageTag = page > 1 ? ` (Page ${page} of ${totalPages})` : ''
  const first = (page - 1) * LINE_HUB_PAGE_SIZE + 1
  const last = Math.min(page * LINE_HUB_PAGE_SIZE, figures.length)

  // Index gate (webaudit F2, 2026-08-20): must stay in LOCKSTEP with the
  // sitemap's character-page filter — both call characterHubMeetsIndexBar on
  // the non-canary member set (the sitemap builds its buckets from a
  // !is_canary-filtered list, so the same filter applies here). Below-bar hubs
  // stay live and followable; they just stop being submitted-and-indexable.
  // Pages 2+ inherit the same verdict (sitemap lists page 1 only).
  const indexWorthy = characterHubMeetsIndexBar(
    figures.filter(f => !f.is_canary).map(f => f.figure_id)
  )

  // Phase 4 price-copy fix (2026-08-24, WEBAUDIT-TO-WEB-CURRENT-STATE-AND-NEXT-STEPS):
  // this hub fetches no price data server-side — pricing only ever renders via
  // QuickLookAnchor's desktop-only pointer-hover card, invisible to crawlers and
  // touch devices alike. Title/meta previously claimed "real eBay sold prices"
  // on a surface that renders none; this hub is a browsable catalog that LINKS
  // to price data on each figure's own page, not a price surface itself.
  const title = `${charName} Action Figure Guide — All ${lineCount} Lines${pageTag}`
  const description = page > 1
    ? `${charName} action figures ${first}–${last} of ${figures.length} (page ${page} of ${totalPages}) across ${lineCount} line${lineCount !== 1 ? 's' : ''}. See current eBay sold prices on each figure's page — updated daily, ${year}.`
    : `Every ${charName} action figure across ${figures.length} releases in ${lineCount} line${lineCount !== 1 ? 's' : ''}. See current eBay sold prices on each figure's page — updated daily, ${year}.`

  return {
    title,
    description,
    ...(indexWorthy ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title: `${title} | FigurePinner`,
      description: `Every ${charName} ${genreName} figure — ${figures.length} releases, ${lineCount} lines. Real eBay sold prices on each figure's page.`,
      images: figures.find(f => f.canonical_image_url)?.canonical_image_url
        ? [{ url: figures.find(f => f.canonical_image_url)!.canonical_image_url! }]
        : [],
    },
    alternates: {
      canonical: `${BASE}${characterHubPath(genre, characterSlug, page)}`,
    },
    ...(paged
      ? {
          pagination: {
            previous: page > 1 ? `${BASE}${characterHubPath(genre, characterSlug, page - 1)}` : null,
            next: page < totalPages ? `${BASE}${characterHubPath(genre, characterSlug, page + 1)}` : null,
          },
        }
      : {}),
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export async function CharacterHubView(
  { genre, characterSlug, figures, page }: { genre: string; characterSlug: string; figures: KBFigure[]; page: number }
) {
  // Every row of this character in each fandom is in `figures`, so the
  // router-key count map is exact from own rows — no per-card COUNT queries
  // (stage 2, 2026-09-02).
  const counts = buildPrettyUrlMap(figures)

  const charName = prettifySlug(characterSlug)
  const genreName = prettifySlug(genre)
  // Same split as the line hub: /horror/character/freddy-krueger serves 200
  // while /horror is a 404, so the crumb must resolve through the hub-existence
  // question, not the route param. null => omit the genre crumb.
  const genreCrumb = genreCrumbForFandom(getFandom(genre))
  const accent = GENRE_ACCENT[genre] ?? '#FF5F00'
  const lineGroups = groupByLineAndWave(figures)
  const lineCount = lineGroups.length
  const totalCount = figures.length
  const ebayHref = buildEbaySearchUrl(charName, genreName, '', '', null, EBAY_CAMPAIGN_ID)
  const hubUrl = `${BASE}/${genre}/character/${characterSlug}`
  const pageUrl = `${BASE}${characterHubPath(genre, characterSlug, page)}`

  // Release F: one 96-card window of the display order; belt-and-braces 404
  // on a past-the-end page (the route files check first).
  const ordered = orderedCards(lineGroups)
  const win = pageWindow(ordered, page)
  if (page < 1 || page > win.totalPages) notFound()
  const { totalPages } = win
  const paged = totalPages > 1
  const sections = sectionsForWindow(win.items, win.start)

  // Hero image — prefer figure with an image
  const heroFig = figures.find(f => f.canonical_image_url)
  const heroImage = heroFig?.canonical_image_url ?? null

  // All figure images for strip (up to 6, deduplicated)
  const imageStrip = figures
    .filter(f => f.canonical_image_url)
    .slice(0, 6)
    .map(f => f.canonical_image_url!)

  // JSON-LD: CollectionPage — the cards on THIS page (first 50), positions
  // numbered within the whole list so page 2 starts at 97, not 1.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${charName} Action Figure Guide${page > 1 ? ` (Page ${page} of ${totalPages})` : ''}`,
    description: `All ${charName} ${genreName} figures — real eBay sold prices on each figure's page`,
    url: pageUrl,
    ...(heroImage ? { image: heroImage } : {}),
    mainEntity: {
      '@type': 'ItemList',
      name: `${charName} Figures`,
      numberOfItems: totalCount,
      itemListElement: win.items.slice(0, 50).map((c, i) => ({
        '@type': 'ListItem',
        position: win.start + i + 1,
        url: `${BASE}${prettyFigureUrlFromMap(c.f, counts)}`,
        name: deriveName(c.f),
      })),
    },
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <JsonLd data={jsonLd} />
      <BreadcrumbJsonLd crumbs={[
        { name: 'Home', url: BASE },
        ...(genreCrumb
          ? [{ name: genreCrumb.label, url: `${BASE}/${genreCrumb.slug}` }]
          : []),
        { name: charName, url: hubUrl },
        ...(page > 1 ? [{ name: `Page ${page}`, url: pageUrl }] : []),
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
        /* Card chrome as classes, not inline style objects (same diet as the
           line hub's .line-card — every inline style on a 300-card hub is
           duplicated into the RSC flight; 2026-09-02). */
        .char-card {
          display: block; text-decoration: none; color: var(--text);
          font-size: 0.8125rem; min-width: 0;
        }
        .char-card-mount {
          display: flex; align-items: center; gap: 0.625rem;
          padding: 0.625rem 0.75rem;
          background: var(--s1); border: 1px solid var(--border); border-radius: 8px;
          min-width: 0;
          transition: border-color 0.12s, background 0.12s, transform .35s cubic-bezier(.22,.61,.36,1), box-shadow .35s;
        }
        .char-card__info { flex: 1; min-width: 0; }
        .char-card__name {
          font-weight: 600; line-height: 1.3;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .char-card__exclusive { font-size: 0.65rem; color: ${accent}; margin-top: 1px; opacity: 0.85; }
        .char-card__arrow { flex-shrink: 0; opacity: 0.6; stroke: ${accent}; }
        .fp-thumb__fallback { background: ${accent}22; color: ${accent}; }
        .line-section + .line-section {
          margin-top: 2.5rem;
        }
        /* Pagination (Release F): plain server links, same chrome as the line hub. */
        .line-pagenav {
          display: flex; align-items: center; justify-content: center; flex-wrap: wrap;
          gap: 0.375rem; margin: 2.5rem 0 0; font-size: 0.8125rem;
        }
        .line-pagenav__list { display: flex; gap: 0.25rem; list-style: none; margin: 0; padding: 0; flex-wrap: wrap; }
        .line-pagenav__num, .line-pagenav__btn {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 2.25rem; height: 2.25rem; padding: 0 0.625rem;
          border: 1px solid var(--border); border-radius: 8px;
          background: var(--s1); color: var(--text); text-decoration: none; font-weight: 600;
        }
        .line-pagenav__num:hover, .line-pagenav__btn:hover { border-color: ${accent}55; background: ${accent}0A; }
        .line-pagenav__num--on { background: ${accent}; border-color: ${accent}; color: #fff; }
        .line-pagenav__btn--off { opacity: 0.35; }
        .line-pagenav__gap { display: inline-flex; align-items: center; min-width: 1.5rem; justify-content: center; color: var(--fp-muted); }
        .line-pagenav--top { margin: 0 0 1.5rem; justify-content: flex-start; }
      `}</style>
      <ThumbLoadDelegate />

      <SiteHeader
        crumbs={[
          ...(genreCrumb ? [{ label: genreCrumb.label, href: `/${genreCrumb.slug}` }] : []),
          ...(page > 1
            ? [{ label: charName, href: `/${genre}/character/${characterSlug}` }, { label: `Page ${page}` }]
            : [{ label: charName }]),
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
            {/* Genre pill — same hub-existence gate as the SiteHeader trail and
                BreadcrumbJsonLd above. Rendered `/${genre}` before 2026-07-27,
                a live 404 for the 7 hub-less fandoms. */}
            {genreCrumb && (
              <a
                href={`/${genreCrumb.slug}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: accent, textDecoration: 'none',
                  background: `${accent}15`, border: `1px solid ${accent}30`,
                  borderRadius: '9999px', padding: '0.2rem 0.625rem',
                  marginBottom: '1rem',
                }}
              >
                {genreCrumb.label}
              </a>
            )}

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
              {charName} Figure Guide
            </h1>

            <p style={{ fontSize: '1rem', color: 'var(--fp-muted)', margin: '0 0 1.5rem', maxWidth: 540 }}>
              Every {charName} {genreName} figure — {totalCount.toLocaleString()} release{totalCount !== 1 ? 's' : ''} across{' '}
              {lineCount} line{lineCount !== 1 ? 's' : ''}. Real eBay sold prices on each figure&rsquo;s page.
              {paged && (
                <>
                  {' '}Showing figures {(win.start + 1).toLocaleString()}–{win.end.toLocaleString()} (page {page} of {totalPages}).
                </>
              )}
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
        {paged && <PageNav genre={genre} characterSlug={characterSlug} page={page} totalPages={totalPages} top />}

        {/* Line sections — only the lines (or the part of a line) on this page. */}
        <div>
          {sections.map((sec, lineIdx) => (
            <section
              key={sec.line.lineSlug}
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
                    href={`/${genre}/${sec.line.lineSlug}`}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {sec.line.lineLabel}
                  </a>
                  {sec.continued ? ' (continued)' : ''}
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem', color: 'var(--fp-muted)',
                    marginLeft: 'auto', fontWeight: 500,
                  }}
                >
                  {sec.count !== sec.line.totalFigs
                    ? `${sec.count} of ${sec.line.totalFigs} figures`
                    : `${sec.line.totalFigs} figure${sec.line.totalFigs !== 1 ? 's' : ''}`}
                </span>
              </div>

              {/* Wave groups within line — omit wave header when the whole line is one wave */}
              {sec.waves.map(({ wave, continued, figures: waveFigs }) => (
                <div key={wave.waveKey} style={{ marginBottom: sec.line.waves.length > 1 ? '1.25rem' : 0 }}>
                  {sec.line.waves.length > 1 && (
                    <h3
                      style={{
                        fontSize: '0.8rem', fontWeight: 600, color: 'var(--fp-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        margin: '0 0 0.5rem',
                      }}
                    >
                      {wave.waveLabel}{continued ? ' (continued)' : ''}
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
                      <CharFigureCard key={f.figure_id} figure={f} href={prettyFigureUrlFromMap(f, counts)} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>

        {paged && <PageNav genre={genre} characterSlug={characterSlug} page={page} totalPages={totalPages} />}

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
              funnelDetail={{ target: 'character_hub_cta', character: characterSlug }}
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
          FigurePinner may earn a commission from eBay purchases. Prices shown on each figure&rsquo;s page are based on recent sold listings.
        </p>
      </main>
    </div>
  )
}

// ─── Pagination nav ───────────────────────────────────────────────────────────

function PageNav({ genre, characterSlug, page, totalPages, top = false }: {
  genre: string; characterSlug: string; page: number; totalPages: number; top?: boolean
}) {
  const items = pageNavItems(page, totalPages)
  const prevHref = page > 1 ? characterHubPath(genre, characterSlug, page - 1) : null
  const nextHref = page < totalPages ? characterHubPath(genre, characterSlug, page + 1) : null
  return (
    <nav aria-label={top ? 'Pagination (top)' : 'Pagination'} className={`line-pagenav${top ? ' line-pagenav--top' : ''}`}>
      {prevHref
        ? <a href={prevHref} rel="prev" className="line-pagenav__btn">← Previous</a>
        : <span className="line-pagenav__btn line-pagenav__btn--off" aria-disabled="true">← Previous</span>}
      <ol className="line-pagenav__list">
        {items.map((p, i) => p === null
          ? <li key={`gap-${i}`} className="line-pagenav__gap" aria-hidden="true">…</li>
          : (
            <li key={p}>
              {p === page
                ? <span className="line-pagenav__num line-pagenav__num--on" aria-current="page">{p}</span>
                : <a href={characterHubPath(genre, characterSlug, p)} className="line-pagenav__num" aria-label={`Page ${p}`}>{p}</a>}
            </li>
          ))}
      </ol>
      {nextHref
        ? <a href={nextHref} rel="next" className="line-pagenav__btn">Next →</a>
        : <span className="line-pagenav__btn line-pagenav__btn--off" aria-disabled="true">Next →</span>}
    </nav>
  )
}

// ─── Figure card ──────────────────────────────────────────────────────────────

// Classes instead of inline styles + FigureThumbStatic instead of the per-card
// client FigureThumb (see the <style> block; 2026-09-02 hub markup diet).
// Accent colours come from the page's <style> block, so no accent prop.
async function CharFigureCard({ figure: f, href }: { figure: KBFigure; href: string }) {
  const name = deriveName(f)
  const exclusive =
    f.exclusive_to && f.exclusive_to !== 'None' ? f.exclusive_to : null

  return (
    <QuickLookAnchor
      href={href}
      className="char-card"
      image={thumb(f.canonical_image_url, 640)}
      name={name}
      sub={exclusive}
      figureId={f.figure_id}
    >
      {/* Visual chrome + hover lift/tilt/glow live here, not on the anchor
          above — see the .char-card-mount comment in the <style> block. */}
      <div className="char-card-mount">
        <FigureThumbStatic image={f.canonical_image_url} cdnWidth={96} />
        <div className="char-card__info">
          <div className="char-card__name">{name}</div>
          {exclusive && <div className="char-card__exclusive">{exclusive}</div>}
        </div>
        <svg className="char-card__arrow" width="10" height="10" viewBox="0 0 12 12" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6h8M6 2l4 4-4 4" />
        </svg>
      </div>
    </QuickLookAnchor>
  )
}
