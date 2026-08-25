/**
 * Line hub page — /[genre]/[line]
 * e.g. /wrestling/wwe-elite  or  /wrestling/elite
 *
 * SEO purpose: ranks for "[Line Name] price guide" queries.
 * Shows all figures in the line grouped by series/wave, links to /figure/[id].
 * No external pricing fetched — KB data only. Fast, cacheable, crawlable.
 *
 * Sits alongside [genre]/[line]/[slug]/page.tsx (3-level pretty URL alias).
 * Next.js resolves them cleanly: 2-segment → this page, 3-segment → alias.
 */

import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getFiguresByLine, getFiguresByFandom, getAllFandoms, deriveName, figureUrl, prettyFigureUrl, hasUniquePrettyFigureUrl, titleCaseValue, type KBFigure } from '@/data/kb'
import { lineHubMeetsIndexBar } from '@/data/indexValueCensus'
import { fandomsForGenre, genreSlugForFandom, getFandom, genreCrumbForFandom } from '@/lib/genreFigures'
import { prettifySlug, buildEbaySearchUrl, EBAY_CAMPAIGN_ID } from '@/app/figure/[figure_id]/_lib/figureFormatters'
import { enrichedDescription } from '@/app/figure/[figure_id]/_lib/enrichedCopy'
import INDEX_VALUE_CENSUS from '@/data/index-value-census.json'
import AdSlot from '@/app/components/AdSlot'
import TrackedLink from '@/app/components/TrackedLink'
import FigureThumb from '@/app/components/FigureThumb'
import SiteHeader from '@/app/components/SiteHeader'
import BreadcrumbJsonLd from '@/app/_components/BreadcrumbJsonLd'
import JsonLd from '@/app/_components/JsonLd'

// ISR — KB-only line hub, no user-specific data. "Fast, cacheable, crawlable"
// (header above) requires this. Was force-dynamic; restored per Genta audit 2026-06-06 P1.
// force-static added 2026-07-27 (hub-ISR root cause): on a dynamic segment,
// `revalidate` alone never registers the route in the prerender-manifest, so
// OpenNext served every line hub as uncached SSR (`no-store`) since 6/14.
// See [genre]/page.tsx for the full mechanism note; same fix, same pair.
export const dynamic = 'force-static'
export const revalidate = 3600

// ─── Genre config (accent colors) ─────────────────────────────────────────────

const GENRE_ACCENT: Record<string, string> = {
  'wrestling':                  '#e53238',
  'marvel':                     '#e23636',
  'star-wars':                  '#3d7bca',
  'dc':                         '#3a6fbf',
  'transformers':               '#c44f0e',
  'gijoe':                      '#3d7a3d',
  'masters-of-the-universe':    '#8b2be2',
  'teenage-mutant-ninja-turtles': '#3d7a3d',
  'power-rangers':              '#c43d3d',
  'indiana-jones':              '#8b6914',
  'ghostbusters':               '#c4941c',
  'mythic-legions':             '#546e7a',
  'thundercats':                '#c44f0e',
  'action-force':               '#3a6fbf',
  'dungeons-dragons':           '#7b2be2',
  'neca':                       '#37474f',
  'spawn':                      '#212121',
  'ufc':                        '#141414',
}

