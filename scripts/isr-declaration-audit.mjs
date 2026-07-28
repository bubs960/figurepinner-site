#!/usr/bin/env node
/**
 * isr-declaration-audit.mjs — catches the ENTIRE "revalidate is a no-op" class.
 *
 * THE BUG THIS EXISTS FOR (2026-07-27): `export const revalidate = N` on a page
 * under a dynamic path segment does NOTHING without `generateStaticParams` or
 * `export const dynamic = 'force-static'`. Next never registers the route,
 * OpenNext gates ISR purely on prerender-manifest membership, the request falls
 * through to full SSR, and Next's own `revalidate === 0` default emits
 * `private, no-cache, no-store, max-age=0, must-revalidate`.
 *
 * The declaration LOOKS correct in source and is silently inert. No type error,
 * no lint, no test failure — the only symptom is a header nobody reads. That is
 * why this is mechanical: /[genre] and /[genre]/[line] sat broken for ~6 weeks,
 * and the Option E verification that MEASURED the regression
 * ("prerender-manifest 0 genre routes (was 17)") passed anyway because no
 * expected direction had been declared.
 *
 * WHAT IT DOES: derives each page's route pattern from its path, then asks the
 * authoritative artifact — .next/prerender-manifest.json — whether that route is
 * actually registered. A route that DECLARES revalidate but is ABSENT from the
 * manifest is this bug, by definition.
 *
 * READ-ONLY. Never builds (a build overwrites .next/BUILD_ID, which
 * kv-purge-stale-isr.mjs reads as the live deployed build). Wired into
 * run-seo-preflight.mjs (2026-07-27) right after that wrapper's own `next
 * build` step — the manifest it needs already exists by then, and failing here
 * is cheap: no reason to spin up a server first if this already caught the bug.
 *
 * Exit 1 if any route declares revalidate but isn't registered.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Self-locating, not hardcoded: scripts/ is one level under the repo root, the
// same convention run-seo-preflight.mjs uses. SITE stays overridable (e.g. to
// point at a disposable worktree) but the default must never be a literal
// absolute path — that breaks the moment this file runs from anywhere else,
// exactly the hazard CLAUDE.md's worktree-KB-path rule exists to prevent.
const SITE = process.env.SITE || path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const APP = path.join(SITE, 'src', 'app')
const MANIFEST = path.join(SITE, '.next', 'prerender-manifest.json')

if (!existsSync(MANIFEST)) {
  console.error(`FATAL: ${MANIFEST} not found. This audit needs build output; it must NOT build one itself.`)
  process.exit(2)
}
const m = JSON.parse(readFileSync(MANIFEST, 'utf8'))
const registered = new Set([...Object.keys(m.routes || {}), ...Object.keys(m.dynamicRoutes || {})])
const buildId = existsSync(path.join(SITE, '.next', 'BUILD_ID'))
  ? readFileSync(path.join(SITE, '.next', 'BUILD_ID'), 'utf8').trim() : '(unknown)'

/** src/app/[genre]/[line]/page.tsx -> /[genre]/[line] ; src/app/page.tsx -> / */
function routePattern(file) {
  let r = path.relative(APP, path.dirname(file)).split(path.sep).join('/')
  r = r.split('/').filter(seg => !(seg.startsWith('(') && seg.endsWith(')'))).join('/')  // route groups
  return '/' + r
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e)
    if (statSync(p).isDirectory()) { if (e !== 'node_modules') walk(p, out) }
    else if (e === 'page.tsx' || e === 'page.ts' || e === 'page.jsx' || e === 'page.js') out.push(p)
  }
  return out
}

const pages = walk(APP)
const rows = []
for (const f of pages) {
  const src = readFileSync(f, 'utf8')
  // Strip block+line comments so a commented-out export can't read as declared.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  const revalidate = code.match(/export\s+const\s+revalidate\s*=\s*([^\s;/]+)/)?.[1] ?? null
  const dynamicVal = code.match(/export\s+const\s+dynamic\s*=\s*['"]([^'"]+)['"]/)?.[1] ?? null
  const hasGSP = /export\s+(async\s+)?function\s+generateStaticParams|export\s+const\s+generateStaticParams/.test(code)
  const pattern = routePattern(f)
  const isDynamicSegment = pattern.includes('[')
  const qualifies = dynamicVal === 'force-static' || hasGSP
  rows.push({
    file: path.relative(SITE, f).split(path.sep).join('/'),
    pattern, revalidate, dynamicVal, hasGSP, isDynamicSegment,
    qualifies, inManifest: registered.has(pattern),
  })
}

// ── classify ─────────────────────────────────────────────────────────────────
// THE BUG: declares revalidate, but the route is not registered. The manifest is
// authoritative — source intent is irrelevant if Next didn't register it.
const broken = rows.filter(r => r.revalidate !== null && !r.inManifest)
// Declares revalidate AND registered — working as intended.
const healthy = rows.filter(r => r.revalidate !== null && r.inManifest)
// Suspicious but not proven: dynamic segment, no revalidate, not registered.
// Could be a deliberate always-dynamic route (auth'd, personalised) — reported
// for eyes, NOT failed on, because "intentionally dynamic" is legitimate.
const dynamicByDesign = rows.filter(r => r.revalidate === null && r.isDynamicSegment && !r.inManifest)

const pad = (s, n) => String(s).padEnd(n)
console.log(`\n=== ISR declaration audit — BUILD_ID ${buildId} ===`)
console.log(`${pages.length} page files · ${registered.size} routes registered in prerender-manifest\n`)

console.log(`BROKEN — declares \`revalidate\` but NOT registered (the no-op class): ${broken.length}`)
if (broken.length) {
  console.log(`   ${pad('route', 40)} ${pad('revalidate', 11)} ${pad('dynamic', 14)} GSP`)
  for (const r of broken)
    console.log(`   ${pad(r.pattern, 40)} ${pad(r.revalidate, 11)} ${pad(r.dynamicVal ?? '—', 14)} ${r.hasGSP ? 'yes' : 'no'}\n      ${r.file}`)
} else {
  console.log('   none\n')
}

console.log(`\nHEALTHY — declares \`revalidate\` and IS registered: ${healthy.length}`)
for (const r of healthy)
  console.log(`   ${pad(r.pattern, 40)} revalidate=${pad(r.revalidate, 8)} ${r.dynamicVal ? `dynamic='${r.dynamicVal}'` : ''}${r.hasGSP ? ' generateStaticParams' : ''}`)

console.log(`\nDYNAMIC BY DESIGN — no \`revalidate\`, not registered (review, not a failure): ${dynamicByDesign.length}`)
for (const r of dynamicByDesign) console.log(`   ${pad(r.pattern, 40)} ${r.file}`)

console.log(`\nRESULT: ${broken.length === 0 ? 'PASS — no inert revalidate declarations' : `FAIL — ${broken.length} route(s) declare revalidate with no effect`}`)
process.exit(broken.length === 0 ? 0 : 1)
