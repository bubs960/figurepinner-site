#!/usr/bin/env node
/**
 * seo-preflight.mjs — G1 SEO-change preflight guardrail.
 *
 * WHY (2026-07-12 Google-zero incident, commit b01e823): a build shipped
 * ~11K figure pages with canonicals/sitemap entries pointing at the RAW KB
 * fandom slug (e.g. /marvel-comics/...) instead of the site's genre slug
 * (/marvel/...). /marvel-comics had a 404ing hub page and zero internal
 * links; the actually-live pages sat at /marvel with no canonical/sitemap
 * coverage pointing at them. Google dropped ~16K indexed pages in one step.
 * The root cause was a URL-building path that used f.fandom directly instead
 * of the canonical genreSlugForFandom() mapping — see kb.ts's prettyFigureUrl
 * and kbTypes.ts's SLUG_TO_FANDOM for the real fix.
 *
 * This script is G1 from WEBAUDIT-GUARDRAILS-PROPOSAL-2026-07-12.md
 * (PROPOSED status, binds web lane immediately as discipline): before ANY
 * deploy touching URL/canonical/robots/sitemap/redirect logic, run this by
 * hand and get PASS on all three checks:
 *
 *   1. Sample-URL matrix    — >=2 figures per fandom: served URL, meta
 *                             robots, canonical, and for the canonical
 *                             TARGET: 200 status, membership in exactly one
 *                             sitemap child, and >=1 internal link to it.
 *   2. Sitemap prefix census — URL count per top-level path prefix, per
 *                              sitemap child, diffed against prod. A NEW
 *                              prefix, or one fandom split across two
 *                              prefixes in one child, is the exact bug shape.
 *   3. Alias probe          — for every SLUG_TO_FANDOM entry, both URL
 *                             variants of one sample figure: exactly one
 *                             200, the other a 30x. Two 200s = twin
 *                             namespace = STOP. Both variants are built
 *                             independently (genreSlugForFandom(kbFandom) +
 *                             product_line + character_canonical, and the
 *                             raw-kbFandom equivalent) rather than by
 *                             calling prettyFigureUrl(f) and trusting its
 *                             output — see the note in "HOW THE KB IS
 *                             IMPORTED" below for why.
 *
 * ── WHICH BASE EACH CHECK HITS, AND WHY ─────────────────────────────────
 * --base (default http://localhost:3000) is the NEW candidate build about to
 * ship. PROD (hardcoded https://figurepinner.com) is what is currently live.
 *
 *   Check 1 fetches pages ONLY from --base: it is validating the candidate
 *   build's own internal consistency (served page, its canonical, and the
 *   canonical target's page/hub) before that build ever reaches prod. It
 *   never fetches prod. It DOES, however, need to test canonical-target
 *   sitemap membership by string-matching against <loc> entries, and those
 *   entries are always absolute https://figurepinner.com/... URLs no matter
 *   which host served the sitemap file (sitemap.ts hardcodes
 *   const BASE = 'https://figurepinner.com' regardless of environment) — so
 *   the match target is built with PROD_BASE + path even though the sitemap
 *   XML itself is fetched from --base.
 *
 *   Check 2 fetches sitemap children from BOTH --base (the candidate) and
 *   PROD (the live site) — the whole point is diffing candidate against
 *   live to catch a newly-introduced or newly-split namespace before it
 *   ships. The prod sitemap-child id list is read from PROD's own
 *   /robots.txt (not from the local KB's getAllFandoms()) so a fandom that
 *   exists locally but was never deployed does not produce a false
 *   "diff against nothing" pass.
 *
 *   Check 3 fetches ONLY --base, per the explicit spec: it is testing the
 *   candidate build's OWN redirect behavior for the raw-fandom alias, which
 *   is exactly the code path that broke on 2026-07-12.
 *
 * ── HOW THE KB IS IMPORTED ──────────────────────────────────────────────
 * Never redefine SLUG_TO_FANDOM / genreSlugForFandom / prettyFigureUrl / a
 * fandom list locally — that duplication is exactly how the original bug
 * happened.
 *
 * ONE DELIBERATE, NARROW EXCEPTION: checkAliasProbe (check 3) does NOT call
 * prettyFigureUrl(f) to get the path it tests. It builds the expected
 * canonical path itself from genreSlugForFandom(kbFandom) + product_line +
 * character_canonical (same imported genreSlugForFandom — not redefined,
 * just applied directly). This is intentional, not a violation of the rule
 * above: check 3's whole job is to catch a regression IN prettyFigureUrl
 * itself, so asking prettyFigureUrl what the answer should be and then
 * grading it against its own answer is circular and provides zero coverage
 * (this was a confirmed, shipped defect — fixed 2026-07-12, see
 * checkAliasProbe's comment). Do not "clean this up" back to
 * prettyFigureUrl(f); that reintroduces the exact blind spot.
 *
 * This script imports the REAL, LIVE modules (src/data/kbTypes.ts,
 * src/data/kb.ts) via the repo's existing test-time TS loader
 * (scripts/ts-loader.mjs). It self-registers that loader at the top of this
 * file (register() + a DYNAMIC import() of the KB modules afterward — a
 * static top-level import of a .ts module in the SAME file that calls
 * register() would be resolved before register() runs, per Node's module
 * hoisting; see the Node docs example for `register`), so this script can be
 * run standalone with no extra CLI flags:
 *
 *   node scripts/seo-preflight.mjs --base http://localhost:3000
 *
 * ── WAF NOTE ─────────────────────────────────────────────────────────────
 * figurepinner.com's Cloudflare Bot Fight Mode 403s (and silently lies to)
 * plain curl/PowerShell HttpClient/Node's bare fetch(). This script reuses
 * the verified-working requestText()/parseCurlResponse() recipe from
 * scripts/post-deploy-smoke-probe.mjs verbatim (curl.exe + a real
 * desktop-Chrome User-Agent on win32, fetch() fallback elsewhere), extended
 * only to capture the Location header (needed for the alias-probe redirect
 * check) and to NOT auto-follow redirects (checks need the raw 3xx).
 *
 * ── DEPLOY-CHAIN WIRING (NOT DONE HERE — NEEDS SIGN-OFF) ────────────────
 * This script does not touch package.json. Wiring it into `npm run deploy`
 * is a deploy-gate change and needs an explicit human sign-off separate from
 * writing the checks themselves. Once approved, it is designed to slot in
 * right after predeploy-clean-check.mjs in the "deploy" script, e.g.:
 *
 *   "deploy": "node scripts/predeploy-clean-check.mjs && node scripts/seo-preflight.mjs --base http://localhost:3000 && npm test && ..."
 *
 * (that would require a locally running build at that point in the chain —
 * an open design question for whoever wires it in, not resolved here).
 *
 * Until then, run it by hand against a locally running `next dev` or
 * `next start`:
 *
 *   node scripts/seo-preflight.mjs --base http://localhost:3000
 *
 * Exit 0 = all three checks pass. Exit 1 = at least one STOP (see printed
 * detail — every failure across all three checks is collected and printed
 * before exiting, not just the first one hit).
 * Pure Node stdlib + the repo's existing ts-loader machinery. No new npm
 * dependencies. ASCII-only output (PowerShell cp1252-safe).
 */

