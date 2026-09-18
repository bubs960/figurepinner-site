// Bing Webmaster Tools URL Submission API — fallback for IndexNow.
//
// Why this exists (2026-09-18): IndexNow's submission API has answered
// 403 UserForbiddedToAccessSite every night since 9/12. Cloudflare Bot Fight
// Mode (Free plan, no WAF exceptions) blocks IndexNow's non-browser key-file
// verification fetch, so the key can never verify. The BWT URL Submission API
// authenticates with an account API key instead — no fetch back to our site —
// so Bot Fight Mode cannot break it. Steve pre-authorized this fallback 9/11.
//
// The key is a SECRET: it travels in the query string (Bing's design), so this
// module never logs a request URL and never echoes the key in an error.
//
// Pure + injectable (fetchImpl, env, readFile) so tests need no network.
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const API_BASE = 'https://ssl.bing.com/webmaster/api.svc/json'
export const BWT_BATCH_MAX = 500 // SubmitUrlBatch hard limit per request
const DEFAULT_SITE_URL = 'https://figurepinner.com'
const SECRETS_FILE = join(homedir(), '.figurepinner-secrets.env')

/** BWT_API_KEY from the environment, else from ~/.figurepinner-secrets.env. Null when absent. */
export function loadBwtConfig({ env = process.env, readFile = (p) => readFileSync(p, 'utf8') } = {}) {
  let key = (env.BWT_API_KEY || '').trim()
  let siteUrl = (env.BWT_SITE_URL || '').trim()
  if (!key || !siteUrl) {
    try {
      for (const line of readFile(SECRETS_FILE).split(/\r?\n/)) {
        const m = /^(BWT_API_KEY|BWT_SITE_URL)=(.*)$/.exec(line.trim())
        if (!m) continue
        const value = m[2].trim().replace(/^["']|["']$/g, '')
        if (m[1] === 'BWT_API_KEY' && !key) key = value
        if (m[1] === 'BWT_SITE_URL' && !siteUrl) siteUrl = value
      }
    } catch {
      // no secrets file on this machine — fine, the fallback just stays off
    }
  }
  if (!key) return null
  return { key, siteUrl: siteUrl || DEFAULT_SITE_URL }
}

function scrub(text, key) {
  return String(text ?? '').split(key).join('***').slice(0, 200)
}

/** Remaining quota. Returns { daily, monthly } or { error }. */
export async function getBwtQuota(config, { fetchImpl = fetch } = {}) {
  const url = API_BASE + '/GetUrlSubmissionQuota?siteUrl=' + encodeURIComponent(config.siteUrl) + '&apikey=' + encodeURIComponent(config.key)
  try {
    const res = await fetchImpl(url)
    const text = await res.text()
    if (!res.ok) return { error: 'quota HTTP ' + res.status + ': ' + scrub(text, config.key) }
    const d = JSON.parse(text)?.d
    const daily = Number(d?.DailyQuota)
    const monthly = Number(d?.MonthlyQuota)
    if (!Number.isFinite(daily) || !Number.isFinite(monthly)) return { error: 'quota response had no DailyQuota/MonthlyQuota' }
    return { daily, monthly }
  } catch (err) {
    return { error: 'quota request failed: ' + scrub(err.message, config.key) }
  }
}

/**
 * Submit up to the remaining quota. Never throws.
 * Returns { status, submitted, skipped, note? }:
 *   status 'bwt-200'        every attempted batch accepted
 *   status 'bwt-partial'    some batches accepted, then one failed
 *   status 'bwt-no-quota'   quota is 0 — nothing attempted
 *   status 'bwt-<code>'     first batch rejected / 'bwt-error' transport failure
 * `submitted` URLs were accepted by Bing; `skipped` were not sent (quota or failure).
 */
export async function submitViaBwt(urls, config, { fetchImpl = fetch } = {}) {
  const quota = await getBwtQuota(config, { fetchImpl })
  if (quota.error) return { status: 'bwt-error', submitted: [], skipped: urls, note: quota.error }
  const room = Math.max(0, Math.min(quota.daily, quota.monthly))
  if (room === 0) return { status: 'bwt-no-quota', submitted: [], skipped: urls, note: 'daily ' + quota.daily + ' / monthly ' + quota.monthly }

  const toSend = urls.slice(0, room)
  const submitted = []
  const endpoint = API_BASE + '/SubmitUrlBatch?apikey=' + encodeURIComponent(config.key)
  for (let i = 0; i < toSend.length; i += BWT_BATCH_MAX) {
    const batch = toSend.slice(i, i + BWT_BATCH_MAX)
    let failure = null
    try {
      const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ siteUrl: config.siteUrl, urlList: batch }),
      })
      if (!res.ok) failure = { code: String(res.status), note: scrub(await res.text(), config.key) }
    } catch (err) {
      failure = { code: 'error', note: scrub(err.message, config.key) }
    }
    if (failure) {
      return {
        status: submitted.length ? 'bwt-partial' : 'bwt-' + failure.code,
        submitted,
        skipped: urls.slice(submitted.length),
        note: failure.note,
      }
    }
    submitted.push(...batch)
  }
  return { status: 'bwt-200', submitted, skipped: urls.slice(submitted.length), note: 'quota before: daily ' + quota.daily + ' / monthly ' + quota.monthly }
}
