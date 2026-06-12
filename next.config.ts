import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,

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
    //   - Shopify CDN (WFD wrestling photos): cdn.shopify.com
    //   - ActionFigure411 CDN (fandom photos): various hostnames
    // R2 proxy serves pattern dictionary only, not images.
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: '*.shopify.com' },
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
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
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
