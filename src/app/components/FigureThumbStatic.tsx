/**
 * FigureThumbStatic — the server-only twin of FigureThumb for DENSE grids
 * (line hubs, character hubs: hundreds to 1,500+ cards per page).
 *
 * Why a second component (2026-09-02, /marvel/marvel-legends Error 1102):
 * FigureThumb is a client component that carries load/error state per thumb.
 * On a 1,559-card hub that meant 1,559 client boundaries, 1,559 inline
 * `<style>` keyframe tags, ~6 inline style objects per card duplicated into
 * the RSC flight, and a hydration pass over every one of them. The render of
 * the largest hub grew past the Worker's 128 MB and every cold render of the
 * page became a Cloudflare 1102. Same visual contract as FigureThumb (W1:
 * shimmer while loading, cross-fade in, branded "FP" tile on error/missing),
 * but expressed as CSS classes on server markup:
 *
 *   .fp-thumb            the box (40×40, radius 4 by default — the grid size)
 *   .fp-thumb--img       an <img> is present; the FP tile is hidden until error
 *   .fp-thumb::before    the shimmer skeleton, hidden once .is-loaded/.is-error
 *   .fp-thumb__img       opacity 1 by default (no-JS safe), fades in via class
 *   .fp-thumb__fallback  the "FP" tile (accent colour comes from the page's
 *                        own <style> block: `.fp-thumb__fallback { … }`)
 *
 * One ThumbLoadDelegate per page (client, renders nothing) listens for
 * capture-phase load/error events on `img.fp-thumb__img` and flips
 * `.is-loaded` / `.is-error` on the box — the same complete/naturalWidth
 * check FigureThumb does per instance, done once for the whole grid.
 * Rules live in globals.css under "fp-thumb".
 */

import { thumb } from '@/lib/imageUrl'

const DEFAULT_SIZE = 40
const DEFAULT_RADIUS = 4

export default function FigureThumbStatic({
  image,
  size = DEFAULT_SIZE,
  radius = DEFAULT_RADIUS,
  cdnWidth,
  alt = '',
}: {
  image: string | null | undefined
  size?: number
  radius?: number
  cdnWidth?: number
  alt?: string
}) {
  const src = thumb(image, cdnWidth ?? Math.min(size * 2, 256))
  // Only a non-default size pays for an inline style; the grid size is pure CSS.
  const sizing =
    size === DEFAULT_SIZE && radius === DEFAULT_RADIUS
      ? undefined
      : { width: size, height: size, borderRadius: radius }

  return (
    <span className={src ? 'fp-thumb fp-thumb--img' : 'fp-thumb'} style={sizing}>
      <span className="fp-thumb__fallback" aria-hidden>FP</span>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="fp-thumb__img"
          src={src}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
        />
      )}
    </span>
  )
}
