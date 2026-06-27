/**
 * indexnow-ping.mjs — post-deploy IndexNow submission
 *
 * Submits the FULL sitemap URL set to IndexNow (Bing + Yandex network) on every
 * deploy, so the entire price-oracle catalog gets a fast re-crawl signal — not
 * just a handful of hand-picked pages.
 *
 * WHY (2026-06-27, R5 traffic push): the sitemap has ~32,650 URLs but this script
 * previously submitted only 24 hardcoded URLs. The rest waited on slow organic
 * crawl (weeks). IndexNow accepts up to 10,000 URLs/request, so we read every
 * <loc> and submit in 10k batches. More indexed pages -> more "[figure] value"
 * searches land -> visits. Fully automated; runs in the deploy script.
 *
 * URL SOURCE: prefer the locally-built sitemap on disk
 * (.next/server/app/sitemap.xml.body) — no network, immune to Bot Fight Mode
 * (which 403s datacenter/non-browser fetches of the live sitemap). Falls back to
 * fetching the live sitemap, then to a small priority list, so it never no-ops.
 *
 * Protocol: https://www.indexnow.org/documentation
 * Usage: node scripts/indexnow-ping.mjs
 */

import { readFileSync, existsSync } from 'node:fs'

const KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4'
const HOST = 'figurepinner.com'
const SITEMAP = 'https://' + HOST + '/sitemap.xml'
const ENDPOINT = 'https://api.indexnow.org/IndexNow'
const BATCH_SIZE = 10000

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
  const urls = await getSitemapUrls()
  const batches = Math.ceil(urls.length / BATCH_SIZE)
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

  console.log('[IndexNow] Done - full catalog submitted for re-crawl.')
}

ping()
