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
      ['/dc/dc-multiverse', '/dc/multiverse'],
      ['/wrestling/legends', '/wrestling/elite-legends'],
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
    return legacyLines.map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }))
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
              "frame-src https://clerk.figurepinner.com https://*.effectivecpmnetwork.com",
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
