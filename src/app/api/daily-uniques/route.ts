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
 * DAY BOUNDARIES ARE America/New_York, NOT UTC (fixed 2026-07-20/21, S? — the
 * "0 visits on 7/19" incident): the CF `date` dimension on rumPageloadEventsAdaptiveGroups
 * buckets by UTC calendar day. Steve reads the Cloudflare dashboard in EDT/EST, and a
 * late-evening (post ~8pm ET) work session's traffic lands in the NEXT UTC day's bucket
 * — a normal evening looked like a dead day. Fixed by fetching hourly (`datetimeHour`)
 * rows over a padded UTC window and re-bucketing each hour into its America/New_York
 * calendar date ourselves, so `rows[].date` always matches what the CF dashboard shows
 * for that same NY calendar day. Verified against a live dashboard read (absolute range
 * Jul 19 00:00–24:00 EDT = 6 visits / 7 pageviews) before shipping this fix.
 *
 * DOES NOT silently return zeros. If CF GraphQL rejects a field, this returns the
 * raw CF errors with HTTP 502 so the query can be fixed — the same discipline that
 * the cache-stats endpoint learned the hard way (see cache-stats/route.ts S41c note).
 *
 * Query params:
 *   ?days=30    widen the window (default 7, capped at 90)
 *   ?debug=1    include the raw GraphQL response body
 *
 * Auth gate (S56, Steve ruling 7/3 — hygiene plan S4 "gate them"): visitor
 * counts reveal our traffic level to competitors. Gated behind the SAME
 * shared secret as cache-stats (CACHE_STATS_KEY, header x-cache-stats-key) so
 * no new wrangler secret is needed. Fails CLOSED when the key is unset.
 * Readers (digest task, weekly web read) must send the header — same as they
 * already do for cache-stats/funnel-stats.
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

// Steve/the dashboard read this zone in US Eastern time — bucket day boundaries
// to match, not UTC. Handles EDT/EST transitions automatically via Intl.
const NY_TZ = 'America/New_York'
const nyDateString = (d: Date): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: NY_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)

type DayRow = { date: string; uniques: number; requests: number; pageViews: number }

export async function GET(request: Request) {
  // S4 gate (S56): shared ops-stats secret, fails closed. See header comment.
  const expectedKey = process.env.CACHE_STATS_KEY
  if (!expectedKey) {
    return NextResponse.json({ error: 'admin_endpoint_not_configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  if (request.headers.get('x-cache-stats-key') !== expectedKey) {
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
  // Fetch one extra day of UTC padding on each side so every hour that could
  // possibly fall into a requested NY calendar day is present before we re-bucket
  // below — a fixed UTC date_geq/date_leq window would clip late-ET-evening hours
  // (see the 7/19 incident in the header comment).
  const fmt = (d: Date) => d.toISOString().slice(0, 10) // YYYY-MM-DD, used only for siteTag discovery below

  // Resolve the RUM siteTag for figurepinner.com from this account's Web Analytics sites.
  let siteTag = process.env.CF_RUM_SITE_TAG || ''
  if (!siteTag) {
    const siteStart = new Date(end.getTime() - (days + 1) * 24 * 60 * 60 * 1000)
    const siteQ = `query($a: String!) { viewer { accounts(filter: { accountTag: $a }) { rumPageloadEventsAdaptiveGroups(limit: 50, filter: { date_geq: "${fmt(siteStart)}", date_leq: "${fmt(end)}" }) { dimensions { siteTag } sum { visits } } } } }`
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

  // Hourly window, padded a full extra day on each side of the requested range —
  // generous enough to cover any UTC/NY offset (max 5h) with huge margin, and cheap
  // since we bucket + trim server-side below.
  const fetchStart = new Date(end.getTime() - (days + 1) * 24 * 60 * 60 * 1000)

  const query = `
    query Visits($accountTag: String!, $siteTag: String!, $start: Time!, $end: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          rumPageloadEventsAdaptiveGroups(
            limit: 10000
            filter: { siteTag: $siteTag, datetime_geq: $start, datetime_leq: $end }
            orderBy: [datetimeHour_ASC]
          ) {
            dimensions { datetimeHour }
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
      body: JSON.stringify({ query, variables: { accountTag, siteTag, start: fetchStart.toISOString(), end: end.toISOString() } }),
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

  // Re-bucket hourly rows into America/New_York calendar days (see header comment
  // for why: CF's own `date` dimension is UTC, and that silently hid a normal
  // evening's traffic on 7/19).
  const buckets = new Map<string, { uniques: number; requests: number }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const g of groups as any[]) {
    const ts = g?.dimensions?.datetimeHour
    if (!ts) continue
    const day = nyDateString(new Date(ts))
    const b = buckets.get(day) ?? { uniques: 0, requests: 0 }
    b.uniques += g.sum?.visits ?? 0
    b.requests += g.count ?? 0
    buckets.set(day, b)
  }

  const sortedDays = Array.from(buckets.keys()).sort()
  // Keep only the most recent `days` NY calendar-day buckets — earlier buckets
  // exist only because of the padded fetch window above.
  const trimmedDays = sortedDays.slice(-days)
  const rows: DayRow[] = trimmedDays.map((date) => {
    const b = buckets.get(date)!
    return { date, uniques: b.uniques, requests: b.requests, pageViews: b.requests }
  })

  const uniqVals = rows.map((r) => r.uniques)
  const avgUniques = uniqVals.length ? Math.round(uniqVals.reduce((a, b) => a + b, 0) / uniqVals.length) : 0
  const latest = rows[rows.length - 1] ?? null

  // Day-over-day delta — the "+1/-1 each day" read Steve asked for (2026-07-20/21).
  const dayOverDay = rows.map((r, i) => ({
    date: r.date,
    uniques: r.uniques,
    delta: i === 0 ? null : r.uniques - rows[i - 1].uniques,
  }))

  // Week-over-week — only meaningful once >=14 NY days of data exist in the window.
  let weekOverWeek: { this_week_total: number; last_week_total: number; delta: number; pct_change: number | null } | null = null
  if (rows.length >= 14) {
    const thisWeek = rows.slice(-7).reduce((a, r) => a + r.uniques, 0)
    const lastWeek = rows.slice(-14, -7).reduce((a, r) => a + r.uniques, 0)
    weekOverWeek = {
      this_week_total: thisWeek,
      last_week_total: lastWeek,
      delta: thisWeek - lastWeek,
      pct_change: lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 1000) / 10 : null,
    }
  }

  return NextResponse.json(
    {
      zone: ZONE_NAME,
      window_days: days,
      note: 'visits = CF Web Analytics (RUM beacon) sessions — fires in real browsers, EXCLUDES most bots, so a close human estimate. pageViews = pageloads. Days are bucketed in America/New_York (matches the CF dashboard), not UTC. R1 target: 50 real human visits/day by 2026-07-31 (extended from 7/03, override on record 2026-07-01).',
      avg_visits_per_day: avgUniques,
      latest_day: latest,
      rows,
      day_over_day: dayOverDay,
      week_over_week: weekOverWeek,
      ts: new Date().toISOString(),
      graphql_response: debug ? p : undefined,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
