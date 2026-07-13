import type { MetadataRoute } from 'next'
import { getAllFandoms, getFiguresByFandom, prettyFigureUrl } from '@/data/kb'
import { genreSlugForFandom as fandomToGenre } from '@/lib/genreFigures'
import { ARTICLES } from '@/app/guides/_data/articles'

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
 * lastModified honesty (D3): guide pages already use their real `a.updated`
 * date. Static/genre/line/character/figure pages have NO per-entity freshness
 * field anywhere in KBFigure or the build pipeline — there is no
 * enrichment/price-refresh timestamp to read. Rather than fabricate one,
 * these still stamp `now` (same behavior as before the split). Closing the
 * "everything changed today" signal for real requires the KB to start
 * carrying a per-figure last-updated field — flagged to matcher, not solved
 * here.
 */
// Safety net, not a behavior change today: with no revalidate/dynamic export
// this route is static until the next deploy anyway (fine at 2-3 deploys/day
// per current cadence) — this just makes that explicit and bounds staleness
// if deploy frequency ever drops (WEBAUDIT-FINAL-CYCLE-PLAN-2026-07-12.md §4
// tail).
export const revalidate = 86400

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

  const genrePages: MetadataRoute.Sitemap = getAllFandoms().map(fandom => ({
    url: `${BASE}/${fandomToGenre(fandom)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  return [...staticPages, ...guidesIndex, ...guidePages, ...genrePages]
}

function fandomSitemap(fandom: string, now: Date): MetadataRoute.Sitemap {
  const figs = getFiguresByFandom(fandom)
  const genre = fandomToGenre(fandom)

  // ── Line hub pages (/[genre]/[line]) ────────────────────────────────────
  const lines = [...new Set(figs.map(f => f.product_line))]
  const linePages: MetadataRoute.Sitemap = lines.map(line => ({
    url: `${BASE}/${genre}/${line}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // ── Character hub pages (/[genre]/character/[character_slug]) ───────────
  // One page per unique character_canonical within the fandom. High-value SEO
  // pages: "[Character] action figure" queries.
  const chars = [...new Set(figs.map(f => f.character_canonical))]
  const characterPages: MetadataRoute.Sitemap = chars.map(char => ({
    url: `${BASE}/${genre}/character/${char}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }))

  // ── Figure detail pages ──────────────────────────────────────────────────
  // Use keyword-rich pretty URLs only when they map to one exact figure.
  // Ambiguous character/line paths stay on /figure/[id] so one wave cannot
  // canonicalize or sitemap as another wave.
  const seenUrls = new Set<string>()
  const figurePages: MetadataRoute.Sitemap = []
  for (const f of figs) {
    const url = `${BASE}${prettyFigureUrl(f)}`
    if (!seenUrls.has(url)) {
      seenUrls.add(url)
      figurePages.push({
        url,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })
    }
  }

  return [...linePages, ...characterPages, ...figurePages]
}
