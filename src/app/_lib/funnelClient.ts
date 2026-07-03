'use client'

export type FunnelEvent =
  | 'landing'
  | 'search_submit'
  | 'search_result_click'
  | 'figure_view'
  | 'ebay_exit'
  | 'price_receipt_open'

type FunnelDetail = Record<string, string | number | boolean | null | undefined>

const SESSION_KEY = 'fp_funnel_session'

function sessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const next =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.sessionStorage.setItem(SESSION_KEY, next)
    return next
  } catch {
    return 'unavailable'
  }
}

function referrerHost(): string {
  if (!document.referrer) return ''
  try {
    return new URL(document.referrer).hostname.slice(0, 80)
  } catch {
    return ''
  }
}

function trafficSource(): string {
  const params = new URLSearchParams(window.location.search)
  if (params.has('rdt_cid')) return 'reddit'
  const utm = params.get('utm_source')
  if (utm) return utm.slice(0, 80)
  const ref = referrerHost()
  return ref || 'direct'
}

export function trackFunnel(event: FunnelEvent, detail: FunnelDetail = {}) {
  if (typeof window === 'undefined') return

  const payload = {
    event,
    path: window.location.pathname,
    search: window.location.search.slice(0, 240),
    source: trafficSource(),
    referrer: referrerHost(),
    sessionId: sessionId(),
    ...detail,
  }

  const body = JSON.stringify(payload)
  const blob = new Blob([body], { type: 'application/json' })
  if (navigator.sendBeacon?.('/api/funnel', blob)) return

  fetch('/api/funnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}
