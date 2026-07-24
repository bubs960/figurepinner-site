#!/usr/bin/env node
/**
 * check-cohort-b-enrichment.mjs — answers webaudit's Item 5 question about
 * PLAN V2's Cohort B (WEBAUDIT-TO-WEB-P2-P3-SCOPING-AUDIT-VERDICT-2026-07-24):
 *
 *   "for the 6 Cohort-B figures, is match_represented truly null/empty, or
 *    present-but-filtered-out? If the latter, B pages still render raw lore
 *    body text and the cohort contrast narrows further."
 *
 * This matters because the two cases mean different things for the 8/5 readout:
 *   - truly null      -> B is genuinely non-enriched everywhere. Clean contrast.
 *   - present-but-gated -> B pages have NO enriched meta/JSON-LD (the gate did
 *     its job) but the HeroBand still renders the RAW field as visible body
 *     copy, so a crawler sees enriched-looking prose on a "non-enriched" page.
 *     The A-vs-B contrast is then narrower than the plan assumes.
 *
 * The authoritative verdict always comes from the real enrichedDescription()
 * import. The per-gate attribution below MIRRORS enrichedCopy.ts's predicates
 * to explain *which* gate fired — if the mirror ever disagrees with the real
 * function, the script says so loudly rather than reporting a confident wrong
 * reason. Keep in sync with enrichedCopy.ts if its gates change.
 *
 * Usage: node --import ./scripts/register-ts-loader.mjs scripts/check-cohort-b-enrichment.mjs
 */
import { getAllFigures } from '../src/data/kb.ts'
import { enrichedDescription } from '../src/app/figure/[figure_id]/_lib/enrichedCopy.ts'

// PLAN V2 (2026-07-22) named Cohort B by character + line hint. Spares included
// so a swap doesn't need this script re-derived.
const COHORT_B = [
  { character: 'chris-masters', lineHint: null, role: 'B-1 (SUBMITTED 7/22)' },
  { character: 'ken-kennedy', lineHint: 'deluxe-aggression', role: 'B-2' },
  { character: 'dakota-kai', lineHint: 'basic', role: 'B-3' },
  { character: 'nightsister-merrin', lineHint: 'black-series', role: 'B-4' },
  { character: 'han-solo-deluxe', lineHint: 'hot-toys', role: 'B-5' },
  { character: 'logan', lineHint: 'mondo', role: 'B-6' },
  { character: 'crankcase-a-w-e-striker', lineHint: null, role: 'spare' },
  { character: 'tung-lashor', lineHint: null, role: 'spare' },
  { character: 'the-merciless', lineHint: null, role: 'spare' },
]

// ── mirrored from enrichedCopy.ts (attribution only; see header) ─────────────
const HEDGE_RE =
  /pending (photo )?verification|unconfirmed (from|pending|without)|not confirmed in our records|flagged for review|no authoritative .* exists|cross-reference packaging|catalog source|requires? (photo )?verification|in our records/i
const ARTIFACT_RE = /\bN\/A\b|\bundefined\b|\bnull\b|\bNaN\b|\bTBD\b|\bFIXME\b|lorem ipsum/i
const MIN_LEN = 30
const META_BUDGET = 200

const all = getAllFigures()
const dupCounts = new Map()
for (const f of all) {
  const t = f.match_represented?.trim()
  if (!t) continue
  dupCounts.set(t, (dupCounts.get(t) ?? 0) + 1)
}

function truncateAtSentence(text, budget) {
  if (text.length <= budget) return text
  const head = text.slice(0, budget + 1)
  const cut = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '))
  if (cut < MIN_LEN) return null
  return head.slice(0, cut + 1)
}

