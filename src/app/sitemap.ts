import type { MetadataRoute } from 'next'
import { getAllFandoms, getFiguresByFandom, prettyFigureUrl } from '@/data/kb'
import { genreSlugForFandom as fandomToGenre, hubGenreForFandom } from '@/lib/genreFigures'
import { ARTICLES } from '@/app/guides/_data/articles'
import { isAtOrAboveIndexBar, censusLastCompDate } from '@/data/indexValueCensus'

// Fandom slug (KB value) → genre slug (URL path segment used by the router).
// The character hub page at /[genre]/character/[slug] resolves genre → fandom
// via lib/genreFigures.ts (SLUG_TO_FANDOM); this is its inverse, so the
// sitemap uses the same genre slugs its own submitted URLs resolve to.

const BASE = 'https://figurepinner.com'
const STATIC_ID = 'static'

/**
 * Sitemap — generated at build time from the KB.
 *
 * Split into one child per fandom (D3, hygiene plan 2026-07-02) instead of a
 * single ~32.8K-URL/6.6MB file: each fandom's figure/line/character pages are
 * a self-contained chunk a crawler can re-fetch on its own schedule, instead
 * of re-downloading everything to catch one changed fandom.
 *
 * lastModified honesty (D3): guide pages use their real `a.updated` date;
 * figure pages use `censusLastCompDate`; and as of 2026-07-27 line, character
 * and genre hubs use the newest such date among the figures they contain
 * (`maxCensusDate` below).
 *
 * This docblock previously stated that no per-entity freshness field existed
 * anywhere in KBFigure or the build pipeline, so everything but guides had to
 * stamp `now`. That was true when written and stopped being true when
 * `censusLastCompDate` landed — figure pages were migrated to it, the hub
 * routes were simply never revisited, and this paragraph kept asserting the
 * old premise. Corrected rather than deleted, because "the comment outlived
 * the constraint it described" is the failure worth remembering.
 *
 * Only the 9 hand-listed STATIC_PAGES and the /guides index still stamp `now`:
 * those genuinely have no per-entity freshness source, and inventing a date for
 * /privacy would be the same fabrication in the other direction.
 */
// Safety net, not a behavior change today: with no revalidate/dynamic export
// this route is static until the next deploy anyway (fine at 2-3 deploys/day
// per current cadence) — this just makes that explicit and bounds staleness
// if deploy frequency ever drops (WEBAUDIT-FINAL-CYCLE-PLAN-2026-07-12.md §4
// tail).
export const revalidate = 86400

/**
 * Newest real last-comp-change date among a group of figures, or null when none
 * of them carries a census entry. The hub-route counterpart to the per-figure
 * `censusLastCompDate` used below.
 *
 * Why this exists (measured, 2026-07-27, not theorised): every hub URL was
 * stamping a fresh build timestamp on every deploy, which is the exact signal
 * the figure-page comment below already warns teaches Google to distrust and
 * lazily recrawl our lastmod. Observed consequence in GSC the same day —
 * Google had not re-read 10 of the 23 fandom sitemaps since Jul 2 (star-wars
 * 6,028 pages, transformers 2,589, masters-of-the-universe 2,033), and had not
 * crawled /wrestling/deluxe-aggression since Jun 30, 27 days. The hub routes
 * are precisely the ones that were still fabricating freshness.
 *
 * A hub is "modified" when something it lists changed, so max() is the honest
 * aggregate: it moves when a member figure gets new comp data and holds still
 * otherwise. Falls back to `now` at the call sites only when no member has a
 * census entry at all (small/below-bar lines), which is the same
 * fall-back-rather-than-invent rule the figure pages use.
 */
function maxCensusDate(figureIds: Iterable<string>): Date | null {
  let newest: Date | null = null
  for (const id of figureIds) {
    const d = censusLastCompDate(id)
    if (d && (!newest || d > newest)) newest = d
  }
  return newest
}

export async function generateSitemaps(): Promise<{ id: string }[]> {
  return [{ id: STATIC_ID }, ...getAllFandoms().map(fandom => ({ id: fandom }))]
}

export default function sitemap({ id }: { id: string }): MetadataRoute.Sitemap {
  const now = new Date()

  if (id === STATIC_ID) {
    return staticSitemap(now)
  }
  return fandomSitemap(id, now)
}

