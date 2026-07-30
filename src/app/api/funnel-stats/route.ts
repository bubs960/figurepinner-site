import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Cloudflare Analytics Engine's free-tier retention is 90 days; cap the
// window there rather than at some arbitrary smaller number.
const MAX_HOURS = 90 * 24
const DEFAULT_HOURS = 24

function buildSql(hours: number): string {
  // `hours` is validated as a finite integer in [1, MAX_HOURS] by the
  // caller before this ever runs -- interpolated directly (Analytics
  // Engine's SQL API has no parameterized-query support), safe only
  // because it can never be anything but that validated integer.
  // webaudit finding, 2026-07-30: this had LIMIT 200 with no ORDER BY. A real
  // pull (936h window) came back at exactly 200 rows -- a strong sign more
  // distinct event/source/route/target combinations existed and were being
  // silently dropped, non-deterministically (which 200 came back could vary
  // call to call). ORDER BY count DESC makes the truncation deterministic and
  // puts anything dropped at the low-signal tail; LIMIT raised 10x as a cheap
  // margin -- this is a manual, key-gated diagnostic endpoint, not a hot path,
  // so full pagination would be over-engineering for what it's actually used for.
  return `SELECT
  index1 AS event,
  blob2 AS source,
  blob3 AS route,
  blob8 AS target,
  SUM(_sample_interval) AS count
FROM fp_funnel
WHERE timestamp > NOW() - INTERVAL '${hours}' HOUR
GROUP BY index1, blob2, blob3, blob8
ORDER BY count DESC
LIMIT 2000
FORMAT JSON`
}

export async function GET(request: Request) {
  // Fails CLOSED: an unset key must never be treated as "no gate."
  const authHeader = request.headers.get('x-funnel-stats-key')
  const expectedKey = process.env.FUNNEL_STATS_KEY
  if (!expectedKey) {
    return NextResponse.json({ error: 'admin_endpoint_not_configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  if (authHeader !== expectedKey) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  // Optional ?hours=N -- was hardcoded to 24h, too thin a sample for any
  // source/fandom behavioral comparison (2026-07-17 finding). Invalid or
  // out-of-range values fall back to the prior default rather than erroring,
  // so this stays backward-compatible for existing callers.
  const requestedHours = Number(new URL(request.url).searchParams.get('hours'))
  const hours = Number.isInteger(requestedHours) && requestedHours >= 1 && requestedHours <= MAX_HOURS
    ? requestedHours
    : DEFAULT_HOURS
  const SQL = buildSql(hours)

  const accountId = process.env.CF_ACCOUNT_ID
  const apiToken = process.env.CF_API_TOKEN

  if (!accountId || !apiToken) {
    return NextResponse.json(
      {
        error: 'CF_ACCOUNT_ID or CF_API_TOKEN not configured',
        hint: 'wrangler secret put CF_ACCOUNT_ID && wrangler secret put CF_API_TOKEN',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const sqlUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`
  let raw: Response
  try {
    raw = await fetch(sqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        Authorization: `Bearer ${apiToken}`,
      },
      body: SQL,
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
        body_preview: bodyText.slice(0, 400),
      },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const rows = Array.isArray(parsed?.data) ? parsed.data : []
  return NextResponse.json(
    {
      window: `${hours}h`,
      rows,
      total: rows.reduce((sum: number, row: Record<string, unknown>) => sum + (Number(row.count) || 0), 0),
      ts: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
