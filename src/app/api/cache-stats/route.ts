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
 *   hit_pct_bot: number,   // same math, traffic_class != 'non-bot' only (S45 C2, 2026-07-02)
 *   hit_pct_human: number, // same math, traffic_class == 'non-bot' only
 *   cacheable_pct: number, // (hit + miss) / total * 100
 *   ts: string,        // ISO timestamp of query
 * }
 *
 * S45 (2026-07-02, hygiene plan C2): the top-level hit_pct blends bot and
 * human traffic. Under crawl-heavy weeks (recrawl post-403-fix, Reddit ad
 * traffic) that blend swings on bot volume alone and reads as a false
 * "regression" — the human number is what actually grades UX and is what the
 * digest scoreboard should cite. traffic_class comes from
 * request.cf.verifiedBotCategory (edge-cache-entry.mjs trafficClassFor);
 * 'non-bot' is the human+unverified-scraper bucket (CF only labels VERIFIED
 * bots), so hit_pct_human is really "not a known verified bot" — a
 * conservative human proxy, not a guarantee.
 *
 * Debug mode: `?debug=1` returns the raw SQL response body for diagnosis.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Admin-only via shared secret (no public exposure). Fails CLOSED: an unset
  // key must never be treated as "no gate."
  const authHeader = request.headers.get('x-cache-stats-key')
  const expectedKey = process.env.CACHE_STATS_KEY
  if (!expectedKey) {
    return NextResponse.json({ error: 'admin_endpoint_not_configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  if (authHeader !== expectedKey) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
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
  // blob6 = traffic_class ('non-bot' or a verifiedBotCategory value) — grouped
  // in here too (S45 C2) so the bot/human split costs zero extra SQL calls.
  // The fp_edge_cache table is referenced by quoted-name; AE SQL is case-
  // sensitive on dataset names.
  const sql = `SELECT
  index1 AS label,
  blob6 AS traffic_class,
  SUM(_sample_interval) AS count
FROM fp_edge_cache
WHERE timestamp > NOW() - INTERVAL '24' HOUR
GROUP BY index1, blob6
LIMIT 50
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

  // SQL API JSON format: { meta: [...], data: [{label, traffic_class, count}, ...], rows: N, rows_before_limit_at_least: N }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: { label: string; traffic_class?: string; count: number }[] = Array.isArray(parsed?.data) ? parsed.data : []

  const counts: Record<string, number> = { HIT: 0, MISS: 0, BYPASS: 0 }
  // S45 C2: same rows, split by traffic_class. 'non-bot' = human bucket (see
  // JSDoc caveat above); anything else (a verifiedBotCategory value) = bot.
  const humanCounts: Record<string, number> = { HIT: 0, MISS: 0, BYPASS: 0 }
  const botCounts: Record<string, number> = { HIT: 0, MISS: 0, BYPASS: 0 }
  for (const row of data) {
    if (!(row.label in counts)) continue
    const n = Number(row.count) || 0
    counts[row.label] += n
    const bucket = row.traffic_class === 'non-bot' ? humanCounts : botCounts
    bucket[row.label] += n
  }

  const hit = counts.HIT
  const miss = counts.MISS
  const bypass = counts.BYPASS
  const total = hit + miss + bypass
  const cacheableTotal = hit + miss
  const humanCacheable = humanCounts.HIT + humanCounts.MISS
  const botCacheable = botCounts.HIT + botCounts.MISS
  const now = new Date()

  let breakdown:
    | { label: string; route: string; reason: string; method: string; response_status: string; traffic_class: string; path_detail: string; count: number }[]
    | undefined
  let bad_paths:
    | { route: string; response_status: string; traffic_class: string; path_detail: string; count: number }[]
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
  blob7 AS path_detail,
  SUM(_sample_interval) AS count
FROM fp_edge_cache
WHERE timestamp > NOW() - INTERVAL '24' HOUR
GROUP BY index1, blob2, blob3, blob4, blob5, blob6, blob7
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
            path_detail: String(row.path_detail || ''),
            count: Number(row.count) || 0,
          }))
          .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
          .slice(0, 50)
      } else {
        breakdown_error = { status: detailRaw.status, body_preview: detailText.slice(0, 400) }
      }

      const badPathSql = `SELECT
  blob2 AS route,
  blob5 AS response_status,
  blob6 AS traffic_class,
  blob7 AS path_detail,
  SUM(_sample_interval) AS count
FROM fp_edge_cache
WHERE timestamp > NOW() - INTERVAL '24' HOUR
  AND blob7 IS NOT NULL
  AND blob7 != ''
GROUP BY blob2, blob5, blob6, blob7
LIMIT 100
FORMAT JSON`

      const badPathRaw = await fetch(sqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          Authorization: `Bearer ${apiToken}`,
        },
        body: badPathSql,
      })
      const badPathText = await badPathRaw.text()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let badPathParsed: any = null
      try { badPathParsed = JSON.parse(badPathText) } catch { /* leave badPathParsed=null */ }
      if (badPathRaw.ok && badPathParsed && Array.isArray(badPathParsed.data)) {
        bad_paths = badPathParsed.data
          .map((row: Record<string, unknown>) => ({
            route: String(row.route || 'legacy'),
            response_status: String(row.response_status || 'legacy'),
            traffic_class: String(row.traffic_class || 'legacy'),
            path_detail: String(row.path_detail || ''),
            count: Number(row.count) || 0,
          }))
          .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
          .slice(0, 50)
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
      hit_pct_bot: botCacheable > 0 ? Math.round((botCounts.HIT / botCacheable) * 1000) / 10 : null,
      hit_pct_human: humanCacheable > 0 ? Math.round((humanCounts.HIT / humanCacheable) * 1000) / 10 : null,
      cacheable_pct: total > 0 ? Math.round((cacheableTotal / total) * 1000) / 10 : null,
      ts: now.toISOString(),
      sql_rows_count: data.length,
      breakdown,
      bad_paths,
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
