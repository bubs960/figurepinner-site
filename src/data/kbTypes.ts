import { prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'

/** One resolved passport field: the value plus its evidence class (`ec`,
 *  e.g. "corroborated_exact" | "single_secondary" | "inferred-evidence") —
 *  the render-badge hook. Kept as string: matcher owns the vocabulary. */
export interface PassportField {
  value: string
  ec: string
}

/** Slim passport block poured into the KB (figure-claims-2 schema). */
export interface PassportBlock {
  v: string
  identity_hash: string
  poured_at: string
  /** Basename of the per-wave provenance sidecar carrying the receipts. */
  sidecar: string
  fields: Record<string, PassportField>
  /** Pour-derived rows (closed whitelist, not evidence-locked claims). */
  derived?: Record<string, string>
}

/** Resolved passport value for a field key, or null when absent. */
export function passportValue(fig: KBFigure, key: string): string | null {
  return fig.passport?.fields[key]?.value ?? null
}

export type KBFigure = {
  figure_id: string
  v1_figure_id: string
  fandom: string
  sub_fandom: string | null
  character_canonical: string
  character_variant: string | null
  manufacturer: string
  product_line: string
  release_wave: string
  scale: string | null
  pack_size: number
  exclusive_to: string | null
  canonical_image_url?: string | null
  name?: string
  v1_name?: string
  v1_line?: string
  v1_series?: string
  match_represented?: string
  key_features?: string
  // Figure Page v3 Module 1 identity (2026-08-08, WEB-FIGURE-PAGE-V3-SCOPE-2026-08-08.md
  // Phase 2) — real UPC from the master KB, matcher exposed it in the slim export
  // 2026-08-08 (455 records). Render, don't re-derive; most figures won't have one.
  upc?: string
  // Slim-export fill (2026-08-11, MATCHER-TO-WEB-FIELD-COVERAGE-CENSUS-SHIPPED):
  // matcher whitelisted year/retail_price/source after web's 8/8 census found
  // them real in the master KB but never exported. Coverage at ship time:
  // year 52.8%, retail_price 25.4%, source 18.7% — render only when present.
  /** Release year of the figure (number, e.g. 2005). */
  year?: number
  /** Per-figure original retail as a display string incl. currency ("$14.99"). */
  retail_price?: string
  /** INTERNAL provenance slug ("af411", "kb-pm-d1-extracted-…") — never render
   *  to users; values are pipeline identifiers, not human-readable sources. */
  source?: string
  // Passport pour (2026-08-13, matcher v4.2 — ENRICH-V42-POUR-SCHEMA-DESIGN):
  // slim resolved-values block. Receipts live in the per-wave sidecar named
  // by `sidecar` (src/data/figures-provenance/<sidecar>.json) — render values
  // and evidence-class badges from here; quote sources only from the sidecar.
  passport?: PassportBlock
  // Data Defense Layer 3 (2026-08-07, ratified option A): sealed registry of
  // fictitious figures that prove database theft if a competitor's catalog
  // ever contains one. Never index, search, or list-render these — see every
  // is_canary check in sitemap.ts / kbSearch.ts / figure page metadata.
  is_canary?: boolean
}

export function stableIdSuffix(figure_id: string): string | null {
  return /_([0-9a-f]{6})$/i.exec(figure_id)?.[1]?.toLowerCase() ?? null
}

/** A wave value is a real wave number ("1", "11", "1a") vs a text/sub-line slug. */
export function isNumericWave(w: string | null | undefined): boolean {
  if (!w) return false
  return /^[0-9]+[a-z]?$/i.test(String(w).trim())
}

/**
 * Title-case a value that may be hyphen- or space-separated. Consults the
 * override map first, and keeps small words lowercase mid-phrase.
 */
const SMALL_WORDS = new Set(['of', 'the', 'and', 'a', 'an', 'to', 'in', 'vs'])
export function titleCaseValue(raw: string): string {
  if (!raw) return ''
  // Split on whitespace, or a hyphen NOT flanked by digits on both sides
  // (matcher bug report 2026-07-12): a digit-hyphen-digit run ("2013-2014")
  // is a real year/numeric range, not a slug separator -- the old
  // [\s-]+ pattern split it into two unrelated-looking numbers. A normal
  // slug hyphen (at least one side non-digit, e.g. "elite-100") still
  // splits exactly as before -- the OR condition only refuses to split
  // when BOTH neighbors are digits.
  const words = raw.trim().split(/\s+|(?:(?<!\d)-|-(?!\d))/).filter(Boolean)
  return words
    .map((w, i) => {
      const lw = w.toLowerCase()
      const override = prettifySlug(lw)
      // prettifySlug returns a real override for acronym/branded casing.
      if (override !== lw.charAt(0).toUpperCase() + lw.slice(1) && !override.includes(' ')) {
        return override
      }
      if (i > 0 && SMALL_WORDS.has(lw)) return lw
      return lw.charAt(0).toUpperCase() + lw.slice(1)
    })
    .join(' ')
}

/** Token set of a display string, lowercased, for redundancy comparison. */
function tokenSet(s: string): Set<string> {
  return new Set(s.toLowerCase().split(/[\s\-\u00b7()]+/).filter(Boolean))
}

/** True if inner's tokens are all already present in outer. */
function isTokenSubset(inner: string, outer: string): boolean {
  const o = tokenSet(outer)
  const i = tokenSet(inner)
  if (i.size === 0) return true
  for (const t of i) if (!o.has(t)) return false
  return true
}

function isGarbageName(s: string): boolean {
  if (/Series\s+Series/i.test(s)) return true
  return /\bSeries\s+([a-z]+-[a-z-]+|[a-z]{2,})\b/.test(s)
}

/**
 * Derive a display name from KB fields.
 *
 * Resolution order:
 * 1. f.name, unless it contains a known generated-name artifact.
 * 2. Clean v1_* fields.
 * 3. Defensive slug derivation.
 */
export function deriveName(f: KBFigure): string {
  if (f.name && !isGarbageName(f.name)) return f.name

  if (f.v1_name) {
    const name = f.v1_name
    const line = f.v1_line ?? prettifySlug(f.product_line)
    const series = f.v1_series

    let variant = ''
    if (f.character_variant && f.character_variant !== 'None') {
      const vPretty = titleCaseValue(f.character_variant)
      if (!isTokenSubset(vPretty, name)) variant = ` (${vPretty})`
    }

    if (series && line) {
      let seriesPart = ''
      if (isNumericWave(series)) {
        seriesPart = ` Series ${series}`
      } else {
        let pretty = titleCaseValue(series)
        const lineLc = line.toLowerCase()
        if (pretty.toLowerCase().startsWith(lineLc + ' ')) {
          pretty = pretty.slice(line.length).trim()
        }
        const NOISE = /^(action figures?|figures?|action figure series)$/i
        if (pretty && !NOISE.test(pretty) && !isTokenSubset(pretty, line)) {
          seriesPart = ` \u00b7 ${pretty}`
        }
      }
      return `${name}${variant} (${line}${seriesPart})`
    }
    if (line) return `${name}${variant} (${line})`
    return `${name}${variant}`
  }

  const char = f.character_canonical
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  const line = prettifySlug(f.product_line)
  const variant =
    f.character_variant && f.character_variant !== 'None'
      ? ` (${f.character_variant})`
      : ''
  const wave = isNumericWave(f.release_wave) ? ` Series ${f.release_wave}` : ''
  return `${char}${variant} (${line}${wave})`
}

// Phase 2 title/meta fix (2026-08-24, WEBAUDIT-TO-WEB-CURRENT-STATE-AND-NEXT-STEPS):
// deriveName() already embeds the product line into 96.3% of display names
// (the "Name (Line)" / "Name (Line · Series)" shape above), but both figure
// page templates independently re-appended "— {line} Price & Value" on top of
// it, producing titles like "Cody Rhodes (Elite Series) — Elite Series Price &
// Value". 22,496/23,239 titles exceeded 60 chars (median 91) partly because of
// this. One shared helper so both templates can't drift back out of sync.
//
// v1_line correction (2026-08-25, webaudit review): the first version of this
// fix checked displayName against a SEPARATELY recomputed
// prettifySlug(product_line), not the string deriveName() actually embedded.
// In the v1-branch (96.3% of figures) that embedded string is
// `f.v1_line ?? prettifySlug(product_line)` -- when v1_line exists and
// differs textually from the recomputation (quote marks, hyphenation: "3.75\"
// Walmart" vs "3-75-walmart" -> "3 75 Walmart", "All-Star" vs "All Star"),
// the substring check false-negatived and the duplicate-title bug survived
// for 1,722/22,238 v1-branch figures (7.7%). deriveEmbeddedLine() mirrors
// deriveName()'s own branch logic so the check always compares against
// what was actually rendered, not a reconstruction of it.
/** The line-name substring deriveName() actually embeds in its parenthetical,
 *  or null when the plain-name branch (f.name) is used and no line is
 *  embedded at all. */
export function deriveEmbeddedLine(f: KBFigure): string | null {
  if (f.name && !isGarbageName(f.name)) return null
  if (f.v1_name) return f.v1_line ?? prettifySlug(f.product_line)
  return prettifySlug(f.product_line)
}

/** SERP title for a figure page: appends the line only when deriveName()
 *  hasn't already embedded it. Checks against `embeddedLine` (what
 *  deriveEmbeddedLine() says was actually rendered) when present, falling
 *  back to the template's own `line` for the plain-name branch (which never
 *  embeds a line, so the check is always a miss there, correctly). */
export function figurePageTitle(displayName: string, line: string, embeddedLine: string | null): string {
  const check = (embeddedLine ?? line).toLowerCase()
  const alreadyHasLine = displayName.toLowerCase().includes(check)
  return alreadyHasLine ? `${displayName} Price & Value` : `${displayName} — ${line} Price & Value`
}

/** Stable internal URL for a figure. */
export function figureUrl(f: Pick<KBFigure, 'figure_id'>): string {
  return `/figure/${f.figure_id}`
}

export function prettyFigureUrlKey(
  f: Pick<KBFigure, 'fandom' | 'product_line' | 'character_canonical'>,
): string {
  return `${f.fandom}/${f.product_line}/${f.character_canonical}`
}

// ── Pretty-URL uniqueness, using the ROUTER's own match semantics ────────────
// Added 2026-07-27. prettyFigureUrlKey above answers "same exact field values",
// which is NOT the question that decides whether a pretty URL resolves to one
// figure. The router (findFigureMatches.ts) accepts a URL's line segment if it
// equals EITHER `product_line` OR the `manufacturer-product_line` compound,
// lowercased. Build-time and request-time therefore disagreed, and the sitemap
// emitted 6 pretty URLs that 308 to a DIFFERENT figure — all
// /horror/neca-ultimate/*, because a row with product_line "neca-ultimate" has
// a unique exact key while also colliding at request time with every
// manufacturer "neca" + product_line "ultimate" row for the same character.
//
// Three consumers answer "which URL is this figure's real one" — router,
// canonical, sitemap. The canonical layer already resolved these to a single
// winner; the sitemap was the lone dissenter. These two helpers exist so kb.ts
// and kbDb.ts cannot drift apart again: one predicate, both callers.
//
// Measured before adoption, over all 22,725 figures: exact-key unique 11,331 →
// router-unique 11,325. Exactly 6 verdicts change, all unique→ambiguous, none
// the other way — so this can only ever REMOVE a pretty URL, never mint one.
const normSeg = (s: string | undefined | null) => String(s ?? '').toLowerCase().trim()

type RouterKeyFields =
  Pick<KBFigure, 'fandom' | 'product_line' | 'character_canonical'> & { manufacturer?: string }

/**
 * Every key a figure must be COUNTED under: one per line token the router
 * would accept for it. Deduped, because a figure with no manufacturer would
 * otherwise be counted twice under near-identical keys.
 */
export function prettyUrlRouterCountKeys(f: RouterKeyFields): string[] {
  const base = `${f.fandom}|${normSeg(f.character_canonical)}|`
  const pl = normSeg(f.product_line)
  const compound = `${normSeg(f.manufacturer)}-${pl}`
  return compound === pl ? [base + pl] : [base + pl, base + compound]
}

/**
 * The single key to LOOK UP for a figure — keyed on the line segment its own
 * pretty URL would emit, which is always the bare `product_line`.
 */
export function prettyUrlRouterLookupKey(f: RouterKeyFields): string {
  return `${f.fandom}|${normSeg(f.character_canonical)}|${normSeg(f.product_line)}`
}

// ── URL genre slug ↔ KB fandom mapping ──────────────────────────────────────
// Moved here from lib/genreFigures.ts (2026-07-12 Google-zero root-cause fix)
// so kb.ts can consume it without a circular import — genreFigures.ts imports
// from kb.ts and re-exports these for its existing consumers. Every URL the
// site emits (canonicals, sitemap, internal links) MUST use the genre-slug
// form via genreSlugForFandom(); emitting raw f.fandom mints a duplicate
// namespace with no hub and no internal links (the 2026-07 index collapse).

// URL slug → KB fandom slug mapping (URL slugs are pretty; KB slugs are canonical)
//
// 'dungeons-and-dragons': 'dungeons-dragons' REMOVED 2026-07-30. No KB fandom
// named 'dungeons-dragons' has ever existed, so this entry only ever fired
// its identity-fallback inverse: genreSlugForFandom('dungeons-dragons') (via
// the auto-derived FANDOM_TO_SLUG below) returned 'dungeons-and-dragons',
// which has no GENRE_META entry — so /dungeons-dragons (the REAL, live hub
// slug both GENRE_META and GENRE_HUB_LABELS use) permanentRedirect()'d to a
// dead URL on every hit. Dead config since whenever it was added; removing
// it makes /dungeons-dragons self-canonical, which the generic-fantasy
// hub-fold-in (genreFigures.ts DUNGEONS_DRAGONS_FANDOMS) now depends on.
export const SLUG_TO_FANDOM: Record<string, string> = {
  'teenage-mutant-ninja-turtles': 'tmnt',
  'gijoe': 'gi-joe',
  'marvel': 'marvel-comics',
}

export function getFandom(slug: string): string {
  return SLUG_TO_FANDOM[slug] ?? slug
}

// Inverse of SLUG_TO_FANDOM: KB fandom → genre URL slug. Identity fallback
// covers fandoms whose slug already matches (wrestling, dc, …).
//
// ⚠️ 2026-07-27: this comment used to claim the NECA-rollup fandoms "resolve at
// /<fandom>". That was MEASURED FALSE — all seven of /horror /aliens-predator
// /terminator /robocop /scifi /pop-culture /generic-fantasy return 404; only
// the /neca rollup hub serves. The false comment sat on the exact function the
// breadcrumb trusted, telling every reader the bug wasn't there while ~1,922
// live pages linked into those 404s from both the visible crumb and
// BreadcrumbJsonLd.
//
// The identity fallback itself is CORRECT here and load-bearing for tens of
// thousands of working figure/line/character canonicals — do not "fix" it.
// This function answers "what URL segment does this fandom use", which is a
// different question from "is there a hub page to link to". For the latter use
// hubGenreForFandom() / genreCrumbForFandom() in @/lib/genreFigures.
const FANDOM_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_TO_FANDOM).map(([slug, fandom]) => [fandom, slug]),
)
export function genreSlugForFandom(fandom: string): string {
  return FANDOM_TO_SLUG[fandom] ?? fandom
}
