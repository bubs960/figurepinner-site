import { getAllFandoms } from '@/data/kb'
import { sitemapIndexXml } from '@/lib/sitemapIndex'

// Served publicly as /sitemap.xml via a beforeFiles rewrite (next.config.ts).
// The handler cannot live at app/sitemap.xml/route.ts: the metadata route
// app/sitemap.ts claims that URL in dev (shadowing the handler with an empty
// <urlset> — the default export runs with an undefined id) while prod 404s
// it. The rewrite runs before filesystem routing, so both environments
// deterministically serve this index at the well-known URL.

// Build-time static: the child list derives from the build-time KB, exactly
// like sitemap.ts generateSitemaps — it cannot change between deploys.
export const dynamic = 'force-static'

export async function GET(): Promise<Response> {
  return new Response(sitemapIndexXml(['static', ...getAllFandoms()]), {
    headers: { 'Content-Type': 'application/xml' },
  })
}
