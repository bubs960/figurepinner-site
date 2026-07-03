import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SQL = `SELECT
  index1 AS event,
  blob2 AS source,
  blob3 AS route,
  blob8 AS target,
  SUM(_sample_interval) AS count
FROM fp_funnel
WHERE timestamp > NOW() - INTERVAL '24' HOUR
GROUP BY index1, blob2, blob3, blob8
LIMIT 200
FORMAT JSON`

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
      window: '24h',
      rows,
      total: rows.reduce((sum: number, row: Record<string, unknown>) => sum + (Number(row.count) || 0), 0),
      ts: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
