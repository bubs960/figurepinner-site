/**
 * indexnow-ping.mjs — post-deploy IndexNow submission
 *
 * Submits a small priority URL set to IndexNow (Bing + Yandex network) on
 * routine deploys, plus a sitemap ping. This avoids telling Bing the whole
 * catalog changed every time we ship a code-only fix.
 *
 * WHY (2026-06-27): IndexNow is strongest when used as a changed-URL signal.
 * The earlier R5 traffic push submitted the full sitemap on deploy; that was
 * useful once, but too noisy as a permanent default. Use --full only for rare
 * catalog/schema recrawl pushes where we intentionally want every sitemap URL
 * resubmitted.
 *
 * URL SOURCE: prefer the locally-built sitemap on disk
 * (.next/server/app/sitemap.xml.body) — no network, immune to Bot Fight Mode
 * (which 403s datacenter/non-browser fetches of the live sitemap). Falls back to
 * fetching the live sitemap, then to a small priority list.
 *
 * Protocol: https://www.indexnow.org/documentation
 * Usage:
 *   node scripts/indexnow-ping.mjs           # routine deploy: priority URLs
 *   node scripts/indexnow-ping.mjs --full    # rare full sitemap resubmission
 *   node scripts/indexnow-ping.mjs <url...>  # submit explicit changed URLs
 */

import { readFileSync, existsSync } from 'node:fs'

const KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4'
const HOST = 'figurepinner.com'
const SITEMAP = 'https://' + HOST + '/sitemap.xml'
const ENDPOINT = 'https://api.indexnow.org/IndexNow'
const BATCH_SIZE = 10000
const args = process.argv.slice(2)
const FULL_SUBMIT = args.includes('--full') || process.env.INDEXNOW_FULL === '1'
const EXPLICIT_URLS = args.filter((arg) => arg !== '--full' && /^https:\/\/figurepinner\.com\//.test(arg))

const LOCAL_SITEMAP_PATHS = [
  '.next/server/app/sitemap.xml.body',
  '.next/standalone/.next/server/app/sitemap.xml.body',
]

const PRIORITY_URLS = [
  'https://figurepinner.com/wrestling/elite/cm-punk',
  'https://figurepinner.com/wrestling/elite/roman-reigns',
  'https://figurepinner.com/marvel/marvel-legends/spider-man',
  'https://figurepinner.com/star-wars/the-black-series/darth-vader',
  'https://figurepinner.com/transformers/masterpiece/optimus-prime',
  'https://figurepinner.com/dc/multiverse/batman',
  'https://figurepinner.com/guides/marvel-legends-price-guide-2026',
  'https://figurepinner.com/guides/how-to-find-action-figure-values',
]

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter(Boolean)
}

function withPriority(urls) {
  const set = new Set(urls)
  for (const u of PRIORITY_URLS) set.add(u)
  return [...set]
}

async function getSitemapUrls() {
  // 1) Local built sitemap (preferred — no network, no Bot Fight).
  for (const p of LOCAL_SITEMAP_PATHS) {
    try {
      if (existsSync(p)) {
        const xml = readFileSync(p, 'utf8')
        const urls = extractLocs(xml)
        if (urls.length > 0) {
          console.log('[IndexNow] source: local file ' + p + ' (' + urls.length + ' URLs)')
          return withPriority(urls)
        }
      }
    } catch (err) {
      console.warn('[IndexNow] local sitemap read failed (' + p + '): ' + err.message)
    }
  }
  // 2) Live fetch fallback.
  try {
    const res = await fetch(SITEMAP, { headers: { 'User-Agent': 'figurepinner-indexnow/1.0' } })
    if (res.ok) {
      const urls = extractLocs(await res.text())
      console.log('[IndexNow] source: live fetch (' + urls.length + ' URLs)')
      return withPriority(urls)
    }
    console.warn('[IndexNow] live sitemap fetch ' + res.status + ' - falling back to priority URLs only')
  } catch (err) {
    console.warn('[IndexNow] live sitemap fetch error (' + err.message + ') - priority URLs only')
  }
  // 3) Last resort.
  console.log('[IndexNow] source: priority URLs only (' + PRIORITY_URLS.length + ')')
  return [...PRIORITY_URLS]
}

async function submitBatch(urlList, idx, total) {
  const body = { host: HOST, key: KEY, keyLocation: 'https://' + HOST + '/' + KEY + '.txt', urlList }
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    })
    if (res.ok || res.status === 202) {
      console.log('[IndexNow] batch ' + idx + '/' + total + ' accepted (' + res.status + ') - ' + urlList.length + ' URLs')
    } else {
      const text = await res.text()
      console.warn('[IndexNow] batch ' + idx + '/' + total + ' response ' + res.status + ': ' + text.slice(0, 200))
    }
  } catch (err) {
    console.warn('[IndexNow] batch ' + idx + '/' + total + ' network error (non-fatal): ' + err.message)
  }
}

async function ping() {
  const urls = EXPLICIT_URLS.length > 0
    ? withPriority(EXPLICIT_URLS)
    : FULL_SUBMIT
      ? await getSitemapUrls()
      : [...PRIORITY_URLS]

  const batches = Math.ceil(urls.length / BATCH_SIZE)
  const mode = EXPLICIT_URLS.length > 0 ? 'explicit+priority' : FULL_SUBMIT ? 'full sitemap' : 'priority'
  console.log('[IndexNow] mode: ' + mode)
  console.log('[IndexNow] Submitting ' + urls.length + ' URLs in ' + batches + ' batch(es) of up to ' + BATCH_SIZE + '...')

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE)
    await submitBatch(batch, Math.floor(i / BATCH_SIZE) + 1, batches)
  }

  try {
    const r = await fetch(ENDPOINT + '?url=' + encodeURIComponent(SITEMAP) + '&key=' + KEY, { method: 'GET' })
    const ok = r.ok || r.status === 202
    console.log('[IndexNow] sitemap ping ' + (ok ? 'OK' : 'FAIL') + ' (' + r.status + ')')
  } catch (err) {
    console.warn('[IndexNow] sitemap ping error (non-fatal): ' + err.message)
  }

  console.log('[IndexNow] Done.')
}

ping()
