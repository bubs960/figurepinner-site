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
 *   node scripts/indexnow-ping.mjs                    # routine deploy: priority URLs
 *   node scripts/indexnow-ping.mjs --full             # rare full sitemap resubmission
 *   node scripts/indexnow-ping.mjs <url...>           # submit explicit changed URLs
 *   node scripts/indexnow-ping.mjs --fandom <name>    # rolling-fandom deploy: submit that
 *                                                     #   fandom's live child sitemap URLs
 *   node scripts/indexnow-ping.mjs --urls-file <path> # submit URLs from a file (one per line)
 *
 * --fandom / --urls-file (2026-08-27, per the rolling per-fandom enrichment
 * program — WEBAUDIT-TO-WEB-SITEMAP-LASTMOD-ENRICHMENT-GAP addendum §2):
 * explicit CLI URLs cap out around ~300 on Windows and a fandom is thousands.
 * --fandom reads the LIVE child sitemap (/sitemap/<name>.xml) so it submits
 * ONLY sitemap-emitted (above-bar) URLs — never the raw figure list; below-bar
 * pages are noindexed and submitting them is a mixed signal. Fetched via
 * curl.exe with a Chrome UA (the Bot-Fight-immune probe recipe the deploy
 * chain already uses; Node fetch's TLS fingerprint is 403'd regardless of UA).
 * Run it AFTER the fandom's deploy + cache purge so the sitemap read is fresh
 * — as a third command block, not inside the deploy chain (whose auto-run
 * stays priority-mode).
 */

import { readFileSync, existsSync, appendFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const KEY = '6d21e3af4a7a44f9a1a0c0fba6518a49'
const HOST = 'figurepinner.com'
const SITEMAP = 'https://' + HOST + '/sitemap.xml'
const ENDPOINT = 'https://api.indexnow.org/IndexNow'
const BATCH_SIZE = 10000
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const args = process.argv.slice(2)
const FULL_SUBMIT = args.includes('--full') || process.env.INDEXNOW_FULL === '1'

function argValue(flag) {
  const i = args.indexOf(flag)
  return i !== -1 ? args[i + 1] : null
}

const DRY_RUN = args.includes('--dry-run') // source + count URLs, submit nothing
const FANDOM = argValue('--fandom')
const URLS_FILE = argValue('--urls-file')
if (FANDOM && !/^[a-z0-9-]+$/.test(FANDOM)) {
  console.error('[IndexNow] --fandom must be a bare fandom slug (e.g. star-wars), got: ' + FANDOM)
  process.exit(1)
}

const FLAG_VALUES = new Set([FANDOM, URLS_FILE].filter(Boolean))
const EXPLICIT_URLS = args.filter(
  (arg) => arg !== '--full' && !FLAG_VALUES.has(arg) && /^https:\/\/figurepinner\.com\//.test(arg),
)

const LOCAL_SITEMAP_PATHS = [
  '.next/server/app/sitemap.xml.body',
  '.next/standalone/.next/server/app/sitemap.xml.body',
]

const PRIORITY_URLS = [
  'https://figurepinner.com/',
  'https://figurepinner.com/guides',
  'https://figurepinner.com/guides/how-to-find-action-figure-values',
  'https://figurepinner.com/guides/most-valuable-wwe-elite-figures',
  'https://figurepinner.com/guides/marvel-legends-price-guide-2026',
  'https://figurepinner.com/guides/star-wars-black-series-hub',
  'https://figurepinner.com/guides/dc-multiverse-hub',
  'https://figurepinner.com/guides/tmnt-hub',
  // SDCC 2026 guide pulled 2026-07-23 (automation failure, Steve's call) —
  // don't re-add without checking WEB-SDCC-2026-TRACKING.md for current status.
]

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter(Boolean)
}

function withPriority(urls) {
  const set = new Set(urls)
  for (const u of PRIORITY_URLS) set.add(u)
  return [...set]
}

// ── Failed-batch log (build-verdict item C, 2026-08-27) ──────────────────────
// Console warnings die with the terminal window; a failed chunk in the
// post-deploy fandom submit would be unrecoverable once scrollback closes.
// Every finally-failed batch (and sitemap ping) appends one JSON line to
// .indexnow-failures.jsonl (repo root, gitignored, machine-local — same class
// as .kv-purge-state.json) so it can be re-submitted later via --urls-file.
// The log write itself is try/catch'd: it must never break the deploy chain.
const FAILURE_LOG = '.indexnow-failures.jsonl'
let RUN_MODE = 'unknown'

function logFailure(record) {
  try {
    appendFileSync(FAILURE_LOG, JSON.stringify({ ts: new Date().toISOString(), mode: RUN_MODE, ...record }) + '\n')
    console.warn('[IndexNow] failure recorded in ' + FAILURE_LOG + ' (re-submit later via --urls-file)')
  } catch (err) {
    console.warn('[IndexNow] could not write failure log (non-fatal): ' + err.message)
  }
}

function curlText(url) {
  return execFileSync('curl.exe', ['-s', '--fail', '-A', CHROME_UA, url], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
    windowsHide: true,
  })
}

