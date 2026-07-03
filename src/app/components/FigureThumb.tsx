'use client'
/**
 * FigureThumb — shared card/grid thumbnail with loading skeleton + fallback.
 *
 * Why this exists (W1, ship-blocker #1 from the 50-persona visitor review):
 * figure photos stream in lazily from the Shopify CDN. Until each image paints,
 * the old markup showed an empty dark box that — on a slow connection — reads as
 * a *broken* image. That blank state was the single most-cited bounce cause and
 * the affiliate-revenue killer (newcomers navigate by photo).
 *
 * This component guarantees a card never looks broken:
 *   - shows a shimmer skeleton while the image is loading,
 *   - cross-fades the photo in on load,
 *   - falls back to a branded placeholder if the image
 *     errors or is missing entirely.
 *
 * It is a client component (needs load/error state), but can be imported into
 * server components — used on search, genre accordion, and line grid pages.
 */

import { useState, useCallback } from 'react'
import { thumb } from '@/lib/imageUrl'

type Fallback =
  | { kind: 'monogram'; name: string; accent: string }
  | { kind: 'icon'; accent: string }

export default function FigureThumb({
  image,
  size = 88,
  radius = 14,
  /** width param passed to the Shopify CDN resize; defaults to 2× size for retina */
  cdnWidth,
  fallback,
  alt = '',
  /** loading="eager" for above-the-fold thumbs (S54: first ~6 search cards)
      so the grid's first impression isn't a wall of gray shimmer. */
  eager = false,
}: {
  image: string | null | undefined
  size?: number
  radius?: number
  cdnWidth?: number
  fallback: Fallback
  alt?: string
  eager?: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const src = thumb(image, cdnWidth ?? Math.min(size * 2, 256))
  const showImage = !!src && !errored

  // Ref callback fixes the onLoad race: when an image is already cached/complete
  // (very common with loading="lazy" + Worker SSR), the native `load` event fires
  // BEFORE React attaches onLoad, so setLoaded(true) never runs and the image is
  // stuck at opacity:0 — the blank-thumbnail ship-blocker (50-persona review #1).
  // Checking img.complete on mount reveals those immediately; onLoad still handles
  // images that stream in afterward.
  const imgRef = useCallback((node: HTMLImageElement | null) => {
    if (node && node.complete && node.naturalWidth > 0) setLoaded(true)
  }, [])

  const box: React.CSSProperties = {
    position: 'relative',
    width: size, height: size, borderRadius: radius, flexShrink: 0,
    background: 'var(--s2)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  }

  if (!showImage) {
    // No image (or it errored) -> branded fallback fills the same box.
    return (
      <div style={fallback.kind === 'monogram' ? { ...box, background: 'transparent', border: 'none' } : box}>
        {fallback.kind === 'monogram'
          ? <Monogram name={fallback.name} accent={fallback.accent} size={size} radius={radius} />
          : <CompactBrandTile accent={fallback.accent} size={size} />}
      </div>
    )
  }

  return (
    <div style={box}>
      {!loaded && (
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(100deg, var(--s2) 30%, var(--s1) 50%, var(--s2) 70%)',
            backgroundSize: '200% 100%',
            animation: 'fp-thumb-shimmer 1.1s ease-in-out infinite',
          }}
        >
          <style>{`@keyframes fp-thumb-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src ?? undefined}
        alt={alt}
        width={size}
        height={size}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        style={{
          width: '100%', height: '100%', objectFit: 'contain',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      />
    </div>
  )
}

/** Branded monogram tile (used on search cards). */
function Monogram({ name, accent, size, radius }: { name: string; accent: string; size: number; radius: number }) {
  const initials = figureMonogram(name)
  return (
    <div
      aria-label={name}
      style={{
        width: size, height: size, borderRadius: radius, flexShrink: 0,
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(150deg, ' + accent + ' 0%, ' + accent + '9e 100%)',
      }}
    >
      <span style={{
        position: 'absolute', top: -size * 0.16, left: -size * 0.16,
        width: size * 0.64, height: size * 0.64,
        borderRadius: '50%', background: '#ffffff', opacity: 0.08,
      }} />
      <span style={{
        fontFamily: 'var(--font-display), system-ui, sans-serif',
        fontSize: Math.max(size * 0.43, 12), fontWeight: 800, color: '#ffffff',
        opacity: 0.96, letterSpacing: '0.01em', lineHeight: 1,
      }}>{initials}</span>
    </div>
  )
}

/** Compact branded tile fallback used on dense accordion / line grids. */
function CompactBrandTile({ accent, size }: { accent: string; size: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: Math.max(Math.round(size * 0.58), 20),
        height: Math.max(Math.round(size * 0.58), 20),
        borderRadius: Math.max(Math.round(size * 0.12), 4),
        background: `${accent}22`,
        color: accent,
        fontFamily: 'var(--font-display), system-ui, sans-serif',
        fontSize: Math.max(size * 0.2, 9),
        fontWeight: 800,
        letterSpacing: 0,
        lineHeight: 1,
      }}
    >
      FP
    </span>
  )
}

/** 1-2 letter monogram from a figure name (first letters of first two words). */
function figureMonogram(name: string): string {
  const words = name.replace(/[^a-zA-Z0-9 ]/g, '').split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
