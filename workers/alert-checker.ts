/**
 * FigurePinner Deal Alert Checker
 * Cloudflare Worker — runs on cron schedule (8am UTC daily)
 *
 * Flow:
 *  1. Load all active alerts with target_price > 0 from D1
 *  2. Deduplicate by figure_id → batch-fetch prices from figurepinner-api
 *  3. For each alert where current_price <= target_price:
 *     a. Skip if we sent an alert within the last 23 hours (rate-limit)
 *     b. Look up the user's email via Clerk API
 *     c. Send HTML email via Resend
 *     d. Update last_triggered_at + last_sent_price in D1
 *
 * Deploy: npx wrangler deploy --config wrangler.alerts.toml
 */

export interface Env {
  DB: D1Database
  RESEND_API_KEY: string
  CLERK_SECRET_KEY: string
  FIGUREPINNER_API_URL: string   // e.g. https://figurepinner-api.bubs960.workers.dev
  FROM_EMAIL: string             // verified Resend sender
  UNSUBSCRIBE_SECRET: string     // shared with Next.js app — signs one-click unsubscribe tokens
  APP_URL: string                // e.g. https://figurepinner.com
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Alert {
  id: string
  user_id: string
  figure_id: string
  name: string
  brand: string | null
  line: string | null
  genre: string | null
  target_price: number
  is_active: number
  created_at: string
  last_triggered_at: string | null
  last_sent_price: number | null
}

interface PriceData {
  figureId: string
  avgSold: number | null
  medianSold: number | null
  soldCount: number
}

interface ClerkEmailAddress {
  email_address: string
  verification: { status: string }
}

interface ClerkUser {
  email_addresses: ClerkEmailAddress[]
  first_name: string | null
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runAlertCheck(env))
  },
}

async function runAlertCheck(env: Env): Promise<void> {
  const startMs = Date.now()
  console.log('[alerts] Starting check at', new Date().toISOString())

  // ── 1. Load active alerts ─────────────────────────────────────────────────
  const { results } = await env.DB
    .prepare(`
      SELECT * FROM alerts
      WHERE is_active = 1
        AND target_price > 0
    `)
    .all<Alert>()

  if (!results.length) {
    console.log('[alerts] No active alerts — done')
    return
  }

  console.log(`[alerts] ${results.length} active alerts across ${new Set(results.map(a => a.user_id)).size} users`)

  // ── 2. Batch-fetch prices (one request per unique figure_id) ─────────────
  const figureIds = [...new Set(results.map(a => a.figure_id))]
  const priceMap = new Map<string, number | null>()

  await Promise.allSettled(
    figureIds.map(async figureId => {
      try {
        const res = await fetch(
          `${env.FIGUREPINNER_API_URL}/api/v1/figure-price?figureId=${encodeURIComponent(figureId)}`,
          { signal: AbortSignal.timeout(5000) }
        )
        if (res.ok) {
          const data = await res.json() as PriceData
          const price = data.medianSold ?? data.avgSold ?? null
          priceMap.set(figureId, price)
        }
      } catch (e) {
        console.warn(`[alerts] Price fetch failed for ${figureId}:`, e)
      }
    })
  )

  console.log(`[alerts] Fetched prices for ${priceMap.size}/${figureIds.length} figures`)

  // ── 3. Check each alert ───────────────────────────────────────────────────
  const COOLDOWN_MS = 23 * 60 * 60 * 1000   // 23 hours — prevents double-send if cron runs twice
  let sent = 0
  let skipped = 0

  for (const alert of results) {
    const currentPrice = priceMap.get(alert.figure_id)

    // No price data available — skip
    if (currentPrice == null) { skipped++; continue }

    // Price is above target — not a deal yet
    if (currentPrice > alert.target_price) { skipped++; continue }

    // Cooldown: already sent an alert recently
    if (alert.last_triggered_at) {
      const lastSent = new Date(alert.last_triggered_at).getTime()
      if (Date.now() - lastSent < COOLDOWN_MS) { skipped++; continue }
    }

    // ── Get user email from Clerk ────────────────────────────────────────
    let userEmail: string | null = null
    let firstName: string | null = null
    try {
      const clerkRes = await fetch(
        `https://api.clerk.com/v1/users/${alert.user_id}`,
        {
          headers: { Authorization: `Bearer ${env.CLERK_SECRET_KEY}` },
          signal: AbortSignal.timeout(4000),
        }
      )
      if (clerkRes.ok) {
        const user = await clerkRes.json() as ClerkUser
        const primary = user.email_addresses?.find(e => e.verification?.status === 'verified')
          ?? user.email_addresses?.[0]
        userEmail = primary?.email_address ?? null
        firstName = user.first_name ?? null
      }
    } catch (e) {
      console.warn(`[alerts] Clerk lookup failed for ${alert.user_id}:`, e)
    }

    if (!userEmail) { skipped++; continue }

    // ── Build unsubscribe URL ─────────────────────────────────────────────
    const appUrl = env.APP_URL ?? 'https://figurepinner.com'
    const unsubscribeUrl = env.UNSUBSCRIBE_SECRET
      ? await buildUnsubscribeUrl(alert, env.UNSUBSCRIBE_SECRET, appUrl)
      : `${appUrl}/app/alerts`   // fallback if secret not yet set

    // ── Send email via Resend ─────────────────────────────────────────────
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `FigurePinner Alerts <${env.FROM_EMAIL}>`,
          to: userEmail,
          subject: `🎯 Deal Alert: ${alert.name} is now $${currentPrice.toFixed(0)}`,
          html: buildEmailHtml({ alert, currentPrice, firstName, unsubscribeUrl }),
        }),
        signal: AbortSignal.timeout(8000),
      })

      if (!emailRes.ok) {
        const errBody = await emailRes.text()
        console.error(`[alerts] Resend error for alert ${alert.id}:`, errBody)
        skipped++
        continue
      }
    } catch (e) {
      console.warn(`[alerts] Email send failed for alert ${alert.id}:`, e)
      skipped++
      continue
    }

    // ── Update D1 — mark as triggered ────────────────────────────────────
    await env.DB
      .prepare('UPDATE alerts SET last_triggered_at = ?, last_sent_price = ? WHERE id = ?')
      .bind(new Date().toISOString(), currentPrice, alert.id)
      .run()

    console.log(`[alerts] Sent alert ${alert.id} → ${userEmail} (${alert.name} @ $${currentPrice})`)
    sent++
  }

  console.log(`[alerts] Done in ${Date.now() - startMs}ms — ${sent} sent, ${skipped} skipped`)
}

