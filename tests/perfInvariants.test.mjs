import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

// SOURCE-LEVEL guards for the two perf fixes of 2026-09-20 (PR #27 /search CLS, PR #28 homepage
// preconnect + hero priority). They pin the code shape so a later refactor cannot silently undo a fix.
// They do NOT prove the fix works: that is measured against the deployed site by the lab harness
// (Bridge/scripts/web-vitals-lab.mjs, protocol Bridge/WEB-PERF-MEASUREMENT-PROTOCOL-2026-09-20.md).
// If one of these fails because you changed the code ON PURPOSE, update the test and re-run the lab gate.

const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8')
// Drop block and line comments, but not the "//" in "https://": a line comment starts a line or follows whitespace.
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1')
const code = (file) => stripComments(read(file))

// ---- PR #28: preconnect to the figure-photo hosts ------------------------------------------------

const PHOTO_HOSTS = ['https://figurepinner-images.bubs960.workers.dev', 'https://cdn.shopify.com']

function preconnectLinks() {
  return [...code('src/app/layout.tsx').matchAll(/<link\b[^>]*\brel="preconnect"[^>]*\/>/g)].map((m) => m[0])
}

test('root layout preconnects to both figure-photo hosts, without crossOrigin', () => {
  const links = preconnectLinks()
  for (const host of PHOTO_HOSTS) {
    const link = links.find((l) => l.includes(`href="${host}"`))
    assert.ok(link, `layout.tsx lost the preconnect to ${host} (CF RUM 2026-09-20: the LCP image host was figurepinner-images in 3 of 4 samples)`)
    assert.ok(!/crossOrigin/i.test(link), `${host}: a crossorigin preconnect warms the CORS connection pool, but figure photos load through plain non-CORS <img>, so it would not be reused`)
  }
})

test('no <img> under src/app sets crossOrigin (the photo preconnects assume non-CORS image loads)', () => {
  const offenders = []
  for (const rel of readdirSync(new URL('../src/app', import.meta.url), { recursive: true })) {
    if (!String(rel).endsWith('.tsx')) continue
    const src = code('src/app/' + String(rel).replace(/\\/g, '/'))
    for (const tag of src.match(/<img\b[\s\S]*?\/>/g) ?? []) if (/\bcrossOrigin\b/.test(tag)) offenders.push(String(rel))
  }
  assert.deepEqual(offenders, [], 'an <img> with crossOrigin loads through the CORS pool: revisit the preconnect links in layout.tsx (drop/add crossOrigin to match)')
})

test('the root layout keeps its preconnect list short', () => {
  // Every preconnect opens a TLS connection on EVERY page, including pages that never use the host.
  const links = preconnectLinks()
  assert.ok(links.length <= 6, `layout.tsx has ${links.length} preconnects (> 6): each costs a connection on every page load, scope new ones to the routes that use them`)
})

// ---- PR #28: homepage hero cards ------------------------------------------------------------------

const HERO = 'src/app/components/DepthHallHero.tsx'
const heroImg = () => {
  const m = code(HERO).match(/<img\s+className=\{styles\.cardImg\}[\s\S]*?\/>/)
  assert.ok(m, 'DepthHallHero.tsx: could not find the hero card <img className={styles.cardImg} ...>')
  return m[0]
}

test('DepthHallHero: eager cards load at high priority, deferred cards stay low', () => {
  assert.match(
    heroImg(),
    /fetchPriority=\{\s*c\.eager\s*\?\s*'high'\s*:\s*'low'\s*\}/,
    "hero card img must be fetchPriority={c.eager ? 'high' : 'low'}: CF RUM 2026-09-20 had the homepage LCP element as a hero card img fetched at low priority (React also hoists a <link rel=preload> for each high img)",
  )
})

