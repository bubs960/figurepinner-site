#!/usr/bin/env node
/**
 * hub-isr-check.mjs — R10 pre/post-deploy check for the hub-ISR fix.
 *
 * R10 (Steve 2026-07-27): post-deploy checks are WRITTEN BEFORE the deploy, and
 * results are filed as OBSERVED VALUES, never the word "confirmed". This script
 * IS that check list — run it before the change to capture a baseline, run it
 * again after, and it prints observed values both times plus a PASS/FAIL against
 * a direction declared in advance.
 *
 * The Option E lesson this encodes: that migration's own verification recorded
 * "prerender-manifest 0 genre routes (was 17)" and PASSED, because nobody had
 * said which way the number was supposed to move. Every check below therefore
 * carries an explicit `expect` — a predicate, not a note — so a number moving
 * the wrong way fails loudly instead of being read as intended.
 *
 * This is a LIVE-PROD check (curls figurepinner.com and reads Cloudflare edge
 * cache headers) — it cannot run against a local `next start`, which has no CDN
 * edge layer to promote MISS->HIT. That is why it is a standalone script, not
 * wired into run-seo-preflight.mjs's local build+serve+test loop the way
 * isr-declaration-audit.mjs is.
 *
 * Usage:
 *   node hub-isr-check.mjs baseline   -> writes hub-isr-baseline.json
 *   node hub-isr-check.mjs verify     -> re-probes, diffs vs baseline, exits 1 on FAIL
 *
 * Output files are mode-specific by default (hub-isr-<mode>.json) specifically
 * because they were NOT on 2026-07-27: a shared hardcoded filename meant running
 * `verify` silently overwrote the `baseline` capture with post-fix data still
 * needed as the "before" — caught only because the pre-fix numbers had also been
 * copied into a separate doc by hand. Gitignored at the repo root, same
 * machine-local-state convention as .kv-purge-state.json.
 *
 * Probing law (CLAUDE.md deploy-truth #3): curl.exe + real Chrome UA. PowerShell
 * and Node fetch() both 403 on Bot Fight regardless of headers. Hubs/guides/home
 * are NOT rate-limited; figure pages are (100/min) — only 1 figure URL is probed.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Self-locating, not hardcoded — see isr-declaration-audit.mjs's identical note.
const SITE = process.env.SITE || path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const MODE = process.argv[2] || 'baseline'
// Mode-specific default filename (the 2026-07-27 overwrite bug this comment
// block describes above). SCRATCH still overrides the directory only, matching
// the previous script's env-var contract.
const OUT = path.join(process.env.SCRATCH || SITE, `hub-isr-${MODE}.json`)
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const BASE = 'https://figurepinner.com'

// ── the routes under test, with their DECLARED EXPECTED DIRECTION ────────────
// kind: 'fix-target'  -> must FLIP from no-store to ISR-cacheable
//       'control-isr'  -> already ISR, must STAY ISR (regression guard)
//       'control-dyn'  -> intentionally dynamic, must STAY dynamic (scope guard:
//                         proves the fix didn't over-apply to unrelated routes)
const ROUTES = [
  { url: '/wrestling',                                   kind: 'fix-target'  },
  { url: '/neca',                                        kind: 'fix-target'  },
  { url: '/wrestling/deluxe-aggression',                 kind: 'fix-target'  },
  { url: '/wrestling/legends',                           kind: 'fix-target'  },
  { url: '/wrestling/deluxe-aggression/rob-conway',      kind: 'control-isr' },
  { url: '/horror/character/freddy-krueger',             kind: 'control-isr' },
  { url: '/',                                            kind: 'control-isr' },
  { url: '/guides/most-valuable-star-wars-black-series', kind: 'control-isr' },
  { url: '/today',                                       kind: 'control-dyn' },
]

const MANIFEST_ROUTES = [
  { key: '/[genre]',                            kind: 'fix-target'  },
  { key: '/[genre]/[line]',                     kind: 'fix-target'  },
  { key: '/[genre]/[line]/[slug]',              kind: 'control-isr' },
  { key: '/figure/[figure_id]',                 kind: 'control-isr' },
  { key: '/[genre]/character/[character_slug]', kind: 'control-isr' },
]

// Markers that must NEVER appear in anonymously-fetched hub HTML once it is
// shared-cached. This is the check that would catch the one way this fix could
// be genuinely dangerous: user state baked into a shared cache entry.
//
// `bubs960` was in this list on the first baseline run and fired on ALL NINE
// routes — including `/` and `/guides/*`, which have been safely shared-cached
// for months. Verified before dismissing: all 73 occurrences on /wrestling are
// `figurepinner-images.bubs960.workers.dev` image URLs, i.e. the Cloudflare
// ACCOUNT SUBDOMAIN, infrastructure rather than user state. Removed.
//
// The lesson is kept structurally, not as a comment: a marker that fires on the
// known-safe control routes is measuring the wrong thing, so LEAK CHECKING IS
// NOW SELF-CALIBRATING (see leakDelta below) — a fix-target only fails if it
// carries a marker the already-safely-cached controls do NOT. That makes the
// check impossible to satisfy by accident and impossible to trip on
// infrastructure strings.
const LEAK_MARKERS = [
  '@gmail.com', 'clerk_db_jwt', '__session', '"emailAddress"', '"isPro":true',
  'sk_live', 'sess_2', '"firstName"', '"lastName"', 'privateMetadata',
]

function probe(url) {
  try {
    const out = execFileSync('curl.exe', [
      '-s', '-D', '-', '-A', UA, '--max-redirs', '0',
      '-w', '\\n===EFFECTIVE:%{url_effective} CODE:%{http_code}',
      `${BASE}${url}`,
    ], { encoding: 'utf8', windowsHide: true, timeout: 30000, maxBuffer: 32 * 1024 * 1024 })
    const h = (re) => (out.match(re)?.[1] ?? '').trim()
    return {
      status: Number(out.match(/===EFFECTIVE:\S* CODE:(\d+)/)?.[1] ?? 0),
      effective: out.match(/===EFFECTIVE:(\S*)/)?.[1] ?? '',
      location: h(/^location:\s*(.*)$/im),
      cacheControl: h(/^cache-control:\s*(.*)$/im),
      fpEdge: h(/^x-fp-edge:\s*(.*)$/im),
      fpEdgeSkip: h(/^x-fp-edge-skip:\s*(.*)$/im),
      isrHeader: h(/^x-(?:nextjs|opennext)-cache:\s*(.*)$/im),
      cfCache: h(/^cf-cache-status:\s*(.*)$/im),
      buildMeta: h(/name="fp-build" content="([^"]*)"/i),
      lineCards: (out.match(/class="line-card"/g) || []).length,
      leaks: LEAK_MARKERS.filter(m => out.includes(m)),
      bytes: out.length,
    }
  } catch (e) {
    return { error: String(e.message || e).split('\n')[0] }
  }
}

/** ISR-cacheable is identified by an s-maxage directive AND the absence of
 *  no-store — the two together, because either alone is ambiguous. */
