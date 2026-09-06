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
