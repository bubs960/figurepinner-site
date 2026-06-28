import { NextResponse } from 'next/server'

/**
 * GET /api/cache-stats
 *
 * Returns the Worker-level edge cache hit rate for the last 24 hours,
 * queried from Workers Analytics Engine (dataset: fp_edge_cache) via the
 * SQL API.
 *
 * WHY THIS EXISTS (S36 2026-06-19): CF zone "Cache rate %" only measures
 * static assets (JS/CSS/images). HTML pages are served by the Worker and
 * cached via the Cache API — invisible to zone analytics. This endpoint is
 * the ONLY accurate signal for HTML cache health. The CF zone % will always
 * show ~5% and that is correct and expected for a Worker site.
 *
 * S41c (2026-06-22): switched from CF GraphQL `workersAnalyticsEngineAdaptiveGroups`
 * to the CF Analytics Engine SQL API. The original GraphQL query was returning
 * silent zeros for 24h+ because the schema fields were guessed: `sum_count_DESC`,
 * `sum { count }`, `dimensions { index1 }`, `index1` (top-level) were all rejected
 * one after another. The SQL API uses documented column names — index1,
 * _sample_interval, timestamp — and is what CF actually recommends for ad-hoc
 * analytics queries.
 *
 * SECURITY: requires CF_ACCOUNT_ID + CF_API_TOKEN env vars (set via
 * `wrangler secret put`). Returns 503 if not configured. The CF API token
 * needs "Account Analytics: Read" permission.
 *
 * Response shape:
 * {
 *   window: "24h",
 *   hit: number,       // count of HIT responses
 *   miss: number,      // count of MISS responses
 *   bypass: number,    // count of BYPASS responses
 *   total: number,
 *   hit_pct: number,   // hit / (hit + miss) * 100 — excludes BYPASS (RSC/auth)
 *   cacheable_pct: number, // (hit + miss) / total * 100
 *   ts: string,        // ISO timestamp of query
 * }
 *
 * Debug mode: `?debug=1` returns the raw SQL response body for diagnosis.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Admin-only via shared secret (no public exposure).
  const authHeader = request.headers.get('x-cache-stats-key')
  const expectedKey = process.env.CACHE_STATS_KEY
  if (expectedKey && authHeader !== expectedKey) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const accountId = process.env.CF_ACCOUNT_ID
  const apiToken = process.env.CF_API_TOKEN

  if (!accountId || !apiToken) {
    return NextResponse.json(
      {
        error: 'CF_ACCOUNT_ID or CF_API_TOKEN not configured',
        hint: 'wrangler secret put CF_ACCOUNT_ID && wrangler secret put CF_API_TOKEN',
      },
      { status: 503 },
    )
  }

  const url = new URL(request.url)
  const debug = url.searchParams.get('debug') === '1'
  const detail = debug || url.searchParams.get('detail') === '1' || url.searchParams.get('breakdown') === '1'

  // CF Analytics Engine SQL API. The `_sample_interval` column is how AE
  // surfaces the sample-weighted count of each row (when the worker calls
  // writeDataPoint, sample_interval defaults to 1 for unsampled data, so
  // SUM(_sample_interval) === the raw event count for our usage).
  // index1 = the status label (HIT/MISS/BYPASS) from edge-cache-entry.mjs.
  // The fp_edge_cache table is referenced by quoted-name; AE SQL is case-
  // sensitive on dataset names.
  const sql = `SELECT
  index1 AS label,
  SUM(_sample_interval) AS count
FROM fp_edge_cache
WHERE timestamp > NOW() - INTERVAL '24' HOUR
GROUP BY index1
LIMIT 10
FORMAT JSON`

  const sqlUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`

  let raw: Response
  try {
    raw = await fetch(sqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        Authorization: `Bearer ${apiToken}`,
      },
      body: sql,
    })
  } catch (e) {
    return NextResponse.json({ error: 'CF SQL fetch failed', detail: String(e) }, { status: 502 })
  }

  const bodyText = await raw.text()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any = null
  try { parsed = JSON.parse(bodyText) } catch { /* leave parsed=null */ }

  if (!raw.ok || !parsed) {
    return NextResponse.json(
      {
        error: 'CF SQL error',
        status: raw.status,
        // Always surface enough detail to diagnose without exposing schema by default
        body_preview: bodyText.slice(0, 400),
      },
      { status: 502 },
    )
  }

  // SQL API JSON format: { meta: [...], data: [{label, count}, ...], rows: N, rows_before_limit_at_least: N }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: { label: string; count: number }[] = Array.isArray(parsed?.data) ? parsed.data : []

  const counts: Record<string, number> = { HIT: 0, MISS: 0, BYPASS: 0 }
  for (const row of data) {
    if (row.label in counts) counts[row.label] = Number(row.count) || 0
  }

  const hit = counts.HIT
  const miss = counts.MISS
  const bypass = counts.BYPASS
  const total = hit + miss + bypass
  const cacheableTotal = hit + miss
  const now = new Date()

  let breakdown:
    | { label: string; route: string; reason: string; method: string; response_status: string; traffic_class: string; count: number }[]
    | undefined
  let breakdown_error: { status?: number; body_preview?: string; detail?: string } | undefined

  if (detail) {
    const detailSql = `SELECT
  index1 AS label,
  blob2 AS route,
  blob3 AS reason,
  blob4 AS method,
  blob5 AS response_status,
  blob6 AS traffic_class,
  SUM(_sample_interval) AS count
FROM fp_edge_cache
WHERE timestamp > NOW() - INTERVAL '24' HOUR
GROUP BY index1, blob2, blob3, blob4, blob5, blob6
LIMIT 500
FORMAT JSON`

    try {
      const detailRaw = await fetch(sqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          Authorization: `Bearer ${apiToken}`,
        },
        body: detailSql,
      })
      const detailText = await detailRaw.text()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let detailParsed: any = null
      try { detailParsed = JSON.parse(detailText) } catch { /* leave detailParsed=null */ }

      if (detailRaw.ok && detailParsed && Array.isArray(detailParsed.data)) {
        breakdown = detailParsed.data
          .map((row: Record<string, unknown>) => ({
            label: String(row.label ?? ''),
            route: String(row.route || 'legacy'),
            reason: String(row.reason || 'legacy'),
            method: String(row.method || 'legacy'),
            response_status: String(row.response_status || 'legacy'),
            traffic_class: String(row.traffic_class || 'legacy'),
            count: Number(row.count) || 0,
          }))
          .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
          .slice(0, 50)
      } else {
        breakdown_error = { status: detailRaw.status, body_preview: detailText.slice(0, 400) }
      }
    } catch (e) {
      breakdown_error = { detail: String(e) }
    }
  }

  return NextResponse.json(
    {
      window: '24h',
      hit,
      miss,
      bypass,
      total,
      hit_pct: cacheableTotal > 0 ? Math.round((hit / cacheableTotal) * 1000) / 10 : null,
      cacheable_pct: total > 0 ? Math.round((cacheableTotal / total) * 1000) / 10 : null,
      ts: now.toISOString(),
      sql_rows_count: data.length,
      breakdown,
      breakdown_error,
      sql_response: debug ? parsed : undefined,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}
