import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
