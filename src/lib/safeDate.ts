/**
 * safeDate.ts — deterministic date formatting that never touches Intl/ICU.
 *
 * READ THIS before writing toLocaleDateString / toLocaleTimeString /
 * Intl.DateTimeFormat / Intl.NumberFormat ANYWHERE in this codebase,
 * especially in a 'use client' component's render body.
 *
 * 2026-08-06 incident: React error #418 (hydration mismatch) shipped to
 * production for 5 weeks (figureFormatters.ts's formatDate, used in
 * MarketPanel.tsx) and again the same day in a second file
 * (FandomHubInteractive.tsx), because Cloudflare Workers' V8/ICU build and
 * Chrome's disagree on the exact byte output of
 * `toLocaleDateString('en-US', {month:'short', day:'numeric'})` — a
 * documented ICU/CLDR-version discrepancy in the month/day separator
 * whitespace (U+202F narrow-no-break-space vs a plain space), invisible on
 * screen. A 'use client' component re-executes its render function during
 * hydration, so server (Workers) and client (browser) independently call
 * the same Intl function and get back two different strings for the same
 * date — a textbook hydration mismatch on every render with a real date.
 *
 * It reproduced in NEITHER `next dev` NOR `next build && next start` NOR
 * the default `wrangler dev` (implicit --local mode — empty simulated
 * D1/KV never exercised the real-data render path that triggers it) — only
 * in `wrangler dev --remote` or actual production, both against real data.
 * If a hydration bug ever resists a local repro again, that gap is the
 * first thing to suspect: reach for `wrangler dev --remote` before assuming
 * "can't reproduce" means "not a real bug." Full investigation:
 * project_web_status_log.md, 2026-08-05/06 entries.
 *
 * The fix, and the rule going forward: never call toLocaleDateString /
 * Intl.DateTimeFormat directly in a Client Component's render body. Use the
 * functions below instead — they format identically on every runtime
 * because they never touch ICU/CLDR at all.
 *
 * Safe exceptions that do NOT need this file:
 *   - Server Components (render once, never re-executed client-side — see
 *     FandomHub.tsx / FigureDetailContent.tsx for real examples, both
 *     already fixed to use this file anyway since a component's Server/
 *     Client status can change under refactor and this costs nothing).
 *   - Intl calls made inside a useEffect / event handler / imperative DOM
 *     context in a Client Component (runs strictly post-hydration — see
 *     ClaimRitual.tsx's showNameplate(), which stays on toLocaleDateString
 *     deliberately since it's real ambient/DOM code, not JSX render output).
 * When in doubt, use this file anyway. It costs nothing and removes the
 * question — see scripts/predeploy-clean-check.mjs's ICU-risk scan, which
 * flags any 'use client' file calling Intl/toLocale* directly so this
 * class of bug can't silently ship again.
 */

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Jul 15" — UTC month/day, no year. Same output shape as the old
 *  `toLocaleDateString('en-US', {month:'short', day:'numeric'})`. */
export function formatShortDate(d: Date): string {
  return `${SHORT_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`
}

/** "Jul 15, 2026" — UTC month/day/year. Same output shape as the old
 *  `Intl.DateTimeFormat('en-US', {month:'short', day:'numeric', year:'numeric', timeZone:'UTC'})`. */
export function formatShortDateWithYear(d: Date): string {
  return `${SHORT_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}