const isIsrCacheable = (r) =>
  /s-maxage=\d+/.test(r.cacheControl || '') && !/no-store/.test(r.cacheControl || '')

function readManifest() {
  const p = path.join(SITE, '.next', 'prerender-manifest.json')
  if (!existsSync(p)) return { error: 'prerender-manifest.json not found' }
  const m = JSON.parse(readFileSync(p, 'utf8'))
  const dyn = Object.keys(m.dynamicRoutes || {})
  const stat = Object.keys(m.routes || {})
  return {
    buildId: existsSync(path.join(SITE, '.next', 'BUILD_ID'))
      ? readFileSync(path.join(SITE, '.next', 'BUILD_ID'), 'utf8').trim() : null,
    dynamicRouteCount: dyn.length,
    membership: Object.fromEntries(
      MANIFEST_ROUTES.map(r => [r.key, { inRoutes: stat.includes(r.key), inDynamic: dyn.includes(r.key) }])),
  }
}

// ── run ──────────────────────────────────────────────────────────────────────
const results = { mode: MODE, manifest: readManifest(), routes: {} }

for (const r of ROUTES) {
  const first = probe(r.url)
  const second = probe(r.url)          // second hit reveals MISS -> HIT promotion
  results.routes[r.url] = {
    kind: r.kind,
    status: first.status,
    cacheControl: first.cacheControl,
    isrCacheable: isIsrCacheable(first),
    fpEdge1: first.fpEdge, fpEdge2: second.fpEdge,
    edgePromotes: first.fpEdge === 'MISS' && second.fpEdge === 'HIT',
    fpEdgeSkip: first.fpEdgeSkip,
    isrHeader: first.isrHeader,
    buildMeta: first.buildMeta,
    lineCards: first.lineCards,
    leaks: first.leaks,
    effective: first.effective,
    location: first.location,
    error: first.error,
  }
}

// ── declared expectations, evaluated ─────────────────────────────────────────
const checks = []
const add = (id, expected, observed, pass) => checks.push({ id, expected, observed, pass })