/**
 * Serving gate (build-verdict item B, 2026-08-27): before a fandom submit,
 * prove the edge is serving THIS deploy — /api/healthz's build sha must match
 * the fp-build meta on a real served page from the fetched URL set. If they
 * disagree, the edge/ISR is still serving pre-deploy content and submitting
 * would notify engines about the OLD corpus, burning the freshness signal.
 * Enforced in-script rather than left as a runbook comment — procedural gates
 * get skipped. Returns true only on a verified match.
 */
function servingGatePasses(sampleUrl) {
  let healthzSha
  try {
    healthzSha = JSON.parse(curlText('https://' + HOST + '/api/healthz')).build
  } catch (err) {
    console.error('[IndexNow] serving gate: healthz fetch failed (' + (err.message || err) + ') — refusing to submit')
    return false
  }
  let pageSha = null
  try {
    const html = curlText(sampleUrl)
    pageSha = /name="fp-build"[^>]*content="([^"]+)"/.exec(html)?.[1] ?? null
  } catch (err) {
    console.error('[IndexNow] serving gate: sample page fetch failed (' + sampleUrl + ': ' + (err.message || err) + ') — refusing to submit')
    return false
  }
  if (!healthzSha || !pageSha || healthzSha !== pageSha) {
    console.error('[IndexNow] serving gate FAILED: healthz build=' + healthzSha + ' vs sample fp-build=' + pageSha + ' (' + sampleUrl + ')')
    console.error('[IndexNow] the edge is not serving this deploy yet — run the deploy chain purges first, then retry')
    return false
  }
  console.log('[IndexNow] serving gate OK: healthz build == sample fp-build == ' + healthzSha)
  return true
}

/**
 * Fetch one fandom's live child sitemap and return its <loc> URLs. curl.exe +
 * Chrome UA is the only shell path Bot Fight Mode admits (Node fetch 403s on
 * TLS fingerprint) — see CLAUDE.md deploy truth #3. Returns null on any
 * failure so the caller can refuse loudly rather than submit nothing silently.
 */
function getFandomSitemapUrls(fandom) {
  const url = 'https://' + HOST + '/sitemap/' + fandom + '.xml'
  let xml
  try {
    xml = curlText(url)
  } catch (err) {
    console.error('[IndexNow] curl fetch of ' + url + ' failed: ' + (err.message || err))
    return null
  }
  const urls = extractLocs(xml)
  if (urls.length === 0) {
    console.error('[IndexNow] ' + url + ' fetched but contained zero <loc> entries — wrong fandom slug, or the sitemap route 404-bodied')
    return null
  }
  console.log('[IndexNow] source: live child sitemap ' + url + ' (' + urls.length + ' URLs)')
  return urls
}

function getUrlsFromFile(path) {
  let text
  try {
    text = readFileSync(path, 'utf8')
  } catch (err) {
    console.error('[IndexNow] --urls-file read failed (' + path + '): ' + err.message)
    return null
  }
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const urls = lines.filter((l) => /^https:\/\/figurepinner\.com\//.test(l))
  const rejected = lines.length - urls.length
  if (rejected > 0) console.warn('[IndexNow] --urls-file: ' + rejected + ' non-figurepinner line(s) ignored')
  if (urls.length === 0) {
    console.error('[IndexNow] --urls-file contained zero valid figurepinner.com URLs')
    return null
  }
  console.log('[IndexNow] source: urls-file ' + path + ' (' + urls.length + ' URLs)')
  return urls
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

// 429 retry-with-backoff (2026-07-29): IndexNow 429'd on 2 consecutive deploys
// (b304ac3, cb1ee06) even at 8-URL priority-mode batches, well under
// BATCH_SIZE — not a batch-size problem, a rate-limit-on-the-endpoint problem.
// Bing is the working traffic channel (webaudit, WEBAUDIT-BING-CHANNEL-LOG.md),
// so a submitter that silently 429s every deploy is quietly throttling the
// channel that pays. Retries respect `Retry-After` when the endpoint sends
// one; falls back to a short fixed backoff otherwise. Still fully non-fatal —
// callers already treat every outcome as a warning, never a thrown error, so
// this can't break the deploy chain regardless of how IndexNow responds.
const RETRY_DELAYS_MS = [3000, 8000] // 2 retries after the first attempt = 3 tries total

function retryDelayMs(res, attempt) {
  const header = res?.headers?.get?.('retry-after')
  const headerSeconds = header ? Number(header) : NaN
  if (Number.isFinite(headerSeconds) && headerSeconds > 0) return headerSeconds * 1000
  return RETRY_DELAYS_MS[attempt] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function submitBatch(urlList, idx, total) {
  const body = { host: HOST, key: KEY, keyLocation: 'https://' + HOST + '/' + KEY + '.txt', urlList }
  const maxAttempts = RETRY_DELAYS_MS.length + 1

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let res
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
      })
    } catch (err) {
      console.warn('[IndexNow] batch ' + idx + '/' + total + ' network error (non-fatal): ' + err.message)
      logFailure({ batch: idx, of: total, urlCount: urlList.length, status: 'network-error', note: err.message, urls: urlList })
      return
    }

    if (res.ok || res.status === 202) {
      const retriedNote = attempt > 0 ? ' (after ' + attempt + ' retry/retries)' : ''
      console.log('[IndexNow] batch ' + idx + '/' + total + ' accepted (' + res.status + ')' + retriedNote + ' - ' + urlList.length + ' URLs')
      return
    }

    if (res.status === 429 && attempt < maxAttempts - 1) {
      const delay = retryDelayMs(res, attempt)
      console.warn('[IndexNow] batch ' + idx + '/' + total + ' got 429, retrying in ' + Math.round(delay / 1000) + 's (attempt ' + (attempt + 2) + '/' + maxAttempts + ')')
      await sleep(delay)
      continue
    }

    const text = await res.text()
    console.warn('[IndexNow] batch ' + idx + '/' + total + ' response ' + res.status + ' (non-fatal, giving up after ' + (attempt + 1) + ' attempt(s)): ' + text.slice(0, 200))
    logFailure({ batch: idx, of: total, urlCount: urlList.length, status: res.status, note: text.slice(0, 120), urls: urlList })
    return
  }
}