import { execFileSync } from 'node:child_process'
import { register } from 'node:module'

register('./ts-loader.mjs', import.meta.url)

// Dynamic import (not static) — see the header comment above: register()
// must have already run before these resolve.
const { getAllFandoms, getFiguresByFandom, prettyFigureUrl, hasUniquePrettyFigureUrl } =
  await import('../src/data/kb.ts')
const { SLUG_TO_FANDOM, genreSlugForFandom } = await import('../src/data/kbTypes.ts')

// ── CLI ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const baseIdx = args.indexOf('--base')
const BASE = (baseIdx !== -1 && args[baseIdx + 1] ? args[baseIdx + 1] : 'http://localhost:3000').replace(/\/$/, '')
const PROD_BASE = 'https://figurepinner.com'

const LINE = '='.repeat(66)
const LOG = '[seo-preflight]'
const TIMEOUT_S = 60 // generous: `next dev` cold-compiles a route on first hit

// ── HTTP (curl.exe recipe from post-deploy-smoke-probe.mjs) ────────────────

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const BROWSER_ACCEPT = 'application/json,text/html,application/xhtml+xml,application/xml'

function parseCurlResponse(raw) {
  // Only the header block is line-oriented; the body can legitimately contain
  // blank lines (any real HTML/XML body does), so split on the FIRST blank
  // line after the LAST "HTTP/" status line, not by naively splitting the
  // whole response on every "\n\n".
  const normalized = raw.replace(/\r\n/g, '\n')
  const lastStatusAt = normalized.lastIndexOf('\nHTTP/')
  const headerStart = lastStatusAt === -1 ? 0 : lastStatusAt + 1
  const boundary = normalized.indexOf('\n\n', headerStart)
  const headerBlock = boundary === -1 ? normalized.slice(headerStart) : normalized.slice(headerStart, boundary)
  const body = boundary === -1 ? '' : normalized.slice(boundary + 2)
  const status = Number(/^HTTP\/\S+\s+(\d+)/m.exec(headerBlock)?.[1] ?? 0)
  const locationMatch = /^location:\s*(\S+)/im.exec(headerBlock)
  const location = locationMatch ? locationMatch[1] : null
  return { status, body, location }
}

