import type { NextConfig } from 'next'
import { execSync } from 'node:child_process'

// Build-identity stamp (S52, 2026-07-03): baked into every rendered page as
// <meta name="fp-build"> and served at /api/version. Purpose: ISR cache
// persists ACROSS deploys, so "I'm looking at the live page" does NOT mean
// "I'm looking at the new build" — comparing the page's fp-build sha against
// /api/version (always-fresh) makes staleness checkable instead of guessable.
function gitSha(): string {
  try {
    const dirty = execSync('git status --porcelain', { encoding: 'utf8' }).trim() ? '-dirty' : ''
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim() + dirty
  } catch {
    return 'unknown'
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // WO-2 correction (2026-07-17): adding a real eslint.config.mjs (to make
  // `npm run lint` a real command instead of the interactive setup prompt)
  // had an undiscovered side effect -- Next.js's OWN build-time lint step
  // silently no-op'd with no config present pre-WO-2, and now runs for real,
  // hard-failing `next build` (and therefore `next-on-pages`/`@opennextjs/
  // cloudflare build`, i.e. the actual deploy pipeline) on the 222
  // pre-existing lint errors. That directly contradicts Steve's explicit
  // WO-2 ruling ("lint stays a standalone command, zero deploy-pipeline
  // impact, guard wiring deferred post-7/31") -- caught only because a full
  // `npm run build:cf` was run for an unrelated fix. Restores the
  // pre-WO-2 build behavior; `npm run lint` itself is unaffected and still
  // a real, working command.
  eslint: {
    ignoreDuringBuilds: true,
  },

  env: {
    FP_BUILD_SHA: gitSha(),
    FP_BUILD_TIME: new Date().toISOString(),
  },

  // Bounds worst-case ISR staleness: Next's default emits
  // stale-while-revalidate=ONE_YEAR on ISR routes; with the KV incremental
  // cache live (S20), persistently-failing background revalidation could
  // otherwise serve year-stale HTML. 86400 caps it at one day.
  expireTime: 86400,

  // Required for @cloudflare/next-on-pages edge runtime on Cloudflare Pages
  // next-on-pages transforms the Next.js build output for the Workers runtime
  // Setting experimental.runtime globally so we don't need per-route declarations,
  // but individual routes still export runtime = 'edge' for clarity.
  // NOTE: 'use client' components must NOT export runtime — they inherit from layout.

  // Disable Next.js image optimization — Cloudflare Pages doesn't support it.
  // Use raw <img> tags or a Cloudflare Images transform URL instead.
  images: {
    // Cloudflare Pages doesn't support Next.js image optimization.
    // Using raw <img> tags with onError fallback throughout the app.
    unoptimized: true,
    // Figure images come from canonical_image_url in the KB — primarily:
    //   - Shopify CDN (WFD wrestling photos): cdn.shopify.com only
    //   - ActionFigure411 CDN (fandom photos): actionfigure411.com only
    // R2 proxy serves pattern dictionary only, not images. Keep this list
    // explicit; broad wildcards turn KB image data into an origin allowlist.
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'actionfigure411.com' },
      { protocol: 'https', hostname: '*.actionfigure411.com' },
    ],
  },

  // Legacy line-hub slugs (S20, 2026-06-11): GenreTaxonomy shipped wrong
  // hardcoded line slugs for months, so these URLs are what got indexed and
  // shared. Config-level redirects emit true 308s from the routing layer;
  // the [genre]/[line] page also has a KB-driven alias resolver as catch-all
  // for variants not listed here (that path degrades to a meta-refresh on
  // ISR routes, which is why the known set lives here instead).
  async redirects() {
    const legacyLines: Array<[string, string]> = [
      // ⚠️ Every entry here must be a slug that does NOT exist in the KB.
      // A redirect whose SOURCE is a real product_line silently buries that
      // line's hub and tells Google two distinct lines are the same page.
      // tests/legacyLineRedirects.test.mjs fails the build if one slips in.
      //
      // Removed 2026-07-27: ['/wrestling/legends', '/wrestling/elite-legends'].
      // It was not a legacy typo. `legends` is Jakks Pacific's WWE Legends line
      // (3 figures — Andre the Giant, Classy Freddie Blassie, Jimmy Snuka,
      // Series 1); `elite-legends` is Mattel's, 181 figures. Different
      // manufacturers, different lines. The redirect made a real hub
      // unreachable while the sitemap kept submitting it, so Google was handed
      // a 308 into another company's product line — found by the 2026-07-27
      // sitemap census and mis-attributed to the pretty→ugly 308 class for a day.
      ['/dc/dc-multiverse', '/dc/multiverse'],
      ['/wrestling/retro', '/wrestling/wwe-retro'],
      ['/wrestling/hasbro-wwf', '/wrestling/wwf-hasbro'],
      ['/transformers/g1-transformers', '/transformers/g1'],
      ['/masters-of-the-universe/masters-of-the-universe-classics', '/masters-of-the-universe/classics'],
      ['/masters-of-the-universe/original-motu', '/masters-of-the-universe/original'],
      ['/teenage-mutant-ninja-turtles/neca-tmnt', '/teenage-mutant-ninja-turtles/neca'],
      ['/teenage-mutant-ninja-turtles/playmates-tmnt', '/teenage-mutant-ninja-turtles/playmates'],
      ['/teenage-mutant-ninja-turtles/super7-tmnt', '/teenage-mutant-ninja-turtles/super7'],
      ['/power-rangers/lightning-collection', '/power-rangers/lightning'],
      ['/indiana-jones/adventure-series', '/indiana-jones/hasbro-adventure-series'],
      ['/thundercats/super7-thundercats', '/thundercats/super7'],
      ['/thundercats/ljn-thundercats', '/thundercats/ljn'],
      ['/action-force/palitoy-action-force', '/action-force/action-force'],
      ['/action-force/valaverse', '/action-force/valaverse-action-force'],
    ]
    const legacyLineRedirects = legacyLines.map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }))

    // Dead /checklists/* section (2026-07-12 root-cause FIX-3): the section
    // was removed long ago but Google still ranks it — it earned 2 of the
    // site's 11 Google clicks in the 28d to 7/10 and every one of them hit a
    // 404. Route the residual equity to the nearest live equivalent instead.
    // Deepest rule first — Next applies the first matching redirect.
    const checklistRedirects = [
      { source: '/checklists/:genre/:line/:rest*', destination: '/:genre/:line', permanent: true },
      { source: '/checklists/:genre/:line', destination: '/:genre/:line', permanent: true },
      { source: '/checklists/:genre', destination: '/:genre', permanent: true },
      { source: '/checklists', destination: '/guides', permanent: true },
    ]

    // Guide-slug rename (webaudit A1, 2026-08-02): Bing already ranks and sends
    // clicks to the old slug, which 404s live — same intent, so redirect rather
    // than orphan the earned ranking. See articles.ts id-15 comment + the linked
    // relay note there for the full evidence chain.
    const guideRenameRedirects = [
      { source: '/guides/condition-grading-for-collectors', destination: '/guides/how-action-figure-conditions-are-graded', permanent: true },
    ]

    return [...legacyLineRedirects, ...checklistRedirects, ...guideRenameRedirects]
  },

  // /sitemap.xml → the sitemapindex route handler (S55, 2026-07-03). The
  // bare URL 404'd after the D3 per-fandom split (Next emits only
  // /sitemap/[id].xml children, no index). beforeFiles is load-bearing: the
  // app/sitemap.ts metadata route claims /sitemap.xml in dev (serving an
  // empty <urlset>), so the rewrite must run before filesystem routing to
  // win in both dev and prod. Rewrite, not redirect — crawlers keep the
  // canonical well-known URL.
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/sitemap.xml', destination: '/sitemap-index.xml' },
      ],
      afterFiles: [],
      fallback: [],
    }
  },

  // Security + deep-link headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          // Report-Only: never enforced yet. Staged rollout per
          // WEB-SECURITY-NEXT-CHAT-PLAN-2026-07-02 Batch E — ship Report-Only,
          // add a report collector, monitor 1-2 weeks with zero unexpected
          // violations, only then consider enforcing.
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.highperformanceformat.com https://*.effectivecpmnetwork.com https://static.cloudflareinsights.com https://clerk.figurepinner.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://cdn.shopify.com https://bubs960collectibles.myshopify.com https://actionfigure411.com https://*.actionfigure411.com https://img.clerk.com https://pagead2.googlesyndication.com",
              "font-src 'self' data:",
              "connect-src 'self' https://figurepinner-api.bubs960.workers.dev https://clerk.figurepinner.com https://static.cloudflareinsights.com https://cloudflareinsights.com",
              "frame-src 'self' https://clerk.figurepinner.com https://*.effectivecpmnetwork.com https://www.highperformanceformat.com",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
      // Apple App Site Association — must be served as application/json with no redirect
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
      // Android assetlinks — same requirements
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ]
  },
}

export default nextConfig
