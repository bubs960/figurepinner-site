// scalePassport.ts — row builder for the SCALE passport render (208+ poured
// figures, 8/13 tiering ruling WEB-TO-MATCHER-PASSPORT-FIELD-TIERING-RESOLVED).
// Reads the slim `passport` block poured into the KB (values + evidence class
// only); receipts live in the per-wave provenance sidecar and are resolved by
// the component, not here.
//
// Two bars, on purpose: golden-corpus showcase figures keep GoldenCorpusPassport
// (full bar, every applicable field). This module implements the SCALE bar:
//   - unresolved CORE field  → honest "Not yet documented" row
//   - unresolved STRETCH field → row OMITTED entirely (absence is noise)
//   - packaging_style dropped entirely (v4 product decision)
// CORE lists below are a render-side copy of matcher's canonical config at
// `Fig Pinner Dev - Claude/scripts/enrich-v42-passport-gate-fields.json`
// (passport-gate-fields-1, ACKed 2026-08-13 incl. Delta 1 + the 8/13
// core_by_product_line era profiles). If matcher revs that file, this copy
// must follow — the gate config relay flow is the sync mechanism.

import type { KBFigure } from '@/data/kbTypes'

// ── Gate config (copy of passport-gate-fields-1; see header) ────────────────

const CORE_DEFAULT = [
  'included_items',
  'fingerprint.attire_reference',
  'fingerprint.head_sculpt',
  'fingerprint.articulation_points',
  'identity_bonus.original_retail_price',
  'fingerprint.gear_colors',
  'fingerprint.face_technology',
]

// Per-fandom entries REPLACE the default entirely (no additive merge).
const CORE_BY_FANDOM: Record<string, string[]> = {
  'marvel-comics': CORE_DEFAULT,
  'star-wars': CORE_DEFAULT,
  'gi-joe': CORE_DEFAULT,
  // articulation_points not load-bearing for wrestling (0/5 prod-44 receipt)
  wrestling: CORE_DEFAULT.filter(f => f !== 'fingerprint.articulation_points'),
  // attire/head_sculpt/face_technology n/a by construction
  transformers: [
    'included_items',
    'fingerprint.articulation_points',
    'identity_bonus.original_retail_price',
    'fingerprint.gear_colors',
  ],
}

// Era-scoped profiles keyed manufacturer/product_line — take precedence over
// fandom (Steve-approved option 3 after jakks33: spec-table-only web coverage).
const CORE_BY_PRODUCT_LINE: Record<string, string[]> = {
  'jakks-pacific/classic-superstars': [
    'included_items',
    'identity_bonus.original_retail_price',
    'identity_bonus.street_date',
  ],
  'jakks-pacific/deluxe-aggression': [
    'included_items',
    'identity_bonus.original_retail_price',
    'identity_bonus.street_date',
  ],
}

// Delta 1: BAF is wave-scoped. The pair becomes CORE iff the wave's poured
// evidence carries any baf claim (on any figure in the wave).
const CONDITIONAL_CORE_WAVE_HAS_BAF = ['wave_context.baf_target', 'wave_context.baf_piece']

// v4 product decision: packaging_style never renders, resolved or not.
const DROP_ENTIRELY = /^fingerprint\.packaging_style$/

// ── Row model ───────────────────────────────────────────────────────────────

export interface ScaleRow {
  /** Full field path incl. index ("included_items[2]") — stable render key. */
  key: string
  label: string
  status: 'resolved' | 'missing'
  value?: string
  /** Evidence class (matcher vocabulary) — absent on derived rows. */
  ec?: string
  /** Pour-derived row (closed whitelist), not an evidence-locked claim. */
  derived?: boolean
}

export interface ScaleGroup {
  title: string
  rows: ScaleRow[]
}

