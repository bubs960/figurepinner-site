#!/usr/bin/env node
/**
 * build-figure-redirects.mjs -- emit src/data/figure-id-redirects.generated.json from the
 * KB's `duplicate_of` field (Release P, 2026-09-06). Runs in `prebuild` right after
 * build-kb-stats.mjs.
 *
 * SOURCES: the FULL catalog (figures-reference-v2.js) is the only place duplicate_of
 * records still exist -- the slim catalog has already dropped them; the slim file defines
 * "servable". Build machine only, never Worker runtime (CLAUDE.md truth #11): the emitted
 * JSON is a small string->string map, no figure objects.
 *
 * OUTPUT is git-committed like kb-stats.generated.json. tests/figureIdRedirects.test.mjs
 * drift-gates the committed copy against the live slim KB on every deploy (a re-added
 * source or a removed target fails the chain), and prebuild regenerates it so a build
 * never ships a stale map. Regenerate + commit whenever a KB sync lands. The file is only
 * rewritten when its content changes, so an unchanged KB leaves the tree clean.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { deriveFigureRedirects } from './lib/derive-figure-redirects.mjs'
import { derivePrettyPathRedirects } from './lib/derive-pretty-path-redirects.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src', 'data', 'figure-id-redirects.generated.json')
const require = createRequire(import.meta.url)

const full = require(join(ROOT, 'src', 'data', 'figures-reference-v2.js')).FIGURES_V2
const slim = require(join(ROOT, 'src', 'data', 'figures-reference-v2.slim.js')).FIGURES_V2
const servable = new Set(slim.map(f => f.figure_id))

const { map, stats } = deriveFigureRedirects(full, servable)
const next = `${JSON.stringify(map, null, 2)}\n`
let prev = null
try { prev = readFileSync(OUT, 'utf8') } catch { /* first run */ }
const changed = prev !== next
if (changed) writeFileSync(OUT, next)
console.log(
  `[figure-redirects] ${stats.emitted} redirect(s) from ${stats.candidates} duplicate_of record(s)` +
  ` (skipped: ${stats.sourceStillServable} source still servable, ${stats.targetMissing} target missing,` +
  ` ${stats.selfOrCycle} self/cycle; ${stats.chainsResolved} chain(s) resolved)` +
  ` -> ${changed ? 'wrote' : 'unchanged'} src/data/figure-id-redirects.generated.json`,
)

// ── harvested pretty-path redirects (2026-09-18) ─────────────────────────────
// src/data/pretty-path-harvest.json holds verified historical FACTS (old pretty path -> the
// fid that served it, proven from git history by scripts/harvest-dead-pretty-paths.mjs). The
// successor is re-derived here against tonight's KB so the map heals itself: a successor that
// was deduped again follows the chain above, one that left the KB drops out, a path that is
// served again is never emitted. Same commit-the-output contract as the fid map. A missing or
// unreadable ledger emits an empty map -- this step must never fail a build.
const PRETTY_OUT = join(ROOT, 'src', 'data', 'pretty-path-redirects.generated.json')
let ledger = {}
try { ledger = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'pretty-path-harvest.json'), 'utf8')) } catch { /* no ledger yet */ }
const pretty = derivePrettyPathRedirects(ledger, slim, map)
const prettyNext = `${JSON.stringify(pretty.map, null, 2)}\n`
let prettyPrev = null
try { prettyPrev = readFileSync(PRETTY_OUT, 'utf8') } catch { /* first run */ }
if (prettyPrev !== prettyNext) writeFileSync(PRETTY_OUT, prettyNext)
console.log(
  `[figure-redirects] ${pretty.stats.emitted} harvested pretty-path redirect(s) from ${pretty.stats.candidates} ledger fact(s)` +
  ` (skipped: ${pretty.stats.sourceLive} path served again, ${pretty.stats.noSurvivor} no live successor, ${pretty.stats.malformed} malformed;` +
  ` ${pretty.stats.viaChain} via duplicate_of chain) -> ${prettyPrev !== prettyNext ? 'wrote' : 'unchanged'} src/data/pretty-path-redirects.generated.json`,
)