function requestText(url) {
  if (process.platform === 'win32') {
    let raw
    try {
      raw = execFileSync('curl.exe', [
        '-sS', '-D', '-',
        '--max-time', String(TIMEOUT_S),
        // Redirects must NOT be auto-followed -- checks 1 and 3 need the raw
        // 3xx/200 status and (for check 3) the Location header itself.
        '-H', `User-Agent: ${BROWSER_UA}`,
        '-H', `Accept: ${BROWSER_ACCEPT}`,
        url,
      ], {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 30, // largest observed sitemap child (wrestling.xml) is ~1.5MB
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      })
    } catch (e) {
      const stderrTxt = (e.stderr ?? '').toString().trim()
      throw new Error(`request to ${url} failed: ${stderrTxt || e.message}`)
    }
    return parseCurlResponse(raw)
  }
  return fetch(url, { headers: { 'user-agent': BROWSER_UA, accept: BROWSER_ACCEPT }, redirect: 'manual' })
    .then(async res => ({ status: res.status, body: await res.text().catch(() => ''), location: res.headers.get('location') }))
    .catch(e => { throw new Error(`request to ${url} failed: ${e.message}`) })
}

async function safeRequestText(url) {
  try {
    return await requestText(url)
  } catch (e) {
    return { status: 0, body: '', location: null, error: String(e.message || e) }
  }
}

async function assertBaseReachable(base) {
  console.log(`${LOG} checking --base is reachable: ${base}`)
  try {
    await requestText(`${base}/`)
  } catch (e) {
    console.log('\n' + LINE)
    console.log(`${LOG} CANNOT REACH --base ${base}`)
    console.log(`${LOG} ${String(e.message || e).split('\n')[0]}`)
    console.log(`${LOG} Is a local build running? Start one first, e.g.:`)
    console.log(`${LOG}   npm run dev            (next dev, slower first hit per route)`)
    console.log(`${LOG}   npm run build:cf && npx next start   (closer to prod behavior)`)
    console.log(`${LOG} then rerun:  node scripts/seo-preflight.mjs --base ${base}`)
    console.log(LINE)
    process.exit(1)
  }
}

// ── Sitemap helpers ─────────────────────────────────────────────────────────

function extractLocs(xmlBody) {
  const out = []
  const re = /<loc>([^<]+)<\/loc>/g
  let m
  while ((m = re.exec(xmlBody))) out.push(m[1].trim())
  return out
}

/** First path segment of an absolute URL, e.g. https://x/marvel/foo -> "marvel". */
function prefixOf(absUrl) {
  try {
    const seg = new URL(absUrl).pathname.split('/').filter(Boolean)[0]
    return seg || '(root)'
  } catch {
    return '(unparseable: ' + absUrl + ')'
  }
}

async function fetchSitemapChild(base, id) {
  const url = `${base}/sitemap/${id}.xml`
  const res = await safeRequestText(url)
  if (res.status !== 200) return { id, url, status: res.status, locs: [], ok: false, error: res.error }
  return { id, url, status: res.status, locs: extractLocs(res.body), ok: true }
}

async function fetchAllSitemapChildren(base, ids) {
  const result = new Map()
  for (const id of ids) {
    result.set(id, await fetchSitemapChild(base, id))
  }
  return result
}

/** Read the true list of currently-live sitemap child ids from PROD's own
 *  /robots.txt, rather than assuming --base's KB fandom list also describes
 *  what prod currently has deployed. */
async function fetchProdSitemapIds() {
  const res = await safeRequestText(`${PROD_BASE}/robots.txt`)
  if (res.status !== 200) return []
  const ids = []
  const re = /^Sitemap:\s*(\S+)/gim
  let m
  while ((m = re.exec(res.body))) {
    const mm = /\/sitemap\/([^/]+)\.xml$/.exec(m[1])
    if (mm) ids.push(mm[1])
  }
  return ids
}

// ── Check 1: Sample-URL matrix ──────────────────────────────────────────────

