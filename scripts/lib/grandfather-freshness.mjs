/**
 * grandfather-freshness.mjs — corpus focus spec v3 §4.3 / §4.6.
 *
 * The grandfather set is the GSC indexed-pages export: every URL in it stays
 * tier 2 no matter what the comps rule says. Because that export is the only
 * thing standing between the rule and a page Google already indexed, the
 * build must FAIL (never silently proceed) when the export is:
 *   - missing;
 *   - older than MAX_AGE_HOURS (48 h) relative to the ship date;
 *   - smaller than the last committed grandfather set (a shrunk export means
 *     a partial download or a filtered view, not fewer indexed pages);
 *   - exactly 1,000 rows (the GSC UI export cap - the list was truncated).
 * Pure function over the file so tests/grandfatherFreshness.test.mjs can
 * exercise every branch with temp files. build-google-index-bar.mjs calls it
 * in wave mode (not in the canary artifact, whose grandfather_asof is null).
 */
import { readFileSync, existsSync, statSync } from 'node:fs'

export const MAX_AGE_HOURS = 48
export const GSC_UI_CAP = 1000

/** Parse `GSC-INDEXED-PAGES-<YYYY-MM-DD>.csv` -> Date, else the file mtime. */
export function exportAsOf(path) {
  const m = /GSC-INDEXED-PAGES-(\d{4}-\d{2}-\d{2})/.exec(path)
  if (m) return new Date(`${m[1]}T00:00:00Z`)
  return statSync(path).mtime
}

/** Count URL rows (non-empty lines minus a header if the first cell is not a URL). */
export function countUrlRows(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return 0
  const first = lines[0].split(',')[0].replace(/"/g, '').trim()
  return /^https?:\/\//.test(first) ? lines.length : lines.length - 1
}

/**
 * @param {{path: string, shipDate: Date, lastCommittedCount: number, now?: Date}} args
 * @returns {{ok: boolean, reason: string|null, rows: number, asof: Date|null, ageHours: number|null}}
 */
export function checkGrandfatherExport({ path, shipDate, lastCommittedCount, now = new Date() }) {
  if (!path || !existsSync(path)) return { ok: false, reason: 'missing', rows: 0, asof: null, ageHours: null }
  const asof = exportAsOf(path)
  const ref = shipDate instanceof Date && !Number.isNaN(shipDate.getTime()) ? shipDate : now
  const ageHours = (ref.getTime() - asof.getTime()) / 3600e3
  const rows = countUrlRows(readFileSync(path, 'utf8'))
  if (ageHours > MAX_AGE_HOURS) return { ok: false, reason: `stale: ${ageHours.toFixed(1)} h old at ship date (max ${MAX_AGE_HOURS})`, rows, asof, ageHours }
  if (rows === 0) return { ok: false, reason: 'empty', rows, asof, ageHours }
  if (rows === GSC_UI_CAP) return { ok: false, reason: `exactly ${GSC_UI_CAP} rows = GSC UI export cap, list truncated`, rows, asof, ageHours }
  if (Number.isFinite(lastCommittedCount) && rows < lastCommittedCount) return { ok: false, reason: `shrunk: ${rows} rows < last committed ${lastCommittedCount}`, rows, asof, ageHours }
  return { ok: true, reason: null, rows, asof, ageHours }
}
