/**
 * kbSearch — shared KB search core (extracted from /api/v1/search S13, 2026-06-10)
 *
 * Single source of truth for the forgiveness ladder so every surface
 * (site search UI, price-check / Siri Shortcut, future show-prep) ranks
 * figures identically:
 *   1. strict    — every token must match a field (alias-expanded)
 *   2. corrected — unmatched tokens repaired via edit-distance-1 vocab
 *   3. relaxed   — one token may miss, anchored on a character/name match
 *
 * Behavior must stay byte-identical to the pre-extraction search route.
 * If you change scoring here, both /api/v1/search and /api/v1/price-check
 * change together — that is the point.
 */

import { getAllFigures, deriveName, type KBFigure } from '@/data/kb'

export const MAX_RESULTS = 300

// Collector-vocabulary tokens that don't appear in KB fields but imply a
// fandom. "wwe elite 11" must work — it's the placeholder example.
const TOKEN_ALIASES: Record<string, string[]> = {
  wwe: ['wrestling'],
  wwf: ['wrestling'],
  wcw: ['wrestling'],
  ecw: ['wrestling'],
  nxt: ['wrestling'],
  aew: ['wrestling'],
  tna: ['wrestling'],
}

interface FieldBag {
  char: string
  name: string
  variant: string
  line: string
  brand: string
  fandom: string
  wave: string
}

function rawTokenScore(token: string, fl: FieldBag): number | null {
  // Numeric token matching the exact release wave is the strongest intent
  // signal there is ("elite 11" should rank Ser. 11 above Ser. 110).
  if (/^\d+$/.test(token) && fl.wave === token) return 6
  if (fl.char.startsWith(token)) return 5
  if (fl.char.includes(token)) return 3
  if (fl.name.includes(token)) return 2
  if (fl.variant.includes(token)) return 1.5
  if (fl.line.includes(token)) return 1
  if (fl.brand.includes(token)) return 0.5
  if (fl.fandom.includes(token)) return 0.5
  return null
}

/** Best score across the raw token and its aliases, or null if none match. */
function tokenScore(token: string, fl: FieldBag): number | null {
  let best = rawTokenScore(token, fl)
  const aliases = TOKEN_ALIASES[token]
  if (aliases) {
    for (const alias of aliases) {
      const s = rawTokenScore(alias, fl)
      if (s !== null && (best === null || s > best)) best = s
    }
  }
  return best
}

/**
 * Score every figure against the token list.
 * allowedMisses=0 → strict AND. allowedMisses=1 → relaxed, but requires at
 * least one strong (character/name) match so dropping a token can't surface
 * unrelated figures.
 */
function scoreAll(
  all: KBFigure[],
  tokens: string[],
  allowedMisses: number,
): { f: KBFigure; score: number }[] {
  const out: { f: KBFigure; score: number }[] = []
  for (const f of all) {
    const fl: FieldBag = {
      char: f.character_canonical.toLowerCase(),
      name: deriveName(f).toLowerCase(),
      variant: (f.character_variant ?? '').toLowerCase(),
      line: f.product_line.toLowerCase().replace(/-/g, ' '),
      brand: f.manufacturer.toLowerCase(),
      fandom: f.fandom.toLowerCase(),
      wave: f.release_wave,
    }
    let score = 0
    let missed = 0
    let strong = false
    let excluded = false
    for (const token of tokens) {
      const s = tokenScore(token, fl)
      if (s === null) {
        missed++
        if (missed > allowedMisses) { excluded = true; break }
      } else {
        score += s
        if (s >= 2) strong = true
      }
    }
    if (excluded) continue
    if (allowedMisses > 0 && !strong) continue
    out.push({ f, score })
  }
  return out.sort((a, b) => b.score - a.score)
}

// ── Typo correction ─────────────────────────────────────────────────────────
// Vocabulary of character + line tokens, built once per isolate.
let VOCAB: string[] | null = null

function getVocab(all: KBFigure[]): string[] {
  if (!VOCAB) {
    const set = new Set<string>()
    for (const f of all) {
      for (const t of f.character_canonical.toLowerCase().split(/[^a-z0-9]+/)) {
        if (t.length >= 3) set.add(t)
      }
      for (const t of f.product_line.toLowerCase().split(/[^a-z0-9]+/)) {
        if (t.length >= 3) set.add(t)
      }
    }
    VOCAB = [...set]
  }
  return VOCAB
}

/** True if edit distance between a and b is <= 1. */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true
  const la = a.length
  const lb = b.length
  if (Math.abs(la - lb) > 1) return false
  let i = 0
  let j = 0
  let diff = 0
  while (i < la && j < lb) {
    if (a[i] === b[j]) { i++; j++; continue }
    diff++
    if (diff > 1) return false
    if (la === lb) { i++; j++ }
    else if (la > lb) { i++ }
    else { j++ }
  }
  return diff + (la - i) + (lb - j) <= 1
}

/** Repair a token against the vocabulary, or null if no near-miss found. */
function correctToken(token: string, vocab: string[]): string | null {
  if (token.length < 4) return null
  for (const v of vocab) {
    if (v === token) return null // token is already a real word — don't touch
  }
  for (const v of vocab) {
    if (Math.abs(v.length - token.length) > 1) continue
    if (withinOneEdit(token, v)) return v
  }
  return null
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface KbSearchResult {
  scored: { f: KBFigure; score: number }[]
  /** Non-null when a non-strict tier fired — surface to the user. */
  note: string | null
}

/**
 * Run the full forgiveness ladder over the KB for a free-text query.
 * Returns the complete ranked pool (uncapped) — callers slice to their limit.
 * Never throws on bad input; returns an empty pool for queries < 2 chars.
 */
export function searchKb(q: string): KbSearchResult {
  const query = q.trim()
  if (query.length < 2) return { scored: [], note: null }

  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  const all = getAllFigures()

  // Tier 1 — strict AND (alias-expanded)
  let scored = scoreAll(all, tokens, 0)
  let note: string | null = null

  // Tier 2 — typo correction, preserves every token so it beats relaxing
  if (scored.length === 0) {
    const vocab = getVocab(all)
    let changed = false
    const corrected = tokens.map(t => {
      const fix = correctToken(t, vocab)
      if (fix) changed = true
      return fix ?? t
    })
    if (changed) {
      const correctedScored = scoreAll(all, corrected, 0)
      if (correctedScored.length > 0) {
        scored = correctedScored
        note = `Showing results for “${corrected.join(' ')}”`
      }
    }
  }

  // Tier 3 — relaxed AND (one token may miss, anchored on character/name)
  if (scored.length === 0 && tokens.length >= 2) {
    scored = scoreAll(all, tokens, 1)
    if (scored.length > 0) {
      note = `No exact match for “${query}” — showing close matches`
    }
  }

  return { scored, note }
}
