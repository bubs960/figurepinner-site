'use client'

// signInReturn — send an anonymous visitor to sign-in WITHOUT losing the
// action that motivated it (2026-09-03 engagement audit, finding #1).
//
// Before: every "Add to Vault" / "Track" / "Alert" CTA did
// `window.location.href = '/sign-in'` on a 401, and Clerk's
// *_FORCE_REDIRECT_URL=/app then dropped the new user on the dashboard. The
// figure they had just tried to save was never saved — the highest-intent
// click on the site ended in nothing. Now:
//   1. the pending intent is stashed in sessionStorage (figure + which CTA),
//   2. /sign-in is opened with `redirect_url=<this page>` — honoured because
//      the env now uses *_FALLBACK_REDIRECT_URL (fallback yields to an
//      explicit redirect_url; "force" ignores it),
//   3. back on the figure page, FigureActions sees the session hint flip
//      true, finds the pending intent for THIS figure, and replays it —
//      vault adds fire automatically; want/alert intents reopen their form.
//
// sessionStorage (not localStorage): one tab, one visit; a stale intent
// cannot resurface days later. Anything older than PENDING_TTL_MS is ignored.

export type PendingIntent = 'vault' | 'want' | 'alert'

const KEY = 'fp:pendingIntent'
const PENDING_TTL_MS = 30 * 60 * 1000

type Pending = { figure_id: string; intent: PendingIntent; at: number }

export function goToSignInWithReturn(figure_id: string, intent: PendingIntent): void {
  if (typeof window === 'undefined') return
  try {
    const pending: Pending = { figure_id, intent, at: Date.now() }
    window.sessionStorage.setItem(KEY, JSON.stringify(pending))
  } catch { /* storage blocked — still return to the page, just no replay */ }
  const here = window.location.pathname + window.location.search
  window.location.href = `/sign-in?redirect_url=${encodeURIComponent(here)}`
}

/** Read-and-clear the pending intent if it belongs to this figure and is fresh. */
export function takePendingIntent(figure_id: string): PendingIntent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Partial<Pending>
    if (p.figure_id !== figure_id) return null
    window.sessionStorage.removeItem(KEY)
    if (typeof p.at !== 'number' || Date.now() - p.at > PENDING_TTL_MS) return null
    return p.intent === 'vault' || p.intent === 'want' || p.intent === 'alert' ? p.intent : null
  } catch {
    return null
  }
}