async function ping() {
  // Fandom / urls-file modes submit ONLY their own URL set — no priority
  // padding (the addendum's rule: sitemap-emitted URLs, nothing mixed in).
  // A null from either sourcing function is a hard exit: a fandom submit that
  // silently sent 0 URLs would read as "done" while sending no signal at all.
  let urls
  let mode
  if (FANDOM) {
    urls = getFandomSitemapUrls(FANDOM)
    mode = 'fandom:' + FANDOM
    if (!urls) process.exit(1)
    // Serving gate (item B): sample a figure page from the set we're about to
    // submit (falls back to the first URL — every page carries fp-build).
    // Dry runs still RUN the gate (so it's testable) but only report — a
    // pre-deploy dry-run legitimately sees the previous build.
    const sample = urls.find((u) => u.includes('/figure/')) ?? urls[0]
    const gateOk = servingGatePasses(sample)
    if (!gateOk && !DRY_RUN) process.exit(1)
    if (!gateOk && DRY_RUN) console.warn('[IndexNow] (dry run: gate result reported, not enforced)')
  } else if (URLS_FILE) {
    urls = getUrlsFromFile(URLS_FILE)
    mode = 'urls-file'
    if (!urls) process.exit(1)
  } else if (EXPLICIT_URLS.length > 0) {
    urls = withPriority(EXPLICIT_URLS)
    mode = 'explicit+priority'
  } else if (FULL_SUBMIT) {
    urls = await getSitemapUrls()
    mode = 'full sitemap'
  } else {
    urls = [...PRIORITY_URLS]
    mode = 'priority'
  }

  RUN_MODE = mode
  const batches = Math.ceil(urls.length / BATCH_SIZE)
  console.log('[IndexNow] mode: ' + mode + (DRY_RUN ? ' (DRY RUN)' : ''))
  if (DRY_RUN) {
    console.log('[IndexNow] dry run: would submit ' + urls.length + ' URLs in ' + batches + ' batch(es); first 3: ' + urls.slice(0, 3).join(' , '))
    console.log('[IndexNow] Done.')
    return
  }
  console.log('[IndexNow] Submitting ' + urls.length + ' URLs in ' + batches + ' batch(es) of up to ' + BATCH_SIZE + '...')

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE)
    await submitBatch(batch, Math.floor(i / BATCH_SIZE) + 1, batches)
  }

  const sitemapPingUrl = ENDPOINT + '?url=' + encodeURIComponent(SITEMAP) + '&key=' + KEY
  const maxSitemapAttempts = RETRY_DELAYS_MS.length + 1
  for (let attempt = 0; attempt < maxSitemapAttempts; attempt++) {
    let r
    try {
      r = await fetch(sitemapPingUrl, { method: 'GET' })
    } catch (err) {
      console.warn('[IndexNow] sitemap ping error (non-fatal): ' + err.message)
      break
    }
    if (r.ok || r.status === 202) {
      const retriedNote = attempt > 0 ? ' (after ' + attempt + ' retry/retries)' : ''
      console.log('[IndexNow] sitemap ping OK (' + r.status + ')' + retriedNote)
      break
    }
    if (r.status === 429 && attempt < maxSitemapAttempts - 1) {
      const delay = retryDelayMs(r, attempt)
      console.warn('[IndexNow] sitemap ping got 429, retrying in ' + Math.round(delay / 1000) + 's (attempt ' + (attempt + 2) + '/' + maxSitemapAttempts + ')')
      await sleep(delay)
      continue
    }
    console.warn('[IndexNow] sitemap ping FAIL (' + r.status + ', non-fatal, giving up after ' + (attempt + 1) + ' attempt(s))')
    logFailure({ batch: 'sitemap-ping', urlCount: 1, status: r.status, note: SITEMAP })
    break
  }

  console.log('[IndexNow] Done.')
}

ping()
