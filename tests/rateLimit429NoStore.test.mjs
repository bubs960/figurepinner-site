import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Class guard: every 429 this codebase emits must be uncacheable.
 *
 * Why it is a real bug and not pedantry: `checkRateLimit` keys its counter on
 * the client IP. If a 429 carries a cacheable Cache-Control, the edge can store
 * one abuser's throttle response and serve it to a completely different
 * visitor, who is then locked out of a route they never touched. On the Stripe
 * routes that means a paying customer being handed "rate_limited" because
 * somebody else scripted the endpoint.
 *
 * Origin (2026-07-26/27), three findings that are all the same shape:
 *   - `figure/[figure_id]` and `price-check` were caught attaching
 *     `public, max-age=300` to their 429s. Live impact was neutralised only
 *     INCIDENTALLY — Next/OpenNext forces `private, no-cache, no-store` on
 *     non-200 dynamic API responses — which is protection the code never
 *     asserts and must not rely on. Both since fixed.
 *   - `sparklines` still emitted a 429 with no Cache-Control header at all
 *     (found 2026-07-27 while adding the Stripe limiters). Fixed.
 * Two independent fixes of one class is the signal to guard the class, per the
 * standing lesson from the NECA rollup: naming a pattern is not guarding it.
 *
 * Deliberately a source scan rather than a runtime test: these handlers need
 * Clerk, Stripe and the Workers Cache API to execute, and a test that has to
 * mock three services to assert one header is a test nobody maintains. The
 * scan is crude and it cannot be silently bypassed, which is the property that
 * matters.
 */
describe('429 responses are never cacheable', () => {
  const SRC = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

  function walk(dir) {
    const out = []
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) out.push(...walk(full))
      else if (/\.tsx?$/.test(entry)) out.push(full)
    }
    return out
  }

  /** Every file/line where a 429 status is set. */
  function emitters() {
    const found = []
    for (const file of walk(SRC)) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        if (/status:\s*429/.test(line)) found.push({ file, line: i + 1, lines, index: i })
      })
    }
    return found
  }

  test('the scanner actually found the known 429 emitters', () => {
    // Without this, a broken walk() makes every assertion below pass vacuously —
    // the same failure mode that made the first breadcrumb guard decorative.
    const n = emitters().length
    assert.ok(n >= 8, `found only ${n} 429 emitters — the scanner is broken, not the code`)
  })

  test('every 429 sets Cache-Control: no-store', () => {
    const offenders = []
    for (const { file, line, lines, index } of emitters()) {
      // The headers object may sit on the same line or a few lines either side
      // of the status, depending on formatting.
      const window = lines.slice(Math.max(0, index - 6), index + 7).join('\n')
      const cc = window.match(/'Cache-Control':\s*'([^']*)'/)
      const rel = file.slice(file.indexOf('src'))
      if (!cc) {
        offenders.push(`${rel}:${line} — no Cache-Control on the 429 at all`)
      } else if (!/no-store/.test(cc[1])) {
        offenders.push(`${rel}:${line} — Cache-Control is '${cc[1]}', which is cacheable`)
      }
    }

    assert.deepEqual(offenders, [],
      `429 response(s) that an edge or browser may cache and replay to a different ` +
      `visitor:\n  ${offenders.join('\n  ')}\n` +
      `The rate limiter keys on IP, so a cached 429 locks out someone who was never ` +
      `throttled. Add 'Cache-Control': 'no-store' to the response headers. Do NOT rely ` +
      `on Next/OpenNext forcing no-store on non-200 dynamic responses — that is ` +
      `incidental behaviour this code must not depend on.`)
  })

  test('both Stripe money routes are rate limited at all', () => {
    // The routes with actual dollar exposure. If someone deletes the limiter,
    // this says so in the same breath as the header rule.
    for (const rel of ['app/api/stripe/checkout/route.ts', 'app/api/stripe/portal/route.ts']) {
      const src = readFileSync(join(SRC, rel), 'utf8')
      assert.match(src, /checkRateLimit\(\s*req\s*,\s*'stripe-(checkout|portal)'/,
        `${rel} no longer calls checkRateLimit — the money routes must stay limited`)
      assert.match(src, /status:\s*429/,
        `${rel} has a limiter but no 429 branch`)
    }
  })

  test('the two Stripe routes use SEPARATE buckets', () => {
    // Shared bucket => abuse of checkout locks paying customers out of the
    // billing portal, which is the worse of the two failure modes.
    const checkout = readFileSync(join(SRC, 'app/api/stripe/checkout/route.ts'), 'utf8')
    const portal = readFileSync(join(SRC, 'app/api/stripe/portal/route.ts'), 'utf8')
    assert.match(checkout, /'stripe-checkout'/)
    assert.match(portal, /'stripe-portal'/)
    assert.doesNotMatch(portal, /'stripe-checkout'/,
      'portal shares the checkout bucket — abuse of one would throttle the other')
  })
})
