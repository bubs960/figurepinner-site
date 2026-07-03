import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

/**
 * GET /api/daily-uniques
 *
 * Returns daily unique visitors + requests for figurepinner.com over the last
 * N days (default 7), from Cloudflare zone analytics via the GraphQL Analytics
 * API (dataset: httpRequests1dGroups).
 *
 * WHY THIS EXISTS (2026-06-26, web chat — R1 scoreboard):
 * Ground rule R1 — FigurePinner must hit 50 real human visits/day by 2026-07-31 (extended from 7/03, override on record 2026-07-01)
 * or the figures vertical is decommissioned. We cannot grade that without a real,
 * verified daily-visitor number. This route is the durable, browser-readable
 * scoreboard feed. The local Node script mirrors this same RUM query when local
 * CF_API_TOKEN is available.
 *
 * IMPORTANT — what the number means:
 *   `uniques` here is CF Web Analytics RUM visits. The beacon runs in real
 *   browsers and excludes most bots/crawlers, so this is the best daily human-visit
 *   proxy.
 *
 * DOES NOT silently return zeros. If CF GraphQL rejects a field, this returns the
 * raw CF errors with HTTP 502 so the query can be fixed — the same discipline that
 * the cache-stats endpoint learned the hard way (see cache-stats/route.ts S41c note).
 *
 * Query params:
 *   ?days=30    widen the window (default 7, capped at 90)
 *   ?debug=1    include the raw GraphQL response body
 *
 * No auth gate: the response is nothing but public visitor counts. If gating is
 * wanted later, copy the x-cache-stats-key pattern from cache-stats/route.ts.
 */

export const dynamic = 'force-dynamic'

const ZONE_NAME = 'figurepinner.com'
// Verified from the CF dashboard (Overview → API → Zone ID), 2026-06-26.
// Needed because the Account-Analytics:Read token canNOT list zones (no Zone:Read
// scope) — /zones?name= returns an empty result, so we can't resolve it at runtime.
// A dashboard-verified constant is not a guess. Override via CF_ZONE_ID env if it ever changes.
const ZONE_ID_FALLBACK = '66a98bfaa6a2992c9ed3c32f9f3c1702'
const GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql'
const REST = 'https://api.cloudflare.com/client/v4'

type DayRow = { date: string; uniques: number; requests: number; pageViews: number }

