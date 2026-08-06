/**
 * safeNumber.ts — deterministic number formatting that never touches Intl/ICU.
 *
 * Sibling to src/lib/safeDate.ts — read that file's header for the full
 * incident writeup (a 'use client' component calling toLocaleDateString
 * directly in its render body caused a 5-week-live React #418 hydration
 * error, because Cloudflare Workers' V8/ICU build and the browser's
 * disagree on locale-formatted output).
 *
 * Thousands-grouping (`n.toLocaleString('en-US')` with no fraction-digit
 * options) has NOT been observed to diverge the same way real-world CLDR
 * date separators have — plain decimal grouping is far more stable across
 * ICU versions than the date incident's month/day whitespace. This file
 * exists as a zero-cost preventive measure (scripts/predeploy-clean-check.mjs's
 * ICU-risk scan flags any 'use client' file calling toLocaleString directly,
 * confirmed-risky or not, since a grep can't tell render-body from
 * post-hydration usage) — not because a live bug was ever confirmed here.
 */

/** "1,234" / "1,234.56" — comma thousands-grouping, fixed fraction digits.
 *  Same output shape as `n.toLocaleString('en-US', {minimumFractionDigits:
 *  d, maximumFractionDigits: d})`. */
export function formatGroupedNumber(n: number, fractionDigits: number = 0): string {
  const fixed = n.toFixed(fractionDigits)
  const [intPart, fracPart] = fixed.split('.')
  const negative = intPart.startsWith('-')
  const digits = negative ? intPart.slice(1) : intPart
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const withSign = negative ? `-${grouped}` : grouped
  return fracPart ? `${withSign}.${fracPart}` : withSign
}