async function checkSampleUrlMatrix(base, localChildren) {
  const failures = []
  const infoLines = []
  const fandoms = getAllFandoms()

  for (const fandom of fandoms) {
    const figs = getFiguresByFandom(fandom).slice(0, 2)
    if (!figs.length) {
      infoLines.push(`WARN fandom "${fandom}" has zero figures in the KB -- skipped`)
      continue
    }

    const genreSlug = genreSlugForFandom(fandom)

    for (const f of figs) {
      const servedPath = prettyFigureUrl(f)
      const served = await safeRequestText(`${base}${servedPath}`)

      if (served.status !== 200) {
        failures.push(`STOP [1:sample-matrix] ${f.figure_id}: served URL ${servedPath} returned ${served.status} (expected 200)${served.error ? ' -- ' + served.error : ''}`)
        continue
      }

      const robotsMatch = /<meta[^>]*name="robots"[^>]*content="([^"]+)"/i.exec(served.body)
      const metaRobots = robotsMatch ? robotsMatch[1] : '(no <meta name="robots"> found)'

      const canonicalMatch = /<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i.exec(served.body)
      if (!canonicalMatch) {
        failures.push(`STOP [1:sample-matrix] ${f.figure_id}: served URL ${servedPath} has NO <link rel="canonical"> tag`)
        continue
      }
      const canonicalAbs = canonicalMatch[1]
      let canonicalPath
      try { canonicalPath = new URL(canonicalAbs).pathname } catch { canonicalPath = canonicalAbs }

      // Fetch the canonical TARGET. When it's the same path as the served
      // URL (the common case for a unique figure, which self-canonicalizes)
      // reuse the response already in hand instead of fetching it twice.
      const target = canonicalPath === servedPath ? served : await safeRequestText(`${base}${canonicalPath}`)
      if (target.status !== 200) {
        failures.push(`STOP [1:sample-matrix] ${f.figure_id}: canonical target ${canonicalPath} returned ${target.status} (expected 200) -- 404ing canonical target is the exact 2026-07-12 bug shape${target.error ? ' -- ' + target.error : ''}`)
        continue
      }

      // Sitemap <loc> entries are always absolute https://figurepinner.com
      // URLs regardless of which host served the XML (sitemap.ts hardcodes
      // its BASE) -- so match against PROD_BASE + path even though we only
      // ever fetched the sitemap XML itself from --base.
      const canonicalAbsForMatch = `${PROD_BASE}${canonicalPath}`
      const memberChildren = []
      for (const [id, child] of localChildren) {
        if (child.ok && child.locs.includes(canonicalAbsForMatch)) memberChildren.push(id)
      }
      if (memberChildren.length === 0) {
        failures.push(`STOP [1:sample-matrix] ${f.figure_id}: canonical target ${canonicalPath} is ORPHANED -- appears in ZERO sitemap children (expected exactly 1)`)
      } else if (memberChildren.length > 1) {
        failures.push(`STOP [1:sample-matrix] ${f.figure_id}: canonical target ${canonicalPath} appears in ${memberChildren.length} sitemap children (${memberChildren.join(', ')}) -- twins another live URL, expected exactly 1`)
      }

      // Internal-link check. Real site architecture (verified against
      // current source): the character hub page links figures via the
      // pretty URL (prettyFigureUrl); the line hub page links figures via
      // the stable /figure/[id] URL. Which hub to check depends on which
      // form the canonical target actually took.
      const isFallbackForm = canonicalPath.startsWith('/figure/')
      const hubPath = isFallbackForm
        ? `/${genreSlug}/${f.product_line}`
        : `/${genreSlug}/character/${f.character_canonical}`
      const hub = await safeRequestText(`${base}${hubPath}`)
      const linked = hub.status === 200 && hub.body.includes(`href="${canonicalPath}"`)
      if (!linked) {
        failures.push(`STOP [1:sample-matrix] ${f.figure_id}: canonical target ${canonicalPath} has NO internal link from its hub page ${hubPath} (hub status ${hub.status}) -- orphaned page + no internal links is the exact 2026-07-12 bug shape`)
      }

      infoLines.push(`PASS [1:sample-matrix] ${f.figure_id}: served=${servedPath} robots="${metaRobots}" canonical-target=${canonicalPath} sitemap-children=[${memberChildren.join(',')}] linked-from=${hubPath}`)
    }
  }

  return { failures, infoLines }
}

// ── Check 2: Sitemap prefix census ──────────────────────────────────────────