/** Which gate rejects this figure, mirroring enrichedCopy.ts's order. */
function attributeGate(f) {
  const raw = f.match_represented?.trim()
  if (!raw) return { verdict: 'ABSENT', gate: 'no match_represented (null/empty)', rawLen: 0 }
  const base = { rawLen: raw.length, raw }
  if (raw.length < MIN_LEN) return { ...base, verdict: 'GATED', gate: `too short (<${MIN_LEN})` }
  if (HEDGE_RE.test(raw)) return { ...base, verdict: 'GATED', gate: 'hedge/internal-QA language' }
  if (ARTIFACT_RE.test(raw)) return { ...base, verdict: 'GATED', gate: 'placeholder artifact' }
  if ((dupCounts.get(raw) ?? 0) > 1) {
    return { ...base, verdict: 'GATED', gate: `exact-duplicate text (shared by ${dupCounts.get(raw)} figures)` }
  }
  if (truncateAtSentence(raw, META_BUDGET) === null) {
    return { ...base, verdict: 'GATED', gate: 'no complete sentence fits the 200-char meta budget' }
  }
  return { ...base, verdict: 'PASSES', gate: '(passes every gate)' }
}

console.log('Cohort-B enrichment check — is match_represented absent, or present-but-gated?')
console.log(`KB figures scanned: ${all.length}\n`)

let absent = 0, gated = 0, passes = 0, notFound = 0, mismatches = 0

for (const entry of COHORT_B) {
  let matches = all.filter(f => f.character_canonical === entry.character)
  if (entry.lineHint) {
    const narrowed = matches.filter(f =>
      (f.product_line || '').includes(entry.lineHint) || (f.manufacturer || '').includes(entry.lineHint))
    if (narrowed.length) matches = narrowed
  }

  console.log(`── ${entry.character}  [${entry.role}]`)
  if (!matches.length) {
    notFound++
    console.log('   NOT FOUND in KB under this character_canonical\n')
    continue
  }
  if (matches.length > 1) {
    console.log(`   note: ${matches.length} KB figures share this character; reporting each`)
  }

  for (const f of matches) {
    const a = attributeGate(f)
    const real = enrichedDescription(f)          // authoritative
    const mirrorSaysPasses = a.verdict === 'PASSES'
    const realPasses = real !== null
    if (mirrorSaysPasses !== realPasses) {
      mismatches++
      console.log('   ⚠️  MIRROR DISAGREES WITH enrichedDescription() — trust the real function, fix this script')
    }
    if (a.verdict === 'ABSENT') absent++
    else if (a.verdict === 'PASSES') passes++
    else gated++

    console.log(`   ${f.figure_id}`)
    console.log(`     line=${f.product_line || '-'}  mfr=${f.manufacturer || '-'}`)
    console.log(`     match_represented: ${a.rawLen ? `${a.rawLen} chars` : 'ABSENT (null/empty)'}`)
    console.log(`     verdict: ${a.verdict} — ${a.gate}`)
    console.log(`     enrichedDescription(): ${real === null ? 'null (page keeps template)' : `"${real.slice(0, 80)}..."`}`)
    if (a.raw) console.log(`     raw head: "${a.raw.slice(0, 100).replace(/\s+/g, ' ')}..."`)
    console.log('')
  }
}

console.log('─'.repeat(70))
console.log(`ABSENT (truly null/empty): ${absent}`)
console.log(`GATED  (present but filtered — page STILL renders raw text in HeroBand): ${gated}`)
console.log(`PASSES (would render enriched meta — should NOT be in a non-enriched cohort): ${passes}`)
if (notFound) console.log(`NOT FOUND in KB: ${notFound}`)
if (mismatches) console.log(`⚠️  mirror/real disagreements: ${mismatches} — script needs re-sync with enrichedCopy.ts`)
console.log('')
console.log(gated + passes === 0
  ? 'ANSWER: Cohort B is truly non-enriched. A-vs-B contrast is clean.'
  : 'ANSWER: at least one B figure has PRESENT match_represented — B pages still render raw lore body copy via HeroBand, so the A-vs-B contrast is NARROWER than PLAN V2 assumes.')
