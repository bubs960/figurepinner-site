import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const revalidate = 3600

export interface DealResult {
  figure_id: string
  name: string
  fandom: string
  brand: string
  line: string
  image_url: string | null
  avg_base: number
  avg_recent: number
  drop_pct: number
  cnt_recent: number
}

const SQL = `
WITH recent AS (
  SELECT figure_id_v2, AVG(price) as avg_recent, COUNT(*) as cnt_recent
  FROM listings
  WHERE type='sold' AND figure_id_v2 IS NOT NULL AND confidence_v2>=0.65
    AND quarantined=0 AND captured_at >= datetime('now','-14 days')
  GROUP BY figure_id_v2 HAVING cnt_recent >= 2
),
baseline AS (
  SELECT figure_id_v2, AVG(price) as avg_base, COUNT(*) as cnt_base
  FROM listings
  WHERE type='sold' AND figure_id_v2 IS NOT NULL AND confidence_v2>=0.65 AND quarantined=0
  GROUP BY figure_id_v2 HAVING cnt_base >= 5
)
SELECT
  r.figure_id_v2 as figure_id,
  f.name, f.fandom, f.brand, f.line,
  CASE WHEN f.image_url IN ('NOT_FOUND','') THEN NULL ELSE f.image_url END as image_url,
  ROUND(b.avg_base, 2) as avg_base,
  ROUND(r.avg_recent, 2) as avg_recent,
  ROUND((b.avg_base - r.avg_recent) / b.avg_base * 100, 1) as drop_pct,
  r.cnt_recent
FROM recent r
JOIN baseline b ON b.figure_id_v2 = r.figure_id_v2
JOIN figures_v2 f ON f.id = r.figure_id_v2
WHERE r.avg_recent < b.avg_base * 0.82
  AND b.avg_base > 18
  AND f.name IS NOT NULL
ORDER BY drop_pct DESC
LIMIT 50
`

export async function GET() {
  try {
    const { env } = await getCloudflareContext()
    const db = (env as Record<string, unknown>).LISTINGS_DB as D1Database | undefined
    if (!db) {
      return NextResponse.json({ error: 'LISTINGS_DB not bound' }, { status: 503 })
    }
    const { results } = await db.prepare(SQL).all<DealResult>()
    return NextResponse.json(
      { deals: results ?? [], generated_at: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } }
    )
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