const FIELD_LABELS: Array<{ match: RegExp; label: string }> = [
  { match: /^fingerprint\.attire_reference$/, label: 'Attire' },
  { match: /^fingerprint\.gear_colors$/, label: 'Gear colors' },
  { match: /^fingerprint\.head_sculpt$/, label: 'Head sculpt' },
  { match: /^fingerprint\.face_technology$/, label: 'Face technology' },
  { match: /^fingerprint\.articulation_points$/, label: 'Articulation' },
  { match: /^fingerprint\.visual_identifiers\[\d+\]$/, label: 'Visual identifier' },
  { match: /^fingerprint\.known_variants(\[\d+\])?$/, label: 'Known variants' },
  { match: /^included_items(\[\d+\])?$/, label: 'In the box' },
  { match: /^wave_context\.baf_target(@self)?$/, label: 'Build-a-Figure target' },
  { match: /^wave_context\.baf_piece$/, label: 'Build-a-Figure piece' },
  { match: /^identity_bonus\.manufacturer_sku$/, label: 'Manufacturer SKU' },
  { match: /^identity_bonus\.street_date$/, label: 'Street date' },
  { match: /^identity_bonus\.original_retail_price$/, label: 'Original retail price' },
]

export function scaleFieldLabel(fieldPath: string): string {
  return FIELD_LABELS.find(f => f.match.test(fieldPath))?.label ?? fieldPath
}

const GROUPS: Array<{ title: string; prefixes: string[] }> = [
  { title: 'Figure Fingerprint', prefixes: ['fingerprint.'] },
  { title: 'In the Box', prefixes: ['included_items'] },
  { title: 'Wave Context', prefixes: ['wave_context.'] },
  { title: 'Release Details', prefixes: ['identity_bonus.'] },
]

/** Strip "[n]" / "@self" so an indexed or derived key matches its base field. */
function baseField(key: string): string {
  return key.replace(/\[\d+\]/, '').replace(/@self$/, '')
}

function coreFieldsFor(fig: KBFigure, waveHasBaf: boolean): string[] {
  const byLine = CORE_BY_PRODUCT_LINE[`${fig.manufacturer}/${fig.product_line}`]
  const core = byLine ?? CORE_BY_FANDOM[fig.fandom] ?? CORE_DEFAULT
  return waveHasBaf ? [...core, ...CONDITIONAL_CORE_WAVE_HAS_BAF] : core
}

/** True when any figure in the wave carries a poured baf claim (Delta 1). */
export function waveHasBafEvidence(fullWave: KBFigure[]): boolean {
  return fullWave.some(f => {
    const p = f.passport
    if (!p) return false
    return Object.keys(p.fields).concat(Object.keys(p.derived ?? {}))
      .some(k => baseField(k).startsWith('wave_context.baf_'))
  })
}

/**
 * Build the render groups for a scale-passport figure. Returns null when the
 * figure has no poured passport block. Every resolved field renders (with its
 * evidence badge); missing CORE fields render as honest gaps; missing stretch
 * fields are omitted.
 */
export function buildScalePassportGroups(fig: KBFigure, fullWave: KBFigure[]): ScaleGroup[] | null {
  const p = fig.passport
  if (!p) return null

  const rows: ScaleRow[] = []
  for (const [key, field] of Object.entries(p.fields)) {
    if (DROP_ENTIRELY.test(baseField(key))) continue
    rows.push({ key, label: scaleFieldLabel(key), status: 'resolved', value: field.value, ec: field.ec })
  }
  for (const [key, value] of Object.entries(p.derived ?? {})) {
    if (DROP_ENTIRELY.test(baseField(key))) continue
    rows.push({ key, label: scaleFieldLabel(key), status: 'resolved', value, derived: true })
  }

  const present = new Set(rows.map(r => baseField(r.key)))
  const core = coreFieldsFor(fig, waveHasBafEvidence(fullWave))
  for (const field of core) {
    if (!present.has(field)) {
      rows.push({ key: field, label: scaleFieldLabel(field), status: 'missing' })
    }
  }

  // Stable order inside each group: field-path sort keeps included_items[2]
  // after [1]; missing CORE rows sink below resolved rows.
  const groups = GROUPS.map(g => ({
    title: g.title,
    rows: rows
      .filter(r => g.prefixes.some(pre => r.key.startsWith(pre)))
      .sort((a, b) =>
        (a.status === 'missing' ? 1 : 0) - (b.status === 'missing' ? 1 : 0) ||
        a.key.localeCompare(b.key, undefined, { numeric: true })
      ),
  })).filter(g => g.rows.length > 0)

  return groups.length > 0 ? groups : null
}
