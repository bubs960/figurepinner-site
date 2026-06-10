import { NextRequest, NextResponse } from 'next/server'
import { getAllFigures, deriveName } from '@/data/kb'
import { prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'

/**
 * GET /api/v1/search?q=<query>&limit=<n>
 *
 * Searches local KB (figures-reference-v2.js) and returns ranked results.
 * Returns figure_id, image (canonical_image_url), and slug fields so the
 * client can build deep links and show thumbnails without a second request.
 *
 * Pagination model (W4, 2026-06-06): a single fetch returns the full ranked
 * result pool (up to MAX_RESULTS) and the client reveals it in batches via a
 * load-more button. This keeps one round-trip + one KB scan + edge-cacheable
 * responses, rather than offset pagination that re-scans the KB per page.
 *
 * Forgiveness ladder (S13, 2026-06-09 — north star: search forgiveness):
 *   1. strict   — every token must match a field (alias-expanded)
 *   2. corrected — unmatched tokens repaired via edit-distance-1 against a
 *                  KB vocabulary (catches "hogen" → "hogan")
 *   3. relaxed  — one token allowed to miss, but results must anchor on a
 *                 character/name match (catches over-specified 4-token queries)
 * When a non-strict tier fires, the response carries a `note` string the
 * client surfaces above the results ("Showing results for …").
 *
 * Falls back to empty array if KB import fails — never throws.
 */
const MAX_RESULTS = 300

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

type Fig = ReturnType<typeof getAllFigures>[number]

/**
 * Score every figure against the token list.
 * allowedMisses=0 → strict AND. allowedMisses=1 → relaxed, but requires at
 * least one strong (character/name) match so dropping a token can't surface
 * unrelated figures.
 */
function scoreAll(
  all: Fig[],
  tokens: string[],
  allowedMisses: number,
): { f: Fig; score: number }[] {
  const out: { f: Fig; score: number }[] = []
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

function getVocab(all: Fig[]): string[] {
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

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  // limit defaults to the full pool; capped at MAX_RESULTS so a hand-crafted
  // ?limit=99999 can't force an unbounded payload.
  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get('limit') ?? String(MAX_RESULTS)),
    MAX_RESULTS,
  )

  // Edge cache headers — search is read-only over a static KB, fine to share
  // across users. 5 min fresh, 1 hour stale-while-revalidate.
  const CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
  }

  if (q.length < 2) {
    return NextResponse.json({ figures: [] }, { headers: CACHE_HEADERS })
  }

  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)

  try {
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
        note = `No exact match for “${q}” — showing close matches`
      }
    }

    const total = scored.length

    const results = scored
      .slice(0, limit)
      .map(({ f }) => ({
        figure_id:          f.figure_id,
        name:               deriveName(f),
        brand:              prettifySlug(f.manufacturer),
        line:               prettifySlug(f.product_line),
        series:             f.release_wave,
        genre:              f.fandom,
        year:               null,
        image:              f.canonical_image_url ?? null,
        // Raw slugs — used by the client to build keyword-rich pretty URLs
        fandom_slug:        f.fandom,
        line_slug:          f.product_line,
        character_slug:     f.character_canonical,
      }))

    // `total` = full ranked match count (may exceed returned `figures` if it
    // hit MAX_RESULTS). `capped` tells the client there are matches beyond the
    // hard pool ceiling, so it can suggest narrowing instead of paging forever.
    return NextResponse.json(
      { figures: results, total, capped: total >= MAX_RESULTS, note },
      { headers: CACHE_HEADERS },
    )
  } catch {
    return NextResponse.json({ figures: [] }, { headers: CACHE_HEADERS })
  }
}