async function checkSitemapPrefixCensus(localChildren) {
  const failures = []
  const infoLines = []

  const localPrefixByChild = new Map()
  for (const [id, child] of localChildren) {
    if (!child.ok) {
      failures.push(`STOP [2:prefix-census] local sitemap child "${id}" did not return 200 (got ${child.status}) at ${child.url}${child.error ? ' -- ' + child.error : ''}`)
      continue
    }
    const counts = new Map()
    for (const loc of child.locs) counts.set(prefixOf(loc), (counts.get(prefixOf(loc)) ?? 0) + 1)
    localPrefixByChild.set(id, counts)

    if (id === 'static') continue // the static child legitimately spans many top-level pages

    // /figure/<id> is always a legitimate secondary prefix in a fandom child
    // (the stable-ID fallback for ambiguous figures) -- it is not a twin
    // namespace. Anything beyond that plus ONE genre prefix is the bug shape.
    const nonFigurePrefixes = [...counts.keys()].filter(p => p !== 'figure')
    if (nonFigurePrefixes.length > 1) {
      failures.push(`STOP [2:prefix-census] sitemap child "${id}.xml" spans ${nonFigurePrefixes.length} distinct non-/figure/ URL prefixes (${nonFigurePrefixes.join(', ')}) -- one logical fandom section split across two namespaces in one child is the exact 2026-07-12 bug shape (/marvel AND /marvel-comics both showed up in one child)`)
    }
  }

  const prodIds = await fetchProdSitemapIds()
  if (!prodIds.length) {
    infoLines.push('WARN could not read the prod sitemap child id list from https://figurepinner.com/robots.txt -- skipping the local/prod prefix diff (child-purity check above still ran)')
  } else {
    const prodChildren = await fetchAllSitemapChildren(PROD_BASE, prodIds)
    const prodPrefixes = new Set()
    for (const [, child] of prodChildren) {
      if (!child.ok) continue
      for (const loc of child.locs) prodPrefixes.add(prefixOf(loc))
    }
    const localPrefixes = new Set()
    for (const [, counts] of localPrefixByChild) for (const p of counts.keys()) localPrefixes.add(p)

    // Non-fandom feature routes (not KB-driven, never a twin-namespace risk)
    // that are expected to appear as a new sitemap prefix once, on the deploy
    // that ships them. 'today' = Daily Grail Spotlight (4286507, 2026-07-13).
    const KNOWN_NEW_FEATURE_PREFIXES = new Set(['today'])

    const newPrefixes = [...localPrefixes].filter(p => !prodPrefixes.has(p) && !KNOWN_NEW_FEATURE_PREFIXES.has(p))
    if (newPrefixes.length) {
      failures.push(`STOP [2:prefix-census] NEW top-level sitemap prefix(es) present locally but not in PROD: ${newPrefixes.join(', ')} -- if this is a deliberate new fandom/section, confirm by eye before shipping; if not, it is the exact 2026-07-12 bug shape (a new accidental namespace)`)
    }
    infoLines.push(`prod sitemap children: ${prodIds.length}, prod distinct top-level prefixes: ${prodPrefixes.size}; local sitemap children: ${localPrefixByChild.size}, local distinct top-level prefixes: ${localPrefixes.size}`)
  }

  return { failures, infoLines }
}

// ── Check 3: Alias probe ────────────────────────────────────────────────────

