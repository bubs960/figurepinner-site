// Rank-priority sourcing for the nightly Bing URL submission (2026-09-18).
//
// Bing gives this site 100 URL submissions a day. Until now all of them went to
// "fids whose KB row changed", newest first, behind a 1,501-URL backlog — so the
// scarce slots were spent without regard to which pages are one recrawl away
// from paying. Bing's own API says which pages it already ranks at positions
// 4-15 (shown, rarely clicked). Those go to the front of the queue, because a
// recrawl is how a new title / price / answer box actually reaches the SERP.
//
// Steve, 2026-09-18 (web chat): "Point the 100 Bing URL submissions a day at
// pages ranking 4-15, not only changed figures." This AMENDS the 2026-09-11
// delta term "changed/new URLs only … never the priority pad" for rank-priority
// URLs only: capped slots, a per-URL cooldown, sitemap-emitted canonical URLs
// only. The static PRIORITY_URLS pad is still never submitted in delta mode.
//
// Pure + injectable (fetchImpl) so tests need no network. Never throws.
const API = 'https://ssl.bing.com/webmaster/api.svc/json/GetPageStats'

export const PRIORITY_SLOTS = 40 // of the 100/day cap; the changed-fid delta keeps >= 60
export const PRIORITY_COOLDOWN_DAYS = 14 // a URL is re-eligible at most every two weeks
export const RANK_MIN = 4
export const RANK_MAX = 15

function scrub(text, key) {
  return String(text ?? '').split(key).join('***').slice(0, 200)
}

/** Raw GetPageStats rows ({Query: url, Clicks, Impressions, AvgImpressionPosition, Date}), or { error }. */
export async function fetchBingPageStats(config, { fetchImpl = fetch, timeoutMs = 20000 } = {}) {
  const url = API + '?siteUrl=' + encodeURIComponent(config.siteUrl.endsWith('/') ? config.siteUrl : config.siteUrl + '/') + '&apikey=' + encodeURIComponent(config.key)
  try {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) })
    const text = await res.text()
    if (!res.ok) return { error: 'GetPageStats HTTP ' + res.status + ': ' + scrub(text, config.key) }
    const rows = JSON.parse(text)?.d
    return Array.isArray(rows) ? { rows } : { error: 'GetPageStats returned no row array' }
  } catch (err) {
    return { error: 'GetPageStats failed: ' + scrub(err.message, config.key) }
  }
}

/**
 * Canonical, sitemap-emitted URLs Bing ranks at RANK_MIN..RANK_MAX, most
 * impressions first. Raw `/figure/<fid>` URLs are mapped to their pretty path
 * (never submitted as-is); anything not in `aboveBar` is dropped.
 */
export function rankPriorityUrls(rows, { host, prettyByFid, aboveBar }) {
  const agg = new Map()
  for (const r of rows) {
    if (!r || typeof r.Query !== 'string' || !(r.Impressions > 0)) continue
    const a = agg.get(r.Query) || { impressions: 0, posWeighted: 0 }
    a.impressions += r.Impressions
    a.posWeighted += (Number(r.AvgImpressionPosition) || 0) * r.Impressions
    agg.set(r.Query, a)
  }
  const byCanonical = new Map()
  for (const [rawUrl, a] of agg) {
    const pos = a.posWeighted / a.impressions
    if (!(pos >= RANK_MIN && pos <= RANK_MAX)) continue
    let path
    try {
      const u = new URL(rawUrl)
      if (u.hostname.replace(/^www\./, '') !== host) continue
      path = u.pathname
    } catch {
      continue
    }
    const fidMatch = /^\/figure\/([^/]+)\/?$/.exec(path)
    if (fidMatch) {
      path = prettyByFid?.[fidMatch[1]]
      if (!path) continue
    }
    const canonical = 'https://' + host + (path === '/' ? '/' : path.replace(/\/$/, ''))
    if (!aboveBar.has(canonical) && !aboveBar.has(canonical + '/')) continue
    const prev = byCanonical.get(canonical)
    if (!prev || a.impressions > prev.impressions) byCanonical.set(canonical, { impressions: a.impressions, pos })
  }
  return [...byCanonical].sort((x, y) => y[1].impressions - x[1].impressions).map(([url, v]) => ({ url, impressions: v.impressions, pos: Math.round(v.pos * 10) / 10 }))
}

const dayNumber = (day) => Math.floor(Date.parse(day + 'T00:00:00Z') / 864e5)

/** Up to `slots` URLs not submitted within the cooldown. `state` = { [url]: 'YYYY-MM-DD' }. */
export function pickPriority(ranked, state, { today, slots = PRIORITY_SLOTS, cooldownDays = PRIORITY_COOLDOWN_DAYS } = {}) {
  const now = dayNumber(today)
  const out = []
  for (const r of ranked) {
    if (out.length >= slots) break
    const last = state?.[r.url]
    if (last && now - dayNumber(last) < cooldownDays) continue
    out.push(r.url)
  }
  return out
}

/** State after a night: stamp what was actually sent, forget entries older than 90 days. */
export function nextPriorityState(state, sentUrls, today) {
  const now = dayNumber(today)
  const next = {}
  for (const [url, day] of Object.entries(state || {})) if (now - dayNumber(day) < 90) next[url] = day
  for (const url of sentUrls) next[url] = today
  return next
}
