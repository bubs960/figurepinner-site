import { getAllFandoms, getFiguresByFandom } from '@/data/kbLite'
import { lastContentDate } from '@/data/enrichmentDates'
import { sitemapIndexXml, type SitemapIndexEntry } from '@/lib/sitemapIndex'

// Served publicly as /sitemap.xml via a beforeFiles rewrite (next.config.ts).
// The handler cannot live at app/sitemap.xml/route.ts: the metadata route
// app/sitemap.ts claims that URL in dev (shadowing the handler with an empty
// <urlset> — the default export runs with an undefined id) while prod 404s
// it. The rewrite runs before filesystem routing, so both environments
// deterministically serve this index at the well-known URL.

// Build-time static: the child list derives from the build-time KB, exactly
// like sitemap.ts generateSitemaps — it cannot change between deploys.
export const dynamic = 'force-static'

/**
 * Per-child <lastmod>: newest lastContentDate (comp change or enrichment
 * pour) among the fandom's figures — the same predicate the child sitemap
 * stamps its own entries with, computed build-time-static like everything
 * else here. The static child has no per-entity dates and omits lastmod
 * (never fabricate `now` — see sitemapIndex.ts).
 */
async function fandomLastmod(fandom: string): Promise<Date | null> {
  let newest: Date | null = null
  for (const f of await getFiguresByFandom(fandom)) {
    const d = lastContentDate(f.figure_id)
    if (d && (!newest || d > newest)) newest = d
  }
  return newest
}

export async function GET(): Promise<Response> {
  const entries: SitemapIndexEntry[] = [
    { id: 'static' },
    ...await Promise.all(getAllFandoms().map(async fandom => ({ id: fandom, lastmod: await fandomLastmod(fandom) }))),
  ]
  return new Response(sitemapIndexXml(entries), {
    headers: { 'Content-Type': 'application/xml' },
  })
}