// ─── Unsubscribe token ────────────────────────────────────────────────────────

/**
 * Generates a signed one-click unsubscribe URL.
 * Token params: id, ts, sig — verified by /api/alerts/unsubscribe in the Next.js app.
 */
async function buildUnsubscribeUrl(
  alert: Alert,
  secret: string,
  appUrl: string,
): Promise<string> {
  const ts = String(Date.now())
  const payload = `${alert.id}|${ts}`
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBytes = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  const sig = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const params = new URLSearchParams({
    id:   alert.id,
    ts,
    sig,
    name: alert.name,
  })
  return `${appUrl}/api/alerts/unsubscribe?${params.toString()}`
}

// ─── Email template ───────────────────────────────────────────────────────────

function buildEmailHtml({
  alert,
  currentPrice,
  firstName,
  unsubscribeUrl,
}: {
  alert: Alert
  currentPrice: number
  firstName: string | null
  unsubscribeUrl: string
}): string {
  const figureUrl  = `https://figurepinner.com/figure/${alert.figure_id}`
  const alertsUrl  = 'https://figurepinner.com/app/alerts'
  const savings    = alert.target_price - currentPrice
  const savingsPct = Math.round((savings / alert.target_price) * 100)
  const greeting   = firstName ? `Hey ${firstName},` : 'Hey,'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Deal Alert: ${escHtml(alert.name)}</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0C;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#E8E8F0;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0C;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

        <!-- Logo -->
        <tr><td style="padding-bottom:28px;">
          <a href="https://figurepinner.com" style="text-decoration:none;font-size:18px;font-weight:800;letter-spacing:0.04em;color:#E8E8F0;">
            Figure<span style="color:#0066FF;">Pinner</span>
          </a>
        </td></tr>

        <!-- Alert card -->
        <tr><td style="background:#14141C;border:1px solid #2A2A3A;border-radius:12px;overflow:hidden;">

          <!-- Header bar -->
          <div style="background:linear-gradient(135deg,#0066FF18,#0066FF08);border-bottom:1px solid #2A2A3A;padding:20px 24px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0066FF;margin-bottom:6px;">
              🎯 Deal Alert Triggered
            </div>
            <div style="font-size:22px;font-weight:800;color:#E8E8F0;line-height:1.2;">
              ${escHtml(alert.name)}
            </div>
            ${alert.line ? `<div style="font-size:13px;color:#888;margin-top:4px;">${escHtml(alert.line)}</div>` : ''}
          </div>

          <!-- Price comparison -->
          <div style="padding:20px 24px;border-bottom:1px solid #2A2A3A;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center;padding:0 8px;">
                  <div style="font-size:11px;color:#888;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px;">Current Price</div>
                  <div style="font-size:32px;font-weight:800;color:#00C870;">$${currentPrice.toFixed(0)}</div>
                </td>
                <td style="text-align:center;color:#555;font-size:20px;width:40px;">→</td>
                <td style="text-align:center;padding:0 8px;">
                  <div style="font-size:11px;color:#888;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px;">Your Target</div>
                  <div style="font-size:32px;font-weight:800;color:#E8E8F0;">$${alert.target_price.toFixed(0)}</div>
                </td>
              </tr>
            </table>
            ${savings > 0 ? `
            <div style="margin-top:14px;text-align:center;background:#00C87010;border:1px solid #00C87030;border-radius:8px;padding:10px;">
              <span style="font-size:13px;font-weight:700;color:#00C870;">
                $${savings.toFixed(0)} below your target · ${savingsPct}% savings
              </span>
            </div>` : ''}
          </div>

          <!-- Body copy -->
          <div style="padding:20px 24px 8px;">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#B0B0C0;">
              ${greeting} your deal alert for <strong style="color:#E8E8F0;">${escHtml(alert.name)}</strong> just fired.
              The current market price hit your $${alert.target_price.toFixed(0)} target.
            </p>
          </div>

          <!-- CTA buttons -->
          <div style="padding:8px 24px 24px;display:flex;gap:10px;">
            <a href="${figureUrl}"
               style="display:inline-block;background:#0066FF;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:700;margin-right:10px;">
              View Price History →
            </a>
            <a href="https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(alert.name)}&LH_Sold=1&LH_Complete=1"
               style="display:inline-block;background:#1A1A28;color:#E8E8F0;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid #2A2A3A;">
              Search on eBay
            </a>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;">
          <p style="font-size:12px;color:#555;line-height:1.6;margin:0;">
            You're receiving this because you set a deal alert on FigurePinner.
            <a href="${alertsUrl}" style="color:#555;text-decoration:underline;">Manage your alerts</a>
            or
            <a href="${unsubscribeUrl}" style="color:#555;text-decoration:underline;">unsubscribe from this alert</a>.
          </p>
          <p style="font-size:11px;color:#444;margin:8px 0 0;">
            © ${new Date().getFullYear()} FigurePinner · Prices based on recent eBay sold listings.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