function staticSitemap(now: Date): MetadataRoute.Sitemap {
  // To add a new static page: append an entry to this array.
  // changeFrequency: 'always'|'hourly'|'daily'|'weekly'|'monthly'|'yearly'|'never'
  // priority: 0.0 – 1.0 (1.0 = most important)
  const STATIC_PAGES: Array<{
    path: string
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    priority: number
  }> = [
    { path: '',          changeFrequency: 'weekly',  priority: 1.0 },
    { path: '/search',   changeFrequency: 'weekly',  priority: 0.9 },
    // /today — Daily Grail Spotlight (W3): content changes daily, so 'daily'
    // is honest here (unlike most of this file's 'weekly'/'monthly' entries).
    // Dated archive URLs (/today/YYYY-MM-DD) are deliberately NOT enumerated
    // here — they self-canonicalize to their figure page, not to themselves,
    // so they're discovered via internal links (the permalink on /today
    // itself) rather than sitemap-listed as if each were primary content.
    { path: '/today',    changeFrequency: 'daily',  priority: 0.85 },
    // /news removed from sitemap 2026-06-25 (Steve: "we don't have news"); the
    // public route is deleted and now 404s (clean de-index, no redirect).
    // /pro removed from sitemap 2026-06-06 (Steve): Pro tier disabled until
    // GrailPulse has ≥3 verticals; /pro now redirects to home. Re-add when restored.
    { path: '/about',    changeFrequency: 'monthly', priority: 0.6 },
    // /methodology + /scan added S52: both fully-built public pages that were
    // simply missing here (methodology is footer+header-linked; scan had no
    // links at all until S52).
    { path: '/methodology', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/scan',        changeFrequency: 'monthly', priority: 0.5 },
    // /whatnot added 2026-08-07: fully built (invite CTA + 9 featured sellers)
    // but had no footer link and no sitemap entry — pure orphan since S52.
    { path: '/whatnot',     changeFrequency: 'weekly',  priority: 0.5 },
    { path: '/privacy',  changeFrequency: 'yearly',  priority: 0.2 },
    { path: '/terms',    changeFrequency: 'yearly',  priority: 0.2 },
  ]

  const staticPages: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))

  const guidesIndex: MetadataRoute.Sitemap = [{
    url: `${BASE}/guides`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }, {
    // Static route, not an ARTICLES entry — seasonal RWB hub (rwb-jul4 campaign)
    url: `${BASE}/guides/red-white-blue`,
    lastModified: new Date('2026-07-03'),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }]

  // Derive from ARTICLES — the actually-rendered guide set — not the BACKLOG idea
  // tracker. Prevents a published article (e.g. the Bid Check pages) from silently
  // missing the sitemap because no one flipped a backlog status flag.
  const guidePages: MetadataRoute.Sitemap = ARTICLES.map(a => ({
    url: `${BASE}/guides/${a.slug}`,
    lastModified: a.updated ? new Date(a.updated) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // Only emit genre hubs that actually exist. This used to map EVERY KB fandom
  // through fandomToGenre() with no existence check, so 7 of 22 genre entries
  // (32%) were live 404s in the sitemap Google reads: the 3 fandoms with no hub
  // at all (generic-fantasy, pop-culture, scifi) plus the 4 NECA-family ones
  // (horror, aliens-predator, terminator, robocop), whose rollup had only ever
  // been built in the genre->fandom direction. hubGenreForFandom() is that
  // missing inverse; it returns 'neca' for the NECA family and null for
  // hub-less fandoms. Deduped because the 4 NECA fandoms now collapse to one
  // URL. Figure/line/character pages under those fandoms are unaffected — they
  // resolve 200 and live in the per-fandom sitemap children, not here.
  // Newest member-figure comp date per genre hub. Accumulated ACROSS fandoms
  // rather than per-fandom because a hub slug can aggregate several (the 4
  // NECA-family fandoms all roll up to /neca) — taking one fandom's date would
  // under-report the hub's real freshness.
  const genreNewest = new Map<string, Date>()
  for (const fandom of getAllFandoms()) {
    const slug = hubGenreForFandom(fandom)
    if (slug === null) continue
    if (!genreNewest.has(slug)) genreNewest.set(slug, new Date(0))
    // is_canary fids excluded — Data Defense Layer 3, see kbTypes.ts.
    const d = maxCensusDate(
      getFiguresByFandom(fandom).filter(f => !f.is_canary).map(f => f.figure_id),
    )
    if (d && d > genreNewest.get(slug)!) genreNewest.set(slug, d)
  }

  const genrePages: MetadataRoute.Sitemap = [...genreNewest].map(([slug, newest]) => ({
    url: `${BASE}/${slug}`,
    lastModified: newest.getTime() === 0 ? now : newest,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  return [...staticPages, ...guidesIndex, ...guidePages, ...genrePages]
}

function fandomSitemap(fandom: string, now: Date): MetadataRoute.Sitemap {
  // is_canary fids excluded entirely — Data Defense Layer 3 (2026-08-07): they
  // must never appear in a line hub, character hub, or figure-page sitemap
  // entry. See kbTypes.ts.
  const figs = getFiguresByFandom(fandom).filter(f => !f.is_canary)
  const genre = fandomToGenre(fandom)

  // Group member figures once, then reuse for both hub types below. Keyed
  // insertion order reproduces the previous `[...new Set(figs.map(...))]`
  // exactly, so the emitted URL set and its order are unchanged — only
  // lastModified moves.
  const lineFids = new Map<string, string[]>()
  const charFids = new Map<string, string[]>()
  const pushTo = (m: Map<string, string[]>, key: string, fid: string) => {
    const bucket = m.get(key)
    if (bucket) bucket.push(fid)
    else m.set(key, [fid])
  }
  for (const f of figs) {
    pushTo(lineFids, f.product_line, f.figure_id)
    pushTo(charFids, f.character_canonical, f.figure_id)
  }

  // ── Line hub pages (/[genre]/[line]) ────────────────────────────────────
  const linePages: MetadataRoute.Sitemap = [...lineFids].map(([line, fids]) => ({
    url: `${BASE}/${genre}/${line}`,
    lastModified: maxCensusDate(fids) ?? now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // ── Character hub pages (/[genre]/character/[character_slug]) ───────────
  // One page per unique character_canonical within the fandom. High-value SEO
  // pages: "[Character] action figure" queries.
  const characterPages: MetadataRoute.Sitemap = [...charFids].map(([char, fids]) => ({
    url: `${BASE}/${genre}/character/${char}`,
    lastModified: maxCensusDate(fids) ?? now,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }))

  // ── Figure detail pages ──────────────────────────────────────────────────
  // Use keyword-rich pretty URLs only when they map to one exact figure.
  // Ambiguous character/line paths stay on /figure/[id] so one wave cannot
  // canonicalize or sitemap as another wave.
  //
  // INDEXING PROGRAM Part B (2026-07-18): below-index-bar figures (0 sold
  // comps, per matcher's value census) are excluded here entirely — they stay
  // live and crawlable via internal links, just not submitted for indexing.
  // This MUST stay in lockstep with the page's own `hasConfirmedZeroSoldData`
  // noindex flag (figure/[figure_id]/page.tsx and [genre]/[line]/[slug]/page.tsx
  // both apply the identical soldCount===0 test) — submitting a noindexed page
  // in the sitemap is exactly the mixed signal that wastes crawl budget.
  // `isAtOrAboveIndexBar` also honors the one Bing-protection exemption (a
  // below-bar page with real measured external referral traffic).
  const seenUrls = new Set<string>()
  const figurePages: MetadataRoute.Sitemap = []
  for (const f of figs) {
    if (!isAtOrAboveIndexBar(f.figure_id)) continue
    const url = `${BASE}${prettyFigureUrl(f)}`
    if (!seenUrls.has(url)) {
      seenUrls.add(url)
      // Honest lastmod: the real last-comp-change date when the census has
      // one, never a fabricated `now` (D3/R8 — a flat build-timestamp on
      // every URL teaches Google to distrust and lazily recrawl our lastmod).
      // The lone Bing-protected exempt fid has no census entry (0 comps) so
      // falls back to `now` here same as before this change — one page, not
      // worth a fabricated placeholder date either.
      figurePages.push({
        url,
        lastModified: censusLastCompDate(f.figure_id) ?? now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })
    }
  }

  return [...linePages, ...characterPages, ...figurePages]
}