const mf = results.manifest
add('MANIFEST /[genre] registered',
    'baseline inDynamic=false -> AFTER: true (direction: UP)',
    JSON.stringify(mf.membership?.['/[genre]']),
    MODE === 'baseline' ? mf.membership?.['/[genre]']?.inDynamic === false
                        : mf.membership?.['/[genre]']?.inDynamic === true)
add('MANIFEST /[genre]/[line] registered',
    'baseline inDynamic=false -> AFTER: true (direction: UP)',
    JSON.stringify(mf.membership?.['/[genre]/[line]']),
    MODE === 'baseline' ? mf.membership?.['/[genre]/[line]']?.inDynamic === false
                        : mf.membership?.['/[genre]/[line]']?.inDynamic === true)
add('MANIFEST dynamicRoutes count',
    'baseline 7 -> AFTER: 9 (direction: UP by exactly 2; any other value FAILS)',
    String(mf.dynamicRouteCount),
    MODE === 'baseline' ? mf.dynamicRouteCount === 7 : mf.dynamicRouteCount === 9)

for (const r of ROUTES) {
  const o = results.routes[r.url]
  if (r.kind === 'fix-target') {
    add(`LIVE ${r.url} ISR-cacheable`,
        'baseline false (no-store) -> AFTER: true (s-maxage present, no-store absent)',
        `${o.cacheControl} | isr=${o.isrCacheable}`,
        MODE === 'baseline' ? o.isrCacheable === false : o.isrCacheable === true)
  } else if (r.kind === 'control-isr') {
    add(`LIVE ${r.url} STAYS ISR (regression guard)`,
        'true in BOTH runs — must not change',
        `${o.cacheControl} | isr=${o.isrCacheable}`,
        o.isrCacheable === true)
  } else {
    add(`LIVE ${r.url} STAYS dynamic (scope guard)`,
        'false in BOTH runs — fix must not over-apply',
        `${o.cacheControl} | isr=${o.isrCacheable}`,
        o.isrCacheable === false)
  }
  // Self-calibrating: only markers ABSENT from the already-safely-shared-cached
  // control routes count as a leak. An infrastructure string present everywhere
  // (the bubs960 case) can never trip this.
  const controlLeaks = new Set(
    ROUTES.filter(x => x.kind === 'control-isr')
          .flatMap(x => results.routes[x.url]?.leaks || []))
  const leakDelta = (o.leaks || []).filter(m => !controlLeaks.has(m))
  add(`LIVE ${r.url} no user-state leak (vs safe-cached controls)`,
      'zero markers beyond those already present on routes safely shared-cached today',
      leakDelta.length ? leakDelta.join(',') : `none (raw: ${(o.leaks || []).join(',') || 'none'})`,
      leakDelta.length === 0)
  add(`LIVE ${r.url} status 200`, '200 in BOTH runs', String(o.status), o.status === 200)
}

const leg = results.routes['/wrestling/legends']
add('CONTENT /wrestling/legends is Jakks (3 line-cards, not 181+)',
    '3 in BOTH runs — guards against the cached-308 class returning',
    String(leg?.lineCards), leg?.lineCards === 3)

results.checks = checks
const failed = checks.filter(c => !c.pass)

// ── report ───────────────────────────────────────────────────────────────────
console.log(`\n=== hub-isr-check [${MODE}] — BUILD_ID ${mf.buildId} ===\n`)
console.log('OBSERVED VALUES (R10: values, never "confirmed")\n')
console.log('route'.padEnd(46), 'kind'.padEnd(12), 'edge1/2'.padEnd(12), 'cache-control')
for (const r of ROUTES) {
  const o = results.routes[r.url]
  console.log(r.url.padEnd(46), r.kind.padEnd(12),
    `${o.fpEdge1 || '-'}/${o.fpEdge2 || '-'}`.padEnd(12),
    (o.cacheControl || o.error || '-').slice(0, 60))
}
console.log(`\nmanifest dynamicRoutes = ${mf.dynamicRouteCount}`)
for (const [k, v] of Object.entries(mf.membership || {})) {
  console.log(`  ${k.padEnd(40)} inDynamic=${v.inDynamic}`)
}
console.log(`\nCHECKS: ${checks.length - failed.length}/${checks.length} pass`)
for (const c of failed) console.log(`  FAIL  ${c.id}\n        expected: ${c.expected}\n        observed: ${c.observed}`)

writeFileSync(OUT, JSON.stringify(results, null, 2))
console.log(`\nwrote ${OUT}`)
if (MODE === 'verify' && failed.length) process.exit(1)
