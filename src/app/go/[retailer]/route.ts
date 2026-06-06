/**
 * /go/[retailer] — affiliate-aware tracked redirect
 *
 * See coinspinner-site/functions/go/[retailer].ts for full rationale.
 * Two routes, same retailer config — keep them in sync.
 *
 * Why this version is a Next.js Route Handler (not Pages Functions):
 *   figurepinner-site deploys via OpenNext/Workers — full SSR. Pages
 *   Functions aren't picked up in this deploy mode. coinspinner-site is
 *   static export, so it uses Pages Functions instead.
 */

import { NextResponse, type NextRequest } from 'next/server'


// ── Retailer config ─────────────────────────────────────────────────────────

interface RetailerConfig {
  hosts: string[]
  affiliate: null | AffiliateInjector
}

type AffiliateInjector =
  | { kind: 'querystring'; params: Record<string, string> }
  | { kind: 'wrap'; template: string }
  | { kind: 'epn'; campid: string }

const RETAILERS: Record<string, RetailerConfig> = {
  // ── ACTIVE ─────────────────────────────────────────────────────────
  ebay: {
    hosts: ['ebay.com', 'www.ebay.com'],
    affiliate: { kind: 'epn', campid: '5339147406' },
  },

  // ── PENDING APPLICATION (swap when accepted) ───────────────────────
  // Figures
  ee: { hosts: ['entertainmentearth.com', 'www.entertainmentearth.com'], affiliate: null },
  sideshow: { hosts: ['sideshow.com', 'www.sideshow.com', 'www.sideshowtoy.com'], affiliate: null },
  bbts: { hosts: ['bigbadtoystore.com', 'www.bigbadtoystore.com'], affiliate: null },
  ringside: { hosts: ['ringsidecollectibles.com', 'www.ringsidecollectibles.com'], affiliate: null },
  mattel: { hosts: ['creations.mattel.com'], affiliate: null },
  hasbro: { hosts: ['hasbropulse.com', 'www.hasbropulse.com'], affiliate: null },
  target: { hosts: ['target.com', 'www.target.com'], affiliate: null },
  walmart: { hosts: ['walmart.com', 'www.walmart.com'], affiliate: null },
  amazon: { hosts: ['amazon.com', 'www.amazon.com', 'smile.amazon.com'], affiliate: null },
  whatnot: { hosts: ['whatnot.com', 'www.whatnot.com'], affiliate: null },
}

// ── Build the final URL with affiliate params ───────────────────────────────

function buildAffiliateUrl(retailer: RetailerConfig, dest: URL): string {
  if (!retailer.affiliate) return dest.toString()

  const aff = retailer.affiliate
  if (aff.kind === 'querystring') {
    for (const [k, v] of Object.entries(aff.params)) {
      dest.searchParams.set(k, v)
    }
    return dest.toString()
  }
  if (aff.kind === 'wrap') {
    return aff.template.replace('{url}', encodeURIComponent(dest.toString()))
  }
  if (aff.kind === 'epn') {
    dest.searchParams.set('mkcid', '1')
    dest.searchParams.set('mkrid', '711-53200-19255-0')
    dest.searchParams.set('campid', aff.campid)
    dest.searchParams.set('toolid', '10001')
    return dest.toString()
  }
  return dest.toString()
}

// ── Handler ─────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ retailer: string }> }
) {
  const { retailer: retailerKey } = await params
  const retailer = RETAILERS[retailerKey.toLowerCase()]

  if (!retailer) {
    return new NextResponse(`Unknown retailer: ${retailerKey}`, { status: 404 })
  }

  const url     = new URL(request.url)
  const rawDest = url.searchParams.get('url')
  const ref     = url.searchParams.get('ref') ?? 'unknown'

  if (!rawDest) {
    return new NextResponse('Missing ?url=', { status: 400 })
  }

  let dest: URL
  try {
    dest = new URL(rawDest)
  } catch {
    return new NextResponse('Invalid ?url=', { status: 400 })
  }

  const hostOk = retailer.hosts.some(h => dest.hostname === h)
  if (!hostOk) {
    return new NextResponse(
      `Destination host "${dest.hostname}" not in allowlist for ${retailerKey}`,
      { status: 400 }
    )
  }

  const finalUrl = buildAffiliateUrl(retailer, dest)

  console.log(JSON.stringify({
    type: 'go_click',
    retailer: retailerKey.toLowerCase(),
    ref,
    has_affiliate: retailer.affiliate !== null,
    dest_host: dest.hostname,
    ua: request.headers.get('user-agent')?.slice(0, 120) ?? null,
    ts: Date.now(),
  }))

  return NextResponse.redirect(finalUrl, 302)
}