// ─── Editorial intros for high-priority lines ─────────────────────────────────
// Injected below the hero stats on matching line pages.
// Key format: "kb_fandom/kb_product_line" (canonical KB values, not URL slugs).
const LINE_INTROS: Record<string, string> = {
  'marvel-comics/marvel-legends': "Hasbro's Marvel Legends has been the dominant 6-inch Marvel line since 2012, with over 1,600 figures spanning every corner of the comics and MCU. Value is character-driven: first appearances, short-packed variants, and Walmart/Target exclusives regularly trade at 3-5x retail years after release. The Build-A-Figure (BAF) system means incomplete sets -- missing the BAF piece -- sell at a meaningful discount, so completeness matters here more than almost any other line.",
  'wrestling/elite': "Mattel WWE Elite is the current gold standard for modern wrestling figures, running since 2010 with near-weekly restocks at major retail. Most singles retail at $22-30 and settle near retail used -- the floor is low and reliable. What breaks out: first-run legends, store exclusives (Target Elite, Walgreens), short-packed chase variants, and retired figures of wrestlers who've since passed. Early series (1-20) command premiums on the secondary market.",
  'star-wars/black-series': "Hasbro's 6-inch Black Series launched in 2013 and is now the collector-tier standard for Star Wars figures. The line splits cleanly between pegwarmers and scarce exclusives -- Fan Channel and convention-exclusive figures routinely hit 2-4x retail. Orange-card early series figures (2013-2015) are the most collectible; the Archive sub-line reissues fan favorites, which suppresses value on those characters. Condition on original-card figures matters significantly for resale.",
  'transformers/masterpiece': "Takara's Masterpiece line is the prestige tier of Transformers collecting -- highly accurate screen-scale figures with die-cast parts and tight transformation engineering. Most releases are import-only from Japan, with US releases (licensed through Hasbro) running 12-18 months later at lower price points. Discontinued MP numbers climb steadily; MP-10 Optimus and MP-36 Megatron are the benchmark grails. Reissues are common for popular entries and will reset value on those molds.",
  'horror/neca-ultimate': "NECA's Ultimate line packs the definitive version of each horror and film character -- multiple head sculpts, swappable hands, full accessory sets -- in a single premium release. Horror IP scarcity drives this market: Leatherface, Pennywise, and Universal Monster entries go out of print without warning and spike hard. Opened but complete figures trade at 60-75% of sealed; missing accessories (especially small items like weapons) cuts value more than condition.",
  'tmnt/neca': "NECA's TMNT line covers the full Teenage Mutant Ninja Turtles catalog with 7-inch figures based on the original cartoon, movie, and Mirage comic designs. The cartoon-accurate figures from the first waves are the most sought-after; Mirage comic variants appeal to a smaller but dedicated collector base. Like all NECA lines, production runs are finite -- figures don't get indefinite shelf life, which creates genuine scarcity within 1-2 years of release.",
}

// URL slug → KB fandom remap + NECA rollup: single source of truth is
// lib/genreFigures.ts (S20 fix, 2026-06-11, consolidated S52+1 — this page
// used to carry its own copy, which is how every line link from /marvel,
// /gijoe, and /teenage-mutant-ninja-turtles genre pages 404'd before S20).

function figuresForLine(genre: string, line: string): KBFigure[] {
  return fandomsForGenre(genre).flatMap(f => getFiguresByLine(f, line))
}

/**
 * Legacy/typo slug resolver (S20, 2026-06-11). Years of hardcoded line links
 * (homepage GenreTaxonomy, old guides, anything Google indexed) used slugs
 * that don't match KB product_line values — e.g. /dc/dc-multiverse for the
 * KB's "multiverse", /wrestling/hasbro-wwf for "wwf-hasbro". When the exact
 * lookup misses, try two conservative transforms and 301 to the canonical URL
 * if exactly one real line matches:
 *  1. token permutation: same hyphen tokens, any order (hasbro-wwf → wwf-hasbro)
 *  2. strip leading/trailing genre tokens (dc-multiverse → multiverse,
 *     super7-thundercats → super7)
 * Anything still ambiguous or unmatched stays a 404 — no guessing.
 */
