/**
 * FigurePinner Site Sentinel — runs every 15 min on cron (S15, 2026-06-10).
 *
 * WHY: the search page's own example query ("wwe elite 11") returned zero
 * results for an unknown period and nothing caught it. Uptime checks don't
 * catch broken-but-200 features. These probes assert the site's revenue path
 * actually WORKS: pages render, search finds figures, typo forgiveness is
 * alive, eBay links carry the affiliate campid.
 *
 * Emails Steve (SENTINEL_EMAIL) via Resend ONLY on failure, rate-limited to
 * one email per 2h via a tiny D1 state table (created on demand).
 *
 * Lives in the alerts worker — branch on event.cron in alert-checker.ts.
 */

import type { Env as AlertsEnv } from './alert-checker'

export interface SentinelEnv extends AlertsEnv {
  SENTINEL_EMAIL: string // where failure emails go
  // Service binding to the figurepinner-site Worker (wrangler.alerts.toml
  // [[services]]). Probing through the public zone hits Bot Fight Mode, which
  // 403s non-browser clients on the Free plan and can't be skipped by a WAF
  // rule — measured 2026-09-22: 480/480 daily probes returned 403, so every
  // run "failed" and emailed a false alarm. Optional so a missing binding
  // degrades to the old public-fetch path instead of crashing the cron.
  SITE?: Fetcher
}

type FetchFn = (input: string, init?: RequestInit) => Promise<Response>

const SITE = 'https://figurepinner.com'
const CAMPID = 'campid=5339147406'
const EMAIL_COOLDOWN_MS = 2 * 60 * 60 * 1000 // 2h between failure emails

interface ProbeResult {
  name: string
  ok: boolean
  detail: string
  ms: number
}

async function probe(
  fetcher: FetchFn,
  name: string,
  url: string,
  check: (res: Response, body: string) => string | null, // null = pass, string = failure detail
): Promise<ProbeResult> {
  const t0 = Date.now()
  try {
    const res = await fetcher(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'user-agent': 'fp-sentinel/1.0' },
    })
    const body = await res.text()
    const failure = check(res, body)
    return { name, ok: failure === null, detail: failure ?? 'ok', ms: Date.now() - t0 }
  } catch (e) {
    return { name, ok: false, detail: `fetch threw: ${String(e).slice(0, 120)}`, ms: Date.now() - t0 }
  }
}

function searchCount(body: string): number {
  try {
    const j = JSON.parse(body) as { figures?: unknown[] }
    return j.figures?.length ?? 0
  } catch {
    return -1
  }
}

export async function runSentinel(env: SentinelEnv): Promise<void> {
  const site = env.SITE
  const fetcher: FetchFn = site ? (input, init) => site.fetch(input, init) : (input, init) => fetch(input, init)
  const via = site ? 'service-binding' : 'public zone (SITE binding missing — Bot Fight Mode will 403 these)'
  const results = await Promise.all([
    probe(fetcher, 'homepage 200 + branded', `${SITE}/`, (res, body) =>
      res.status !== 200 ? `status ${res.status}`
      : !body.includes('FigurePinner') ? 'body missing brand string'
      : null),

    probe(fetcher, 'figure page + affiliate campid', `${SITE}/figure/fp_wrestling_mattel_elite-legends_30_michelle-mccool_51ea22`, (res, body) =>
      res.status !== 200 ? `status ${res.status}`
      : !body.includes(CAMPID) ? 'eBay affiliate campid MISSING — revenue leak'
      : !body.includes('_nkw=') ? 'eBay search link missing'
      : null),

    probe(fetcher, 'search sentinel: "wwe elite 11" > 0', `${SITE}/api/v1/search?q=wwe%20elite%2011`, (res, body) => {
      if (res.status !== 200) return `status ${res.status}`
      const n = searchCount(body)
      return n > 0 ? null : `returned ${n} results — forgiveness ladder broken`
    }),

    probe(fetcher, 'search typo ladder: "hulk hogen" > 0', `${SITE}/api/v1/search?q=hulk%20hogen`, (res, body) => {
      if (res.status !== 200) return `status ${res.status}`
      const n = searchCount(body)
      return n > 0 ? null : `returned ${n} results — typo correction broken`
    }),

    probe(fetcher, 'guides index 200', `${SITE}/guides`, res =>
      res.status !== 200 ? `status ${res.status}` : null),
  ])

  const failures = results.filter(r => !r.ok)
  const summary = results.map(r => `${r.ok ? 'PASS' : 'FAIL'} ${r.name} (${r.ms}ms) ${r.ok ? '' : '— ' + r.detail}`).join('\n')
  console.log(`[sentinel] ${failures.length ? 'FAILURES' : 'all pass'} (via ${via})\n${summary}`)

  if (!failures.length) return

  // ── Rate-limit failure emails via D1 state ─────────────────────────────────
  try {
    await env.DB.prepare(
      'CREATE TABLE IF NOT EXISTS sentinel_state (k TEXT PRIMARY KEY, v TEXT NOT NULL)'
    ).run()
    const row = await env.DB.prepare(
      "SELECT v FROM sentinel_state WHERE k = 'last_email_at'"
    ).first<{ v: string }>()
    if (row && Date.now() - new Date(row.v).getTime() < EMAIL_COOLDOWN_MS) {
      console.log('[sentinel] failures present but within email cooldown — suppressed')
      return
    }
  } catch (e) {
    console.warn('[sentinel] state read failed, sending anyway:', e)
  }

  const to = env.SENTINEL_EMAIL
  if (!to) {
    console.error('[sentinel] SENTINEL_EMAIL not set — cannot send failure email')
    return
  }

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `FigurePinner Sentinel <${env.FROM_EMAIL}>`,
        to,
        subject: `🚨 figurepinner.com sentinel: ${failures.length} check${failures.length > 1 ? 's' : ''} failing`,
        html: `<pre style="font-family:monospace;font-size:13px">${summary
          .replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>
          <p>Probes run every 15 min from the figurepinner-alerts worker.
          Next failure email suppressed for 2h.</p>`,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!emailRes.ok) {
      console.error('[sentinel] Resend error:', await emailRes.text())
      return
    }
    await env.DB.prepare(
      "INSERT INTO sentinel_state (k, v) VALUES ('last_email_at', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v"
    ).bind(new Date().toISOString()).run()
    console.log(`[sentinel] failure email sent to ${to}`)
  } catch (e) {
    console.error('[sentinel] email send threw:', e)
  }
}