async function checkAliasProbe(base) {
  const failures = []
  const infoLines = []

  for (const [urlSlug, kbFandom] of Object.entries(SLUG_TO_FANDOM)) {
    const candidates = getFiguresByFandom(kbFandom)
    // A figure whose pretty URL already falls back to /figure/[id] (ambiguous)
    // has no genre segment to alias-swap -- pick one with a real pretty URL.
    const f = candidates.find(c => hasUniquePrettyFigureUrl(c))
    if (!f) {
      infoLines.push(`WARN "${urlSlug}" <-> "${kbFandom}": no figure in this fandom has a unique pretty URL to test with -- skipped`)
      continue
    }

    // Reconstruct the expected canonical path INDEPENDENTLY of
    // prettyFigureUrl(f)'s own output. The previous version called
    // prettyFigureUrl(f) to get canonicalPath and then validated THAT
    // output's shape before proceeding -- so when prettyFigureUrl itself
    // regresses (e.g. reverts to raw f.fandom instead of
    // genreSlugForFandom(f.fandom)), the shape-guard fails for every
    // SLUG_TO_FANDOM pair simultaneously and this check WARNs-and-skips
    // instead of ever reaching the two-200s STOP logic below -- i.e. it
    // provided ZERO coverage for the exact regression it exists to catch
    // (confirmed defect, 2026-07-12 review). Build both path variants
    // directly from kbFandom/product_line/character_canonical so a broken
    // prettyFigureUrl cannot hide from this check.
    const canonicalPath = `/${genreSlugForFandom(kbFandom)}/${f.product_line}/${f.character_canonical}`
    const rawPath = `/${kbFandom}/${f.product_line}/${f.character_canonical}`

    const canonicalRes = await safeRequestText(`${base}${canonicalPath}`)
    const rawRes = await safeRequestText(`${base}${rawPath}`)

    const canonicalIs200 = canonicalRes.status === 200
    const rawIsRedirect = rawRes.status >= 300 && rawRes.status < 400
    const rawIs200 = rawRes.status === 200

    if (canonicalIs200 && rawIsRedirect) {
      infoLines.push(`PASS [3:alias-probe] "${urlSlug}"<->"${kbFandom}": canonical ${canonicalPath} =200, raw-fandom ${rawPath} =${rawRes.status}${rawRes.location ? ' -> ' + rawRes.location : ''}`)
    } else if (canonicalIs200 && rawIs200) {
      failures.push(`STOP [3:alias-probe] "${urlSlug}"<->"${kbFandom}": TWO 200s -- canonical ${canonicalPath} AND raw-fandom ${rawPath} both serve live content. Twin namespace, the exact 2026-07-12 bug.`)
    } else if (!canonicalIs200) {
      failures.push(`STOP [3:alias-probe] "${urlSlug}"<->"${kbFandom}": canonical form ${canonicalPath} did not return 200 (got ${canonicalRes.status})${canonicalRes.error ? ' -- ' + canonicalRes.error : ''}`)
    } else {
      failures.push(`STOP [3:alias-probe] "${urlSlug}"<->"${kbFandom}": raw-fandom form ${rawPath} returned ${rawRes.status} (expected a 30x redirect to the canonical form)${rawRes.error ? ' -- ' + rawRes.error : ''}`)
    }
  }

  return { failures, infoLines }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(LINE)
  console.log(`${LOG} G1 SEO preflight -- candidate: ${BASE}  |  prod (diff target): ${PROD_BASE}`)
  console.log(LINE)

  await assertBaseReachable(BASE)

  const localIds = ['static', ...getAllFandoms()]
  console.log(`${LOG} fetching ${localIds.length} local sitemap children from ${BASE} (shared by checks 1 and 2) ...`)
  const localChildren = await fetchAllSitemapChildren(BASE, localIds)

  console.log(`${LOG} running check 1/3: sample-URL matrix ...`)
  const c1 = await checkSampleUrlMatrix(BASE, localChildren)

  console.log(`${LOG} running check 2/3: sitemap prefix census (vs prod) ...`)
  const c2 = await checkSitemapPrefixCensus(localChildren)

  console.log(`${LOG} running check 3/3: alias probe ...`)
  const c3 = await checkAliasProbe(BASE)

  const allInfo = [...c1.infoLines, ...c2.infoLines, ...c3.infoLines]
  const allFailures = [...c1.failures, ...c2.failures, ...c3.failures]

  console.log('\n' + LINE)
  console.log(`${LOG} DETAIL`)
  console.log(LINE)
  for (const line_ of allInfo) console.log(`${LOG} ${line_}`)

  console.log('\n' + LINE)
  if (allFailures.length) {
    console.log(`${LOG} ${allFailures.length} STOP condition(s) found:`)
    console.log(LINE)
    for (const f of allFailures) console.log(`${LOG} ${f}`)
    console.log(LINE)
    console.log(`${LOG} RESULT: FAIL -- do not ship this build's URL/canonical/sitemap changes until every STOP above is resolved.`)
    process.exit(1)
  }

  console.log(`${LOG} RESULT: PASS -- ${c1.infoLines.filter(l => l.startsWith('PASS')).length} sampled figure(s), ` +
    `${localIds.length} local sitemap children, ${c3.infoLines.filter(l => l.startsWith('PASS')).length}/${Object.keys(SLUG_TO_FANDOM).length} alias pairs checked, 0 STOPs.`)
  console.log(LINE)
}

main().catch(e => {
  console.log('\n' + LINE)
  console.log(`${LOG} UNEXPECTED ERROR: ${e && e.stack ? e.stack : e}`)
  console.log(LINE)
  process.exit(1)
})