function resolveLineAlias(genre: string, line: string): string | null {
  const norm = line.toLowerCase().trim()
  const lines = new Set<string>()
  for (const fandom of fandomsForGenre(genre)) {
    for (const f of getFiguresByFandom(fandom)) lines.add(f.product_line)
  }

  // 1. token permutation
  const sortedKey = norm.split('-').sort().join('-')
  const permMatches = [...lines].filter(c => c.split('-').sort().join('-') === sortedKey)
  if (permMatches.length === 1) return permMatches[0]

  // 2. strip genre tokens off the ends
  const genreTokens = new Set([
    genre, ...genre.split('-'),
    ...fandomsForGenre(genre).flatMap(f => [f, ...f.split('-')]),
  ])
  const parts = norm.split('-')
  let start = 0
  let end = parts.length
  while (start < end - 1 && genreTokens.has(parts[start])) start++
  while (end > start + 1 && genreTokens.has(parts[end - 1])) end--
  const core = parts.slice(start, end).join('-')
  if (core !== norm && lines.has(core)) return core

  return null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
// prettifySlug is imported from figureFormatters (shared, override-aware) — the
// old local copy was removed in W2 (2026-06-06) so acronym/brand casing is
// consistent sitewide.

/** Build a display name for the line from the URL slug + first figure's data */
function buildLineDisplayName(lineSlug: string, figures: KBFigure[]): string {
  if (!figures.length) return prettifySlug(lineSlug)
  const f = figures[0]
  const mfr = f.manufacturer
  const pl  = f.product_line
  // If slug is "mfr-pl" form, build "Mfr Pl" display name
  if (lineSlug.toLowerCase() === `${mfr}-${pl}`) {
    return `${prettifySlug(mfr)} ${prettifySlug(pl)}`
  }
  // Otherwise just prettify product_line
  return prettifySlug(pl)
}

// Content-thinness fix (2026-08-25, WEBAUDIT-TO-WEB-TRACKB-CLOSED-NO-GATE):
// webaudit's content audit found small (<=5 member) line hubs without a
// curated LINE_INTROS entry render nothing but an H1, the stat line, wave
// headings, and character links -- zero unique prose, genuinely thin. Ruled
// NOT a duplication defect (so no index-gate change), but real and worth a
// content fix. This targets exactly that population.
const SMALL_LINE_THRESHOLD = 5

// v1 rejected by webaudit's panel review (2026-08-25,
// WEBAUDIT-TO-WEB-SMALL-LINE-CONTENT-VERDICT): it restated manufacturer/
// release-count/wave-count, all of which buildLineDisplayName() already
// bakes into the H1 and the hero subtitle already states in prose a few
// lines above this box -- a real second copy of the same three facts, not
// new information. The fixed "A [X] figure line from [Y] with [N]..."
// skeleton was also flagged as reading as generated-to-have-something-here
// rather than generated-because-it's-useful, even though every clause was
// honestly KB-gated.
//
// v2 (this version) only uses fields NOT shown anywhere else on the page:
// scale (83/85 coverage, near-universal), exclusive_to (29/85, genuinely
// novel -- retailer exclusivity isn't shown elsewhere on a line hub), and
// year (53/85). No fixed opening skeleton -- each present fact is its own
// short sentence, so the SET of sentences varies per line instead of one
// template recognizable across dozens of pages. Returns null (box
// suppressed entirely) when none of the three apply, rather than always
// rendering something -- webaudit measured only 2/85 lines hit that case.
// Real KB data quality gap, found live-testing this fix: `exclusive_to`
// sometimes holds a generic placeholder ("Exclusive", "unspecified",
// "UNRESOLVED", "Limited Edition", "Chase" -- not a retailer/venue name) or
// a value that already contains the word "Exclusive" ("Ring Giants
// Exclusive", "New York Toy Fair Exclusive") -- naively wrapping either in
// "Includes a {X} exclusive release" produced nonsense ("a Exclusive
// exclusive release") or a duplicated word. Returns null (clause omitted)
// for the placeholder case; strips a redundant trailing "Exclusive" for the
// duplication case.
const GENERIC_EXCLUSIVE_VALUES = new Set(['exclusive', 'unspecified', 'unresolved', 'limited edition', 'chase'])
function cleanExclusiveToValue(raw: string): string | null {
  if (GENERIC_EXCLUSIVE_VALUES.has(raw.trim().toLowerCase())) return null
  const stripped = raw.trim().replace(/\s+exclusive$/i, '').trim()
  if (!stripped || GENERIC_EXCLUSIVE_VALUES.has(stripped.toLowerCase())) return null
  return stripped
}

function autoLineContext(figures: KBFigure[]): string | null {
  const sentences: string[] = []

  const scales = [...new Set(figures.map(f => f.scale).filter((s): s is string => !!s && s !== 'None'))]
  if (scales.length === 1) {
    // Raw KB values look like "6in"/"3.75in" -- light regex prose fix, same
    // spirit as titleCaseValue's raw-slug cleanup elsewhere in this file.
    // Non-numeric values ("keychain", "Mini") pass through titleCaseValue.
    const raw = scales[0]
    const pretty = /^\d/.test(raw) ? raw.replace(/^(\d+(?:\.\d+)?)in\b/i, '$1-inch') : titleCaseValue(raw)
    sentences.push(`${pretty} scale figures.`)
  }

  const exclusives = [...new Set(
    figures.map(f => f.exclusive_to)
      .filter((e): e is string => !!e && e !== 'None')
      .map(cleanExclusiveToValue)
      .filter((e): e is string => e !== null)
  )]
  if (exclusives.length === 1) {
    const pretty = titleCaseValue(exclusives[0])
    const article = /^[aeiou]/i.test(pretty) ? 'an' : 'a'
    sentences.push(`Includes ${article} ${pretty} exclusive release.`)
  } else if (exclusives.length > 1) {
    sentences.push('Includes retailer-exclusive releases.')
  }

  const years = figures.map(f => f.year).filter((y): y is number => typeof y === 'number')
  if (years.length) {
    const minY = Math.min(...years), maxY = Math.max(...years)
    sentences.push(minY === maxY ? `Released in ${minY}.` : `Released ${minY}–${maxY}.`)
  }

  return sentences.length ? sentences.join(' ') : null
}

/** Group figures by release_wave. Returns sorted array of [wave, figures[]] */
function groupByWave(figures: KBFigure[]): Array<{ wave: string; label: string; figures: KBFigure[] }> {
  const map = new Map<string, KBFigure[]>()
  for (const f of figures) {
    const w = f.release_wave || 'Unknown'
    if (!map.has(w)) map.set(w, [])
    map.get(w)!.push(f)
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      const na = parseInt(a), nb = parseInt(b)
      if (!isNaN(na) && !isNaN(nb)) return na - nb
      return a.localeCompare(b)
    })
    .map(([wave, figs]) => ({
      wave,
      label: wave === 'Unknown' ? 'Other' : isNaN(parseInt(wave)) ? wave : `Series ${wave}`,
      figures: figs.sort((a, b) =>
        a.character_canonical.localeCompare(b.character_canonical)
      ),
    }))
}

