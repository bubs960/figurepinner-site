/**
 * kbDbQueries.ts — the SQL behind kbDb.ts, kept free of D1/Workers types so the
 * SAME statements can be (a) executed against the local miniflare SQLite file by
 * scripts/kb-d1-parity-local.mjs (full-catalog old-vs-new parity + EXPLAIN QUERY
 * PLAN, recorded per plan §6 step 5) and (b) unit-tested in
 * tests/kbDbQueries.test.mjs without a Workers binding.
 *
 * OOM stage 2 (2026-09-02, OOM-D1-RUNTIME-CUTOVER-EXECUTION-PLAN-2026-09-01.md §6
 * "bounded query contracts"): every public-route read is an indexed equality on
 * kb_figures — never a full-fandom FULL_COLS scan filtered in JS, never a LOWER()
 * expression the planner cannot serve from an index, never N COUNT queries where
 * one narrow projection builds the same map.
 *
 * Why plain `col = ?` is exactly the old `LOWER(col) = ?`: the catalog invariant
 * (asserted over the whole slim KB by tests/kbDbQueries.test.mjs) is that fandom,
 * manufacturer, product_line and character_canonical are stored lowercase and
 * trimmed, and every route-derived parameter goes through norm() first. Same
 * predicate, now index-served. A future pour that violates the invariant fails
 * the test — that is the drift gate, not a hope.
 *
 * Indexes on kb_figures (scripts/build-kb-d1-sql.mjs schema, canonical names
 * restored by kb-d1-swap.mjs finalize):
 *   idx_kb_figures_fandom       (fandom)
 *   idx_kb_figures_fandom_line  (fandom, product_line)
 *   idx_kb_figures_pretty_url   (fandom, product_line, character_canonical)
 *   idx_kb_figures_character    (character_canonical)
 */

export const KB_TABLE = 'kb_figures'

/** Full detail record — figure page, route resolution (the page renders it). */
export const FULL_COLS =
  'figure_id, fandom, character_canonical, manufacturer, product_line, ' +
  'sub_fandom, character_variant, release_wave, scale, pack_size, exclusive_to, ' +
  'canonical_image_url, name, v1_name, v1_line, v1_series, match_represented, key_features'

/**
 * Compact card record — hubs, related rows, variants. FULL_COLS minus the two
 * prose columns (match_represented, key_features), which are the bulk of every
 * row's bytes and which no card/list surface reads. KBFigure declares both as
 * optional, so a card row is a valid KBFigure with them undefined.
 */
export const CARD_COLS =
  'figure_id, fandom, character_canonical, manufacturer, product_line, ' +
  'sub_fandom, character_variant, release_wave, scale, pack_size, exclusive_to, ' +
  'canonical_image_url, name, v1_name, v1_line, v1_series'

/** Route-key projection — everything prettyUrlRouterCountKeys needs, nothing else. */
export const ROUTE_COLS = 'figure_id, fandom, manufacturer, product_line, character_canonical'

/** D1 refuses a statement with more than 100 bound parameters; IN lists chunk under it. */
export const D1_MAX_BOUND_PARAMS = 100
export const IN_CHUNK = 90

export type Query = { sql: string; params: Array<string | number> }

/** Same normalization the router applies to a URL segment (findFigureMatches.ts). */
export const norm = (s: string | null | undefined): string => String(s ?? '').toLowerCase().trim()

/**
 * Every (manufacturer, product_line) pair whose `manufacturer-product_line`
 * compound equals `token` — one candidate per hyphen position, ends included.
 * For a row with compound === token the split at manufacturer.length is a
 * hyphen by construction and yields exactly that row's pair, so a union of
 * indexed equality lookups over these splits is the same set as the old
 * `manufacturer || '-' || product_line = ?` expression scan.
 */
export function compoundSplits(token: string): Array<{ manufacturer: string; product_line: string }> {
  const out: Array<{ manufacturer: string; product_line: string }> = []
  for (let i = 0; i < token.length; i++) {
    if (token[i] === '-') out.push({ manufacturer: token.slice(0, i), product_line: token.slice(i + 1) })
  }
  return out
}

/** Pure twin of the SQL line predicate, for tests and the router's JS filter. */
export function rowMatchesLineToken(
  row: { manufacturer: string | null | undefined; product_line: string | null | undefined },
  token: string,
): boolean {
  const pl = norm(row.product_line)
  const mfr = norm(row.manufacturer)
  return pl === token || `${mfr}-${pl}` === token
}

/**
 * The bounded plan for "every figure whose line segment matches lineSlug":
 * one (fandom, product_line) index lookup for the bare form plus one
 * (fandom, product_line, manufacturer) lookup per hyphen split for the compound
 * form. Executed as ONE db.batch() round trip. rowid rides along so the union
 * can be merged back into the table order the old single scan returned.
 */
