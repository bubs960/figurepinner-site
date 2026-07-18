'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

interface NoUpscalePhotoProps {
  id?: string
  src: string
  alt: string
  fetchPriority?: 'high' | 'low' | 'auto'
  style?: CSSProperties
}

/**
 * <img> wrapper that never renders a source photo above its own natural
 * resolution -- Photo P2 (2026-07-17). Shopify/eBay-hosted images are
 * already upscale-safe via thumb()'s own resize logic (both only ever pick
 * an existing, equal-or-larger CDN variant). R2-hosted images have no
 * resize capability yet (~70% of catalog per the 7/17 P3 census, median
 * natural width 300px) -- thumb() passes those URLs through unchanged, and
 * a fluid width:100% frame (HeroBand's hero photo) was browser-upscaling
 * them to fill whatever the CSS box rendered at, causing visible blur.
 *
 * CSS alone can't cap upscale on a percentage-width box without knowing the
 * source's actual pixel size, so this reads it via onLoad and caps maxWidth
 * once known. One-frame flash at uncapped width is possible on the very
 * first paint (onLoad fires after that frame commits, same as any
 * client-only-decision render -- AdSlot.tsx's Pro-check has the identical
 * trade-off for a different reason). Host-agnostic by design: on a source
 * that's already large enough (Shopify/eBay), naturalWidth simply exceeds
 * the container and the cap is a no-op.
 *
 * Live-verified 2026-07-17 that onLoad ALONE is not reliable here: for an
 * SSR'd <img>, the browser can start (and finish) loading the image from
 * the parsed HTML before React hydrates and attaches the onLoad listener --
 * a fast/cached image reliably beat hydration in testing, leaving
 * naturalWidth stuck at null (img.complete was true, but our state never
 * updated, since the event that would have set it already fired into a
 * void). The mount effect below checks `.complete` directly and reads
 * naturalWidth synchronously if the image is already loaded, independent
 * of whether onLoad ever fires for this element.
 */
export default function NoUpscalePhoto({ id, src, alt, fetchPriority, style }: NoUpscalePhotoProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null)

  useEffect(() => {
    if (imgRef.current?.complete) {
      setNaturalWidth(imgRef.current.naturalWidth)
    }
  }, [src])

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      id={id}
      src={src}
      alt={alt}
      fetchPriority={fetchPriority}
      onLoad={e => setNaturalWidth(e.currentTarget.naturalWidth)}
      style={{
        ...style,
        ...(naturalWidth ? { maxWidth: `${naturalWidth}px` } : null),
      }}
    />
  )
}