// ─── P2 Item 3 — "Featured from this line" (webaudit-approved 2026-07-24,
// WEBAUDIT-TO-WEB-P2-P3-SCOPING-AUDIT-VERDICT / WEBAUDIT-TO-WEB-OMNIBUS-VERDICT) ──
//
// Reuses the drip-priority ranking (scripts/gen-drip-priority-list.mjs)
// restricted to this line, per the approved spec. Mirrored rather than
// imported: that script runs offline via a Node ts-loader against the full
// KB; this needs the exact same signals inside the page's server-render
// path. Keep both in sync if the ranking signals change.
//
// Naming is fixed as "Featured from this line", NOT "most valuable" — v1 has
// no price/demand signal (see that script's PROVISIONAL header), so a value
// claim isn't supportable yet. Caption text lives at the render site below.
const BING_PROTECTED_FIDS = new Set(['fp_wrestling_mattel_basic_ex_mountain-dew-maj_cfec51'])
const isAtOrAboveIndexBar = (fid: string): boolean =>
  Object.prototype.hasOwnProperty.call(INDEX_VALUE_CENSUS, fid) || BING_PROTECTED_FIDS.has(fid)

/** Census values are mixed 'YYYY-MM-DD' and 'YYYY-MM-DD HH:MM:SS'. */
const compDate = (fid: string): string => {
  const v = (INDEX_VALUE_CENSUS as Record<string, string>)[fid]
  return typeof v === 'string' && v.length >= 10 ? v.slice(0, 10) : ''
}

const FEATURED_N = 4
const FEATURED_MIN_LINE_SIZE = 8
const FEATURED_MIN_ELIGIBLE = 4

/** Returns null when the module should not render (line too small, or too
 *  few eligible candidates) -- distinct from an empty array so the caller
 *  can skip the section outright rather than rendering an empty shell. */