test('DepthHallHero: the Phase 9 deferral is intact', () => {
  const src = code(HERO)
  assert.match(heroImg(), /loading="eager"/, "hero card imgs must stay loading=\"eager\": native lazy never fires on the 3D-transformed cards (live incident 2026-07-24)")
  assert.match(src, /const showImg = c\.eager \|\| heroInView/, 'only eager cards render src before the hero is in view (Phase 9, 2026-08-24): without this every card fetches on first paint')
  assert.match(src, /eager: i === leftEager/, 'exactly one eager card on the LEFT side')
  assert.match(src, /eager: i === rightEager/, 'exactly one eager card on the RIGHT side; the 2026-08-25 bug gave the right side none, and priority=high must not spread to more than the two eager cards')
})

// ---- PR #27: /search layout stability -------------------------------------------------------------

const SEARCH = 'src/app/search/_components/SearchInterface.tsx'

test('SearchInterface: the root block reserves a full viewport so the ad + footer start off-screen', () => {
  assert.match(
    code(SEARCH),
    /<div style=\{\{[^}]*\bminHeight:\s*'100vh'[^}]*\}\}>/,
    "SearchInterface root needs minHeight: '100vh': CF RUM 2026-09-20 /search CLS P75 0.32 was the AdSlot wrapper collapsing while in view (lab: 1360x284 -> 0x0 = 0.37); off-screen it does not score",
  )
})

test('SearchInterface: the result-card price row is an unconditional box with a reserved height', () => {
  const src = code(SEARCH)
  const card = src.slice(src.indexOf('const FigureResultCard = memo('))
  assert.ok(card.length > 100, 'FigureResultCard not found')
  const cond = card.indexOf('sparkline?.median != null')
  assert.ok(cond > 0, 'price conditional not found in FigureResultCard')
  const before = card.slice(0, cond)
  const open = before.lastIndexOf('<div style={{')
  assert.ok(open > 0, 'no wrapper <div style> directly before the price conditional')
  assert.match(
    before.slice(open),
    /\b(?:min)?[hH]eight:\s*(?:\d+|'[\d.]+(?:px|rem|em)')/,
    'the price row wrapper must reserve a height (sparklines arrive in a second fetch; mounting the row then grew every card, lab: +23 px per card)',
  )
  assert.ok(!/(&&|\?)\s*\(?\s*$/.test(before.slice(0, open).trimEnd()), 'the price row wrapper must be rendered unconditionally; only its CONTENT depends on the sparkline data')
})

test('/search: the ad slot stays after the search block', () => {
  const src = code('src/app/search/page.tsx')
  const search = src.indexOf('<SearchInterface')
  const ad = src.indexOf('<AdSlot')
  assert.ok(search > 0 && ad > 0, 'page.tsx must render both <SearchInterface> and <AdSlot>')
  assert.ok(ad > search, 'the ad must follow SearchInterface: the minHeight fix keeps it below the fold only in that order')
})

test('DepthHallHero: the eager cards start near the camera, not at the back of the hall', () => {
  // 2026-09-22: eager used to be the delay-0 card = keyframe 0% = translateZ(-4400px), opacity 0,
  // so the two `high` images were invisible while the big front cards loaded `low` (CF RUM `/`).
  const src = code(HERO)
  const m = src.match(/const EAGER_PROGRESS = ([\d.]+)/)
  assert.ok(m, 'DepthHallHero.tsx: EAGER_PROGRESS constant missing')
  const p = Number(m[1])
  const css = code('src/app/components/DepthHallHero.module.css')
  assert.match(css, /10% \{ opacity: 1; \}/, 'fpHall keyframes changed: re-check EAGER_PROGRESS against the new opacity window')
  assert.match(css, /85% \{ opacity: 1; \}/, 'fpHall keyframes changed: re-check EAGER_PROGRESS against the new opacity window')
  assert.ok(p >= 0.4 && p <= 0.75, `EAGER_PROGRESS ${p} must sit in the large, fully-opaque part of the flight (0.4..0.75), with time left before the 85% fade`)
})