export async function GET(request: Request) {
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

  const url = new URL(request.url)
  const debug = url.searchParams.get('debug') === '1'
  const introspect = url.searchParams.get('introspect') === '1'

  // debug/introspect leak raw CF GraphQL bodies + schema — gate behind a
  // secret + rate limit. The base visitor count below stays public.
  if (debug || introspect) {
    const rl = await checkRateLimit(request, 'daily-uniques-debug', 10)
    if (rl.limited) {
      return NextResponse.json(
        { error: 'rate_limited' },
        { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(rl.retryAfter) } },
      )
    }
    const debugKey = process.env.DAILY_UNIQUES_DEBUG_KEY
    if (!debugKey) {
      return NextResponse.json({ error: 'admin_endpoint_not_configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
    }
    if (request.headers.get('x-daily-uniques-key') !== debugKey) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
    }
  }

  // TEMP introspection (2026-06-27): ask CF what RUM fields exist under Zone so we
  // stop guessing dataset names. Remove after the query is fixed. ?introspect=1
  if (introspect) {
    const introQ = `query { __type(name: "Zone") { fields { name } } }`
    const ir = await fetch(GRAPHQL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: introQ }),
    })
    const ib = await ir.text()
    let names: string[] = []
    try {
      const ij = JSON.parse(ib)
      names = (ij?.data?.__type?.fields ?? []).map((f: { name: string }) => f.name).filter((n: string) => /rum|pageview|visit/i.test(n))
    } catch { /* ignore */ }
    return NextResponse.json({ rum_like_zone_fields: names, all_count: undefined, raw: debug ? ib.slice(0, 4000) : undefined }, { headers: { 'Cache-Control': 'no-store' } })
  }
  const daysParam = parseInt(url.searchParams.get('days') || '7', 10)
  const days = Math.min(90, Math.max(1, Number.isFinite(daysParam) ? daysParam : 7))

  const authHeaders = {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  }

  // RUM (Web Analytics) is ACCOUNT-scoped, filtered by siteTag — NOT zone-scoped.
  // (Confirmed via CF GraphQL schema docs 2026-06-27: rumPageloadEventsAdaptiveGroups
  //  lives under viewer.accounts, takes siteTag, not viewer.zones/zoneTag.)
  const accountTag = accountId
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().slice(0, 10) // YYYY-MM-DD

  // Resolve the RUM siteTag for figurepinner.com from this account's Web Analytics sites.
  let siteTag = process.env.CF_RUM_SITE_TAG || ''
  if (!siteTag) {
    const siteQ = `query($a: String!) { viewer { accounts(filter: { accountTag: $a }) { rumPageloadEventsAdaptiveGroups(limit: 50, filter: { date_geq: "${fmt(start)}", date_leq: "${fmt(end)}" }) { dimensions { siteTag } sum { visits } } } } }`
    try {
      const sr = await fetch(GRAPHQL, { method: 'POST', headers: authHeaders, body: JSON.stringify({ query: siteQ, variables: { a: accountTag } }) })
      const sj = (await sr.json()) as any
      const sites = sj?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups ?? []
      // pick the site with the most visits in window (our live site)
      let best: any = null
      for (const row of sites) { if (!best || (row?.sum?.visits ?? 0) > (best?.sum?.visits ?? 0)) best = row }
      if (best?.dimensions?.siteTag) siteTag = best.dimensions.siteTag
    } catch { /* fall through; query below will surface the error */ }
  }

  const query = `
    query Visits($accountTag: String!, $siteTag: String!, $start: String!, $end: String!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          rumPageloadEventsAdaptiveGroups(
            limit: 100
            filter: { siteTag: $siteTag, date_geq: $start, date_leq: $end }
            orderBy: [date_ASC]
          ) {
            dimensions { date }
            sum { visits }
            count
          }
        }
      }
    }`

  let parsed: unknown = null
  let rawStatus = 0
  let rawBody = ''
  try {
    const r = await fetch(GRAPHQL, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ query, variables: { accountTag, siteTag, start: fmt(start), end: fmt(end) } }),
    })
    rawStatus = r.status
    rawBody = await r.text()
    try {
      parsed = JSON.parse(rawBody)
    } catch {
      /* leave parsed null */
    }
  } catch (e) {
    return NextResponse.json(
      { error: 'CF GraphQL fetch failed', detail: String(e) },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = parsed as any
  // Surface CF errors loudly — never return zeros on a rejected query.
  if (rawStatus < 200 || rawStatus >= 300 || p?.errors?.length || !p?.data) {
    return NextResponse.json(
      {
        error: 'CF GraphQL error — NOT returning zeros, fix the flagged field',
        cf_status: rawStatus,
        cf_errors: p?.errors ?? null,
        body_preview: rawBody.slice(0, 500),
      },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const groups = p?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups
  if (!Array.isArray(groups)) {
    return NextResponse.json(
      { error: 'unexpected response shape — no rumPageloadEventsAdaptiveGroups array', body_preview: rawBody.slice(0, 500) },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  // RUM rows: `sum.visits` = sessions (best human-visit proxy), `count` = pageloads.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: DayRow[] = groups.map((g: any) => ({
    date: g.dimensions?.date,
    uniques: g.sum?.visits ?? 0,
    requests: g.count ?? 0,
    pageViews: g.count ?? 0,
  }))

  const uniqVals = rows.map((r) => r.uniques)
  const avgUniques = uniqVals.length ? Math.round(uniqVals.reduce((a, b) => a + b, 0) / uniqVals.length) : 0
  const latest = rows[rows.length - 1] ?? null

  return NextResponse.json(
    {
      zone: ZONE_NAME,
      window_days: days,
      note: 'visits = CF Web Analytics (RUM beacon) sessions — fires in real browsers, EXCLUDES most bots, so a close human estimate. pageViews = pageloads. R1 target: 50 real human visits/day by 2026-07-31 (extended from 7/03, override on record 2026-07-01).',
      avg_visits_per_day: avgUniques,
      latest_day: latest,
      rows,
      ts: new Date().toISOString(),
      graphql_response: debug ? p : undefined,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