function selectFeatured(figures: KBFigure[]): KBFigure[] | null {
  if (figures.length < FEATURED_MIN_LINE_SIZE) return null

  const ranked = figures
    .filter(f => isAtOrAboveIndexBar(f.figure_id) && hasUniquePrettyFigureUrl(f))
    .map(f => {
      const enriched = enrichedDescription(f)
      return {
        figure: f,
        enriched: enriched !== null,
        enrichedLen: enriched ? enriched.length : 0,
        lastComp: compDate(f.figure_id),
        hasImage: !!f.canonical_image_url,
        hasKeyFeatures: !!(f.key_features && String(f.key_features).trim()),
      }
    })

  if (ranked.length < FEATURED_MIN_ELIGIBLE) return null

  ranked.sort((a, b) =>
    Number(b.enriched) - Number(a.enriched) ||             // 1. copy-first
    b.lastComp.localeCompare(a.lastComp) ||                // 2. comp recency
    Number(b.hasImage) - Number(a.hasImage) ||             // 3. complete page
    Number(b.hasKeyFeatures) - Number(a.hasKeyFeatures) || // 4. more content
    b.enrichedLen - a.enrichedLen ||                       // 5. copy depth
    a.figure.figure_id.localeCompare(b.figure.figure_id)   // 6. total order
  )

  return ranked.slice(0, FEATURED_N).map(r => r.figure)
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ genre: string; line: string }> }
): Promise<Metadata> {
  const { genre, line } = await params

  // Genre-alias 308 (2026-07-12 root-cause FIX-2): exactly one slug namespace
  // serves 200 per fandom — /marvel-comics/<line> 308s to /marvel/<line>, etc.
  // Here in generateMetadata (pre-streaming) for a real 308; page body has the
  // fallback copy, same as the resolveLineAlias pattern below.
  const canonicalGenre = genreSlugForFandom(getFandom(genre))
  if (canonicalGenre !== genre) permanentRedirect(`/${canonicalGenre}/${line}`)

  const figures = figuresForLine(genre, line)
  if (!figures.length) {
    // Redirect HERE, not in the page body: generateMetadata runs before the
    // response starts streaming, so this emits a real 308. A redirect thrown
    // after streaming begins degrades to a 200 + <meta http-equiv=refresh>,
    // which Google treats as soft, not permanent.
    const alias = resolveLineAlias(genre, line)
    if (alias) permanentRedirect('/' + genre + '/' + alias)
    return { title: 'Not Found' }
  }

  const lineName  = buildLineDisplayName(line, figures)
  const genreName = prettifySlug(genre)

  // Track A index gate (2026-08-25, webaudit round-2 §2) — LOCKSTEP with
  // sitemap.ts's linePages filter, both call lineHubMeetsIndexBar. Singleton
  // lines only; see that function's own doc for why this is member-count-only,
  // not price-coverage like the character-hub gate.
  const indexWorthy = lineHubMeetsIndexBar(
    figures.filter(f => !f.is_canary).map(f => f.figure_id)
  )

  return {
    // Phase 4 line-hub extension (2026-08-25, WEBAUDIT-EXTERNAL-AUDIT-PLAN-
    // REVISION-ROUND2 §3 pre-check): confirmed this page carries the identical
    // price-copy overclaim character hubs had — title/meta/JSON-LD/H1/paragraph
    // all claimed "real eBay sold prices"/"Price Guide" while the page fetches
    // and renders zero price data (no QuickLookAnchor or equivalent anywhere in
    // this file). Same fix as the character-hub pass: drop the claim, point to
    // each figure's own page instead.
    title: `${lineName} Figure Guide — ${genreName}`,
    description: `Every ${lineName} figure — ${figures.length}+ releases in ${genreName}. See current eBay sold prices on each figure's page.`,
    openGraph: {
      title: `${lineName} Figure Guide | FigurePinner`,
      description: `Every ${lineName} figure — ${figures.length}+ releases. Real eBay sold prices on each figure's page.`,
    },
    alternates: {
      canonical: `https://figurepinner.com/${genre}/${line}`,
    },
    ...(indexWorthy ? {} : { robots: { index: false, follow: true } }),
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LineHubPage(
  { params }: { params: Promise<{ genre: string; line: string }> }
) {
  const { genre, line } = await params

  // Genre-alias 308 fallback (real 308 comes from generateMetadata above).
  const canonicalGenre = genreSlugForFandom(getFandom(genre))
  if (canonicalGenre !== genre) permanentRedirect(`/${canonicalGenre}/${line}`)

  // Guard: genre must map to at least one valid fandom (after remap/rollup)
  const validFandoms = getAllFandoms()
  if (!fandomsForGenre(genre).some(f => validFandoms.includes(f))) notFound()

  const figures = figuresForLine(genre, line)
  if (!figures.length) {
    // Legacy/typo slug? 301 to the canonical line URL instead of dead-ending.
    const alias = resolveLineAlias(genre, line)
    if (alias) permanentRedirect(`/${genre}/${alias}`)
    notFound()
  }

  const lineName    = buildLineDisplayName(line, figures)
  const genreName   = prettifySlug(genre)
  // Crumb target, distinct from genreName (a display string for meta/eBay copy):
  // this route serves 200 for genre segments that have NO hub page — /scifi/
  // neca-godzilla is live while /scifi is a 404 — so the crumb has to ask
  // "does a hub exist" rather than reuse the route param. null => omit.
  const genreCrumb  = genreCrumbForFandom(getFandom(genre))
  const accent      = GENRE_ACCENT[genre] ?? '#FF5F00'
  const waves       = groupByWave(figures)
  const totalCount  = figures.length
  const ebayHref    = buildEbaySearchUrl('', genreName, '', lineName, null, EBAY_CAMPAIGN_ID)

  // Unique characters (for meta)
  const uniqueChars = new Set(figures.map(f => f.character_canonical)).size

  // Editorial intro for priority lines, falling back to a KB-derived context
  // sentence for small lines that would otherwise render zero unique prose
  // (webaudit content-thinness finding, 2026-08-25 -- see autoLineContext).
  const curatedIntro = figures.length
    ? (LINE_INTROS[figures[0].fandom + '/' + figures[0].product_line] ?? null)
    : null
  const lineIntro = curatedIntro
    ?? (totalCount <= SMALL_LINE_THRESHOLD ? autoLineContext(figures) : null)

  const featured = selectFeatured(figures)

  // Sample images for the hero (first 4 figures with images)
  const sampleImages = figures
    .filter(f => f.canonical_image_url)
    .slice(0, 4)
    .map(f => f.canonical_image_url!)

  // JSON-LD: ItemList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${lineName} Figure Guide`,
    description: `All ${totalCount} ${lineName} figures — real eBay sold prices on each figure's page`,
    url: `https://figurepinner.com/${genre}/${line}`,
    mainEntity: {
      '@type': 'ItemList',
      name: `${lineName} Figures`,
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
        ...(genreCrumb
          ? [{ name: genreCrumb.label, url: `https://figurepinner.com/${genreCrumb.slug}` }]
          : []),
        { name: lineName, url: `https://figurepinner.com/${genre}/${line}` },
      ]} />
      {/* Hover styles — server-safe CSS, no client JS needed.
          Lift+tilt+glow promoted from the homepage ShelfCase reference
          pattern (src/app/page.tsx:290, WP2 2026-07-05) — same recipe,
          this line's own accent color instead of gold. No QuickLookAnchor
          on this card, so the transform can live directly on the anchor
          with no popover-positioning risk. */}
      <style>{`
        .line-card:hover {
          border-color: ${accent}55 !important;
          background: ${accent}0A !important;
          transform: translateY(-4px) rotate(-0.6deg);
          box-shadow: 0 14px 22px rgba(0,0,0,.35), 0 0 0 1px ${accent}40, 0 0 16px ${accent}29;
        }
        @media (prefers-reduced-motion: reduce) {
          .line-card:hover { transform: none; }
        }
        /* Character-hub link (P2 distribution) — a sibling of .line-card, not
           nested inside it (the whole card is already one <a>, can't nest a
           second interactive anchor). Hover/focus-reveal to avoid cluttering
           a dense grid. */
        .line-card-wrap { position: relative; }
        .line-card-char-link {
          position: absolute; top: 6px; right: 6px;
          font-size: 0.6rem; font-weight: 600; letter-spacing: 0.02em;
          padding: 2px 7px; border-radius: 999px;
          background: var(--bg); border: 1px solid ${accent}40;
          color: ${accent}; text-decoration: none;
          opacity: 0; transition: opacity 0.15s ease;
          pointer-events: none;
        }
        .line-card-wrap:hover .line-card-char-link,
        .line-card-wrap:focus-within .line-card-char-link {
          opacity: 1; pointer-events: auto;
        }
        @media (prefers-reduced-motion: reduce) {
          .line-card-char-link { transition: none; }
        }
      `}</style>

      <SiteHeader crumbs={[
        ...(genreCrumb ? [{ label: genreCrumb.label, href: `/${genreCrumb.slug}` }] : []),
        { label: lineName },
      ]} />

      {/* ── Hero ── */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1rem, 5vw, 3rem)',
        background: `linear-gradient(135deg, ${accent}08 0%, transparent 60%)`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Breadcrumb genre pill — a THIRD breadcrumb implementation on this
              page (SiteHeader trail and BreadcrumbJsonLd are the other two), so
              it needs the same hub-existence gate. Rendered `/${genre}` before
              2026-07-27, which is a live 404 for the 7 hub-less fandoms. */}
          {genreCrumb && (
            <a href={`/${genreCrumb.slug}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: accent, textDecoration: 'none',
              background: `${accent}15`, border: `1px solid ${accent}30`,
              borderRadius: '9999px', padding: '0.2rem 0.625rem',
              marginBottom: '1rem',
            }}>
              {genreCrumb.label}
            </a>
          )}

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text)',
            margin: '0 0 0.625rem',
          }}>
            {lineName} Figure Guide
          </h1>

          <p style={{ fontSize: '1rem', color: '#EEEEF5', margin: '0 0 1.5rem', maxWidth: 540 }}>
            Every {lineName} figure — {totalCount.toLocaleString()} releases across{' '}
            {waves.length} series, {uniqueChars} unique characters. Real eBay sold prices on
            each figure&rsquo;s page.
          </p>

          {/* Sample image strip */}
          {sampleImages.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {sampleImages.map((url, i) => (
                <FigureThumb key={i} image={url} size={56} radius={8} cdnWidth={120} fallback={{ kind: 'icon', accent }} />
              ))}
              {totalCount > sampleImages.length && (
                <div style={{
                  width: 56, height: 56, borderRadius: 8, flexShrink: 0,
                  background: 'var(--s1)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: '#EEEEF5',
                }}>
                  +{(totalCount - sampleImages.length).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Figures', value: totalCount.toLocaleString() },
              { label: 'Series', value: waves.length.toLocaleString() },
              { label: 'Characters', value: uniqueChars.toLocaleString() },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: accent }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#EEEEF5', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 5vw, 3rem) 5rem' }}>

        {/* Editorial intro (curated) or a short KB-derived context sentence
            for small lines that would otherwise render no unique prose. */}
        {lineIntro && (
          <div style={{
            background: 'var(--s1)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            fontSize: '0.9375rem',
            lineHeight: 1.65,
            color: '#EEEEF5',
          }}>
            <p style={{ margin: 0 }}>{lineIntro}</p>
          </div>
        )}

        {/* P2 Item 3 -- "Featured from this line" (webaudit-approved, static/ISR,
            N=4 hard cap). Adds zero new edges to the link graph -- every figure
            here is already linked from the wave grid below; this only changes
            position, DOM order, and anchor context. See selectFeatured() above. */}
        {featured && (
          <section style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: `2px solid ${accent}22`,
            }}>
              <div style={{
                width: 3, height: '1.125rem', borderRadius: 2,
                background: accent, flexShrink: 0,
              }} />
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.0625rem', fontWeight: 700,
                color: 'var(--text)', margin: 0,
              }}>
                Featured from this line
              </h2>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '0.5rem',
            }}>
              {featured.map(f => (
                <FigureCard key={f.figure_id} figure={f} accent={accent} />
              ))}
            </div>
          </section>
        )}

        {/* Series / wave sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {waves.map(({ wave, label, figures: waveFigs }) => (
            <section key={wave} id={`series-${wave}`}>
              {/* Section header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: `2px solid ${accent}22`,
              }}>
                <div style={{
                  width: 3, height: '1.125rem', borderRadius: 2,
                  background: accent, flexShrink: 0,
                }} />
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.0625rem', fontWeight: 700,
                  color: 'var(--text)', margin: 0,
                }}>
                  {lineName} {label}
                </h2>
                <span style={{ fontSize: '0.72rem', color: '#EEEEF5', marginLeft: 'auto', fontWeight: 500 }}>
                  {waveFigs.length} figure{waveFigs.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Figure grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '0.5rem',
              }}>
                {waveFigs.map(f => (
                  <FigureCard key={f.figure_id} figure={f} accent={accent} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Bottom ad + CTA — the old CTA linked the Chrome Web Store listing,
            which 301s to the CWS homepage (extension was never published).
            Replaced with the free-tracking sign-up path (S20 audit).
            AD STANDARD v2: GRID class, 1 unit, after the last content grid,
            before the closer — this position already matched, swapped the
            dead AdSense rectangle call for the live Adsterra key. */}
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <AdSlot slot="adsterra-banner" />
          <div style={{ marginTop: '2rem' }}>
            <a
              href="/sign-up"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: accent,
                color: '#fff',
                borderRadius: 10,
                fontWeight: 700, fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Track {lineName} Prices Free →
            </a>
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#EEEEF5' }}>
              Vault, wantlist, and price alerts — free, no caps
            </p>
            <TrackedLink
              href={ebayHref}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              funnelEvent="ebay_exit"
              funnelDetail={{ target: 'line_hub_cta', line }}
              style={{
                display: 'inline-block', marginTop: '1rem',
                fontSize: '0.85rem', fontWeight: 600,
                color: accent, textDecoration: 'none',
                borderBottom: `1px solid ${accent}55`,
              }}
            >
              Hunt {lineName} on eBay →
            </TrackedLink>
          </div>
        </div>

        {/* Affiliate disclosure */}
        <p style={{
          marginTop: '2rem', textAlign: 'center',
          fontSize: '0.68rem', color: '#EEEEF5',
        }}>
          FigurePinner may earn a commission from eBay purchases. Prices shown on each figure&rsquo;s page are based on recent sold listings.
        </p>
      </main>

      {/* Footer is rendered globally by the root layout (src/app/layout.tsx). */}
    </div>
  )
}

// ─── Figure Card ──────────────────────────────────────────────────────────────

function FigureCard({ figure: f, accent }: { figure: KBFigure; accent: string }) {
  const charName = f.character_canonical
    .split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const variant = (f.character_variant && f.character_variant !== 'None')
    ? f.character_variant : null
  const exclusive = (f.exclusive_to && f.exclusive_to !== 'None')
    ? f.exclusive_to : null

  return (
    <div className="line-card-wrap">
      <a
        href={prettyFigureUrl(f)}
        className="line-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.625rem 0.75rem',
          background: 'var(--s1)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          textDecoration: 'none',
          color: 'var(--text)',
          fontSize: '0.8125rem',
          transition: 'border-color 0.12s, background 0.12s, transform .35s cubic-bezier(.22,.61,.36,1), box-shadow .35s',
          minWidth: 0,
        }}
      >
        {/* Thumbnail */}
        <FigureThumb image={f.canonical_image_url} size={40} radius={4} cdnWidth={96} fallback={{ kind: 'icon', accent }} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            lineHeight: 1.3,
          }}>
            {charName}
          </div>
          {variant && (
            <div style={{ fontSize: '0.68rem', color: '#EEEEF5', marginTop: 1 }}>
              {variant}
            </div>
          )}
          {exclusive && (
            <div style={{ fontSize: '0.65rem', color: accent, marginTop: 1, opacity: 0.85 }}>
              {exclusive}
            </div>
          )}
        </div>

        {/* Arrow */}
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}>
          <path d="M2 6h8M6 2l4 4-4 4" />
        </svg>
      </a>
      {/* Sibling link to the character hub — see .line-card-char-link above.
          Uses genreSlugForFandom(f.fandom), NOT the route's genre param: on
          NECA-rollup line pages (served under /neca/...) the route param is
          "neca" but each figure's true fandom (and the character hub's own
          canonical URL) is its specific genre (horror, aliens-predator, ...)
          — using the route param would link a self-canonicalized duplicate
          URL for every NECA character (webaudit P2S1 verdict, 2026-07-09). */}
      <a href={`/${genreSlugForFandom(f.fandom)}/character/${f.character_canonical}`} className="line-card-char-link">
        All →
      </a>
    </div>
  )
}
