#!/usr/bin/env node
/**
 * D4 (hygiene plan, 2026-07-02) — enumerate junk character-hub slugs for the
 * matcher relay. Run with: `node scripts/audit-junk-character-slugs.cjs`
 *
 * WHY THIS SCRIPT EXISTS: the sandbox this was authored in had no working
 * shell (VM service down, 2026-07-02), so the ~76-slug figure quoted in the
 * plan could NOT be regenerated and verified here — grep against the minified
 * KB file only turned up 34 confirmed hits for the three named prefix
 * patterns (walmart-exclusive-N-, target-exclusive-N-, series-N[a-z]?-) plus
 * one confirmed split-dupe pair (1-2-3-kid / 123-kid). Rather than hand
 * matcher a partial, hand-rolled list and call it done, this script is the
 * actual probe — run it once and the output IS the authoritative list.
 *
 * Two junk classes, per FP-HYGIENE-PLAN-2026-07-02 D4:
 *   1. THIN HUB SLUGS — character_canonical values that are really SKU/wave
 *      labels, not character names (walmart-exclusive-134-chris-jericho,
 *      series-68a-braun-strowman, target-exclusive-91-darby-allin, ...).
 *      These generate their own thin character-hub page instead of rolling
 *      into the real character's hub, splitting hub equity + adding sitemap
 *      noise.
 *   2. SPLIT-CHARACTER DUPES — two character_canonical slugs that normalize
 *      to the same identity (1-2-3-kid vs 123-kid) and should be merged to
 *      one canonical slug via matcher's character_canonical map.
 *
 * Output: JSON + human-readable summary to stdout. Redirect to a file for
 * the matcher relay, e.g.:
 *   node scripts/audit-junk-character-slugs.cjs > /tmp/junk-slugs.json
 */

const path = require('path')

const KB_PATH = path.join(__dirname, '..', 'src', 'data', 'figures-reference-v2.slim.js')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { FIGURES_V2 } = require(KB_PATH)

if (!Array.isArray(FIGURES_V2)) {
  console.error(`Expected FIGURES_V2 array from ${KB_PATH}, got:`, typeof FIGURES_V2)
  process.exit(1)
}

// ── Class 1: thin SKU/wave-label hub slugs ─────────────────────────────────
const JUNK_PATTERNS = [
  { name: 'walmart_exclusive_numbered', re: /^walmart-exclusive-\d+-/ },
  { name: 'target_exclusive_numbered', re: /^target-exclusive-\d+-/ },
  { name: 'series_numbered', re: /^series-\d+[a-z]?-/ },
  { name: 'wave_numbered', re: /^wave-\d+-/ },
  { name: 'con_exclusive_numbered', re: /^(sdcc|nycc|c2e2|wondercon)-exclusive-\d*-?/ },
  { name: 'bare_numeric_or_dashes', re: /^[\d-]+$/ },
]

const seenSlugs = new Map() // character_canonical -> { fandom, product_line, manufacturer, count }
for (const f of FIGURES_V2) {
  const slug = f.character_canonical
  if (!slug) continue
  if (!seenSlugs.has(slug)) {
    seenSlugs.set(slug, {
      fandom: f.fandom,
      product_line: f.product_line,
      manufacturer: f.manufacturer,
      count: 0,
    })
  }
  seenSlugs.get(slug).count += 1
}

const junkHubs = []
for (const [slug, meta] of seenSlugs) {
  for (const { name, re } of JUNK_PATTERNS) {
    if (re.test(slug)) {
      junkHubs.push({ slug, class: name, ...meta })
      break
    }
  }
}

// ── Class 2: split-character dupes ──────────────────────────────────────
// Normalize by stripping all non-alphanumeric chars and lowercasing. Two
// distinct character_canonical slugs that normalize to the same string are
// almost certainly the same character split across two hub pages
// (1-2-3-kid vs 123-kid -> "123kid" both times).
function normalize(slug) {
  return slug.replace(/[^a-z0-9]/gi, '').toLowerCase()
}

const byNormalized = new Map()
for (const slug of seenSlugs.keys()) {
  const norm = normalize(slug)
  if (!byNormalized.has(norm)) byNormalized.set(norm, [])
  byNormalized.get(norm).push(slug)
}

const splitDupes = []
for (const [norm, slugs] of byNormalized) {
  if (slugs.length > 1) {
    splitDupes.push({ normalized: norm, variants: slugs })
  }
}

// ── Report ─────────────────────────────────────────────────────────────
const report = {
  generated_at: new Date().toISOString(),
  total_unique_character_canonical: seenSlugs.size,
  junk_hub_count: junkHubs.length,
  junk_hubs_by_class: JUNK_PATTERNS.reduce((acc, p) => {
    acc[p.name] = junkHubs.filter((h) => h.class === p.name).length
    return acc
  }, {}),
  junk_hubs: junkHubs.sort((a, b) => a.slug.localeCompare(b.slug)),
  split_dupe_groups: splitDupes.length,
  split_dupes: splitDupes,
}

console.log(JSON.stringify(report, null, 2))
console.error(
  `\n[summary] ${report.junk_hub_count} junk hub slugs, ${report.split_dupe_groups} split-dupe groups ` +
    `out of ${report.total_unique_character_canonical} unique character_canonical values.`,
)