export function lineQueryPlan(cols: string, fandom: string, lineSlug: string): Query[] {
  const token = norm(lineSlug)
  const plan: Query[] = [
    { sql: `SELECT rowid AS rid, ${cols} FROM ${KB_TABLE} WHERE fandom = ? AND product_line = ?`, params: [fandom, token] },
  ]
  for (const s of compoundSplits(token)) {
    plan.push({
      sql: `SELECT rowid AS rid, ${cols} FROM ${KB_TABLE} WHERE fandom = ? AND product_line = ? AND manufacturer = ?`,
      params: [fandom, s.product_line, s.manufacturer],
    })
  }
  return plan
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/** Every set read below selects `rowid AS rid` so ordering is decided here, not by the planner. */
export type WithRid = { rid: number; product_line: string }

/**
 * The order the old whole-fandom scan returned rows in: SQLite served
 * `WHERE fandom = ?` from idx_kb_figures_fandom_line (measured — EXPLAIN in
 * scripts/kb-d1-parity-local.mjs), i.e. (product_line, rowid). Every bounded
 * read that replaced a JS filter over that scan re-applies the same order here,
 * so first-N selections (JSON-LD lists, hero images, wave companions, the
 * route resolver's tie order) are unchanged, and no longer depend on which
 * index the planner happens to pick. Within one product_line this is plain
 * rowid order. Sorts in place and returns the array.
 */
export function sortLikeFandomScan<T extends WithRid>(rows: T[]): T[] {
  return rows.sort((a, b) =>
    a.product_line < b.product_line ? -1 : a.product_line > b.product_line ? 1 : a.rid - b.rid,
  )
}

const placeholders = (n: number) => Array.from({ length: n }, () => '?').join(', ')

export const SQL = {
  /** PK lookup. */
  figureById: `SELECT ${FULL_COLS} FROM ${KB_TABLE} WHERE figure_id = ?`,

  /** PK IN-list (≤ IN_CHUNK ids per statement). */
  figuresByIds: (n: number) => `SELECT ${FULL_COLS} FROM ${KB_TABLE} WHERE figure_id IN (${placeholders(n)})`,

  /**
   * (character_canonical) index seek, then fandom filter — bounded by one
   * character. Carries rowid; callers apply sortLikeFandomScan.
   */
  figuresByCharacter: (cols: string) =>
    `SELECT rowid AS rid, ${cols} FROM ${KB_TABLE} WHERE fandom = ? AND character_canonical = ?`,

  /**
   * Figures in one (fandom, product_line) sharing a release wave — the figure
   * page's wave companions. An empty mapped wave ('' from mapRow) is stored as
   * NULL or '' in D1, so the empty case matches both, exactly as the old JS
   * filter over mapped rows did. Carries rowid; callers apply sortLikeFandomScan.
   */
  waveCompanions: (cols: string, waveIsEmpty: boolean) =>
    waveIsEmpty
      ? `SELECT rowid AS rid, ${cols} FROM ${KB_TABLE} WHERE fandom = ? AND product_line = ? AND (release_wave IS NULL OR release_wave = '')`
      : `SELECT rowid AS rid, ${cols} FROM ${KB_TABLE} WHERE fandom = ? AND product_line = ? AND release_wave = ?`,

  /**
   * Single-record pretty-URL uniqueness (detail routes only). The old form was
   * `fandom = ? AND (LOWER(product_line) = ? OR LOWER(manufacturer || '-' ||
   * product_line) = ?) AND LOWER(character_canonical) = ?` — a fandom-range scan
   * evaluating LOWER() per row. Same predicate minus LOWER(), reordered so the
   * planner seeks (character_canonical) and evaluates the OR on that handful.
   */
  prettyUrlUniqueCount:
    `SELECT COUNT(*) AS c FROM ${KB_TABLE} WHERE fandom = ? AND character_canonical = ? ` +
    `AND (product_line = ? OR manufacturer || '-' || product_line = ?)`,

  /**
   * Route rows for a set of characters (≤ IN_CHUNK per statement). Deliberately
   * NO `fandom = ?` here: with it the planner takes the (fandom, …) range and
   * filters the IN list over the whole fandom (measured locally: 20× slower);
   * without it the (character_canonical) index seeks each name. kbDb filters
   * the fandom in JS — the same-name-in-another-fandom rows are a handful.
   */
  routeRowsForCharacters: (n: number) =>
    `SELECT ${ROUTE_COLS} FROM ${KB_TABLE} WHERE character_canonical IN (${placeholders(n)})`,

  /**
   * The ONE remaining whole-fandom read: the genre hub renders the whole
   * fandom (line groups, counts, shelf). Compact projection, no prose; ISR
   * route (revalidate 3600). Grouped-count + top-N-per-line is the follow-up
   * that would bound it further — separate release, not the incident one.
   */
  cardsByFandom: `SELECT rowid AS rid, ${CARD_COLS} FROM ${KB_TABLE} WHERE fandom = ?`,

  /** Line-completion denominators for the vault: grouped in SQL, never a row scan in JS. */
  lineWaveCounts:
    `SELECT product_line, release_wave, COUNT(*) AS c FROM ${KB_TABLE} ` +
    `WHERE fandom = ? AND release_wave IS NOT NULL AND release_wave != '' ` +
    `GROUP BY product_line, release_wave`,

  allFandoms: `SELECT DISTINCT fandom FROM ${KB_TABLE}`,
  /** Indexed existence probe (idx_kb_figures_fandom): 1 row, replaces the DISTINCT scan as the route-validity gate. */
  fandomExists: `SELECT 1 AS one FROM ${KB_TABLE} WHERE fandom = ? LIMIT 1`,
  linesByFandom: `SELECT DISTINCT product_line FROM ${KB_TABLE} WHERE fandom = ?`,

  /**
   * Stable-suffix fallback (404 path only: /figure/<stale-id> → survivor). This
   * is the one deliberately non-indexed predicate left: it scans the PK index
   * (figure_id only, no row fetch). Bounding it needs a stored/expression index
   * on the suffix — a schema change routed through the emitter + swap, not
   * bundled into the incident release (plan §6 rule 5). Measured plan recorded
   * by scripts/kb-d1-parity-local.mjs.
   */
  stableSuffix:
    `SELECT figure_id FROM ${KB_TABLE} WHERE SUBSTR(figure_id, -7, 1) = '_' AND LOWER(SUBSTR(figure_id, -6)) = ? LIMIT 2`,
}
