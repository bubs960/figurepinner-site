/**
 * Shared "Grail Card" element — the ImageResponse primitive both the public
 * per-figure OG image (this session) and the per-user shelf card (Claiming
 * Ritual Phase C, P3 §3, added 2026-07-13) render through. Satori CSS subset
 * only: flexbox, gradients, radius, basic transform — no box-shadow, no
 * backdrop-filter.
 *
 * Collector-first positioning (Steve, 2026-07-09): the figure leads — photo,
 * name, museum-placard framing. Price is a small supporting line, never the
 * headline. ShelfCard below applies the SAME rule to the share card: the
 * headline stat is the grail COUNT, never a dollar total.
 */
import type { KBFigure } from '@/data/kb'
import { deriveName } from '@/data/kb'
import { prettifySlug } from './figureFormatters'
import { thumb } from '@/lib/imageUrl'

export const OG_SIZE = { width: 1200, height: 630 }

const GOLD = '#D4AF37'
const INK = '#09090F'
const PAPER = '#EEEEF5'
const MUTED = '#9AA0B4'

export type GrailCardStatus = 'hunting' | 'in_vault' | 'spotlight'

export type GrailCardPrice = {
  medianLabel: string | null
  soldCount: number
}

// Live-KB measured (2026-07-09 webaudit P2S2): p50 46 chars, 26.2% >60,
// 6.7% (1,516 figures) >80, max 164. Step size down before the line-clamp
// backstop has to do the heavy lifting.
function nameFontSize(name: string): number {
  const len = name.length
  if (len <= 28) return 54
  if (len <= 46) return 42
  if (len <= 70) return 32
  return 24
}

// eBay's dead/purged thumb signature: HTTP 200 + image/jpeg + exactly 1,359
// bytes (documented in project_photo_cleaning memory). Treat as no-photo.
const EBAY_PLACEHOLDER_BYTES = 1359
// Cap sized to the render box, not to "huge": the card draws the photo into a
// 400x400 box, so a legit rendition is tens-of-KB. The old 5MB cap let full-res
// originals from hosts thumb() can't resize (e.g. spawnworld.com) through, and
// a ~4MB JPEG decodes to far more than the Workers isolate's memory limit as
// raw RGBA inside satori/resvg — 28 "Worker exceeded memory" errors on
// 2026-08-20 (webaudit relay WEBAUDIT-TO-WEB-OG-IMAGE-MEMORY-RECURRENCE).
// Over-cap photos fail soft to the wordmark fallback. Cap set at 1MB: a
// verified member of the failing class (wwf-hasbro bushwhackers-butch
// frame_1.jpg, served full-res by our own R2 images worker — the largest
// non-resizable host, not a third party) measures 1,524,018 bytes, so the
// known-OOM class must clear the cap with margin, not squeak past it.
const MAX_PHOTO_BYTES = 1_000_000

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

// satori/resvg (next/og's renderer) can only decode JPEG/PNG. Found live
// 2026-07-30: some `canonical.jpg` assets in the photo pipeline are actually
// WebP bytes served with `Content-Type: image/jpeg` (a real upstream
// mislabeling, not a client bug) — e.g. the aew-supreme britt-baker and
// rey-fenix listing photos both start with a `RIFF....WEBP` header despite
// the jpeg content-type. Feeding that through as a `data:image/jpeg;...` URI
// crashed ImageResponse with an out-of-bounds DataView read deep in its PNG
// encoder, 500ing the whole OG image. Sniff real magic bytes instead of
// trusting the header — same fail-soft posture as the eBay-placeholder check
// below, just keyed on what satori can actually decode rather than what the
// server claims.
function sniffImageType(bytes: Uint8Array): 'image/jpeg' | 'image/png' | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  return null
}

/**
 * Fetch + validate a figure photo for card rendering. Bounded latency (satori's
 * own internal <img> fetch has no timeout and never checks response.ok — this
 * replaces that with one controlled fetch), catches eBay's silent placeholder,
 * and returns a data URI so the card never depends on the source host staying
 * up at render time. Returns null on any failure — the card already renders a
 * clean wordmark fallback for a null photo.
 */
export async function resolveCardPhoto(url: string | null | undefined): Promise<string | null> {
  // Card renders the photo into a 400x400 box — fetch a resized rendition
  // (thumb() is a no-op passthrough on hosts it doesn't know how to resize)
  // instead of the raw original. A full-resolution phone photo run through
  // arrayBufferToBase64 + Satori for a 400px box is exactly the kind of
  // oversized decode that spikes memory in a Workers isolate.
  const resized = thumb(url, 800)
  if (!resized) return null
  try {
    const res = await fetch(resized, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) return null
    const contentLength = Number(res.headers.get('content-length') ?? '0')
    if (contentLength > MAX_PHOTO_BYTES) return null
    const buf = await res.arrayBuffer()
    if (buf.byteLength === EBAY_PLACEHOLDER_BYTES) return null
    if (buf.byteLength < 200) return null
    if (buf.byteLength > MAX_PHOTO_BYTES) return null
    const sniffed = sniffImageType(new Uint8Array(buf))
    if (!sniffed) return null
    return `data:${sniffed};base64,${arrayBufferToBase64(buf)}`
  } catch {
    return null
  }
}

type CardFont = { name: string; data: ArrayBuffer; weight: 400 | 700 | 900; style: 'normal' }

let fontsPromise: Promise<CardFont[]> | null = null

async function loadInterWeight(weight: 400 | 700 | 900): Promise<ArrayBuffer> {
  // Standard next/og pattern: Google's CSS2 endpoint serves ttf/otf (not woff2,
  // which satori/@vercel/og's bundled build can't parse) to a request it can't
  // identify as a modern browser. This used to happen with NO User-Agent header
  // at all — broke live 2026-07-30 when Cloudflare Workers' fetch() started
  // attaching a browser-shaped default UA, so Google switched to serving woff2
  // and every OG image on the site 500'd (loadCardFonts' catch below made it
  // fail soft to [], but ImageResponse throws "No fonts are loaded" on an empty
  // array instead of using next/og's bundled default — see withCardFonts).
  // Explicit non-browser UA verified live via curl.exe against fonts.googleapis.com
  // to reliably get `format('truetype')`; a real Chrome UA gets woff2, an old
  // Chrome UA gets woff (still wrong) — only an unrecognized UA gets ttf.
  // Bounded like resolveCardPhoto's fetch — a hung fonts.googleapis.com must
  // not stall the render; the timeout flows into loadCardFonts' own catch.
  const css = await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`, {
    headers: { 'User-Agent': 'FigurePinner-OGCard/1.0 (+https://figurepinner.com)' },
    signal: AbortSignal.timeout(4000),
  }).then(r => r.text())
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)
  if (!match) throw new Error(`Inter ${weight} font URL not found in Google Fonts CSS`)
  const fontRes = await fetch(match[1], { signal: AbortSignal.timeout(4000) })
  if (!fontRes.ok) throw new Error(`Inter ${weight} font fetch failed: ${fontRes.status}`)
  return fontRes.arrayBuffer()
}

/**
 * Loads Inter 400/700/900 for the card's real weight hierarchy (next/og's
 * default otherwise auto-registers exactly ONE weight — every fontWeight in
 * this file renders identical glyphs without this). Fails soft: on any error
 * returns [], and every element's `fontFamily: 'Inter, sans-serif'` falls
 * through to next/og's bundled default — never breaks a render over a font.
 * Memoized per isolate/cold-start, not per-request.
 */
export function loadCardFonts(): Promise<CardFont[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      ([400, 700, 900] as const).map(async weight => ({
        name: 'Inter',
        data: await loadInterWeight(weight),
        weight,
        style: 'normal' as const,
      }))
    ).catch(() => [])
  }
  return fontsPromise
}

/**
 * next/og's ImageResponse only falls back to its bundled default font when the
 * `fonts` option is OMITTED entirely — passing `fonts: []` (loadCardFonts'
 * documented fail-soft result) throws "No fonts are loaded. At least one font
 * is required to calculate the layout." instead, which is exactly what broke
 * every OG image site-wide on 2026-07-30 when the Google Fonts fetch started
 * failing. Use this instead of spreading `{ ...size, fonts }` directly at any
 * ImageResponse call site so a font-load failure degrades to next/og's bundled
 * font (readable, un-branded) rather than a 500.
 */
export function withCardFonts(size: typeof OG_SIZE, fonts: CardFont[]) {
  return fonts.length ? { ...size, fonts } : size
}

const FONT_STACK = 'Inter, sans-serif'

export function GrailCard({
  figure,
  price,
  photoSrc,
  status = 'hunting',
}: {
  figure: KBFigure
  price: GrailCardPrice | null
  photoSrc: string | null
  status?: GrailCardStatus
}) {
  const displayName = deriveName(figure)
  const line = prettifySlug(figure.product_line)
  const fandom = prettifySlug(figure.fandom)
  const ribbonLabel = status === 'in_vault' ? 'IN THE VAULT' : status === 'spotlight' ? "TODAY'S PICK" : 'HUNTING'
  const ribbonColor = status === 'hunting' ? '#7C8399' : GOLD

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: INK,
        fontFamily: FONT_STACK,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* warm glow */}
      <div
        style={{
          position: 'absolute',
          top: -160,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1000,
          height: 640,
          background:
            'radial-gradient(ellipse at center, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0.05) 45%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* placard panel — overflow:hidden is the final backstop for the ~6.7%
          of names that stay too long even after the clamp below */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 56,
          width: 1080,
          height: 540,
          padding: 48,
          borderRadius: 28,
          background: 'rgba(255,255,255,0.03)',
          border: '2px solid rgba(212,175,55,0.35)',
          overflow: 'hidden',
        }}
      >
        {/* photo frame */}
        <div style={{ position: 'relative', display: 'flex', width: 400, height: 400 }}>
          <div
            style={{
              display: 'flex',
              width: 400,
              height: 400,
              borderRadius: 20,
              overflow: 'hidden',
              background: '#15151f',
              border: '3px solid rgba(212,175,55,0.5)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {photoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoSrc}
                width={400}
                height={400}
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div style={{ display: 'flex', color: MUTED, fontSize: 20 }}>FigurePinner</div>
            )}
          </div>

          {/* gold pin, corner */}
          <div
            style={{
              position: 'absolute',
              top: -14,
              right: -14,
              width: 40,
              height: 40,
              borderRadius: 20,
              background: GOLD,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ display: 'flex', width: 14, height: 14, borderRadius: 7, background: '#FFF6D8' }} />
          </div>

          {/* status ribbon */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: -10,
              display: 'flex',
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 8,
              paddingBottom: 8,
              borderRadius: 6,
              background: ribbonColor,
            }}
          >
            <div style={{ display: 'flex', fontSize: 18, fontWeight: 900, color: INK, letterSpacing: '0.12em' }}>
              {ribbonLabel}
            </div>
          </div>
        </div>

        {/* text block */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 14, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 20,
              fontWeight: 700,
              color: GOLD,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {fandom}
          </div>
          <div
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
              overflow: 'hidden',
              fontSize: nameFontSize(displayName),
              fontWeight: 900,
              color: PAPER,
              lineHeight: 1.05,
            }}
          >
            {displayName}
          </div>
          <div style={{ display: 'flex', fontSize: 24, color: MUTED, fontWeight: 700 }}>{line}</div>
          {price && (
            <div style={{ display: 'flex', marginTop: 18, fontSize: 22, color: '#c9d0e0' }}>
              {price.medianLabel
                ? `${price.medianLabel} median${price.soldCount ? ` · ${price.soldCount} sold` : ''}`
                : 'Real eBay sold prices on FigurePinner'}
            </div>
          )}
        </div>
      </div>

      {/* domain bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          letterSpacing: '0.06em',
        }}
      >
        <span style={{ color: PAPER, fontWeight: 900 }}>Figure</span>
        <span style={{ color: GOLD, fontWeight: 900 }}>Pinner</span>
        <span style={{ color: MUTED, marginLeft: 10 }}>· figurepinner.com</span>
      </div>
    </div>
  )
}

/**
 * Per-user "Share My Shelf" card (Phase C). Headline stat is the grail COUNT
 * — never a dollar figure (collector-first positioning; "My Shelf — $340
 * value" would read as the price-tracker framing the whole Ritual exists to
 * avoid). Gaps are shown as a secondary, positive-framed stat ("the hunt
 * continues"), not a shortfall.
 *
 * Guards the empty-shelf state per spec: a token whose owner has since
 * removed every figure (or a stale/edge-case token) still renders something
 * coherent instead of "0 GRAILS" reading as broken.
 */
export function ShelfCard({ grails, gaps }: { grails: number; gaps: number }) {
  const isEmpty = grails <= 0

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: INK,
        fontFamily: FONT_STACK,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* warm glow — same treatment as GrailCard */}
      <div
        style={{
          position: 'absolute',
          top: -160,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1000,
          height: 640,
          background:
            'radial-gradient(ellipse at center, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0.05) 45%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          width: 1080,
          height: 540,
          padding: 48,
          borderRadius: 28,
          background: 'rgba(255,255,255,0.03)',
          border: '2px solid rgba(212,175,55,0.35)',
          overflow: 'hidden',
        }}
      >
        {/* gold pin, top-center — the shelf's own signature mark, not a
            figure photo (there's no single photo to represent a whole shelf) */}
        <div
          style={{
            display: 'flex',
            width: 56,
            height: 56,
            borderRadius: 28,
            background: GOLD,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', width: 20, height: 20, borderRadius: 10, background: '#FFF6D8' }} />
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 22,
            fontWeight: 700,
            color: GOLD,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          My Shelf
        </div>

        {isEmpty ? (
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 900, color: PAPER, textAlign: 'center' }}>
            Every grail starts as a gap on the shelf
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 64 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', fontSize: 96, fontWeight: 900, color: PAPER, lineHeight: 1 }}>
                {grails}
              </div>
              <div style={{ display: 'flex', fontSize: 22, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 8 }}>
                {grails === 1 ? 'Grail' : 'Grails'}
              </div>
            </div>
            {gaps > 0 && (
              <>
                <div style={{ display: 'flex', width: 2, height: 90, background: 'rgba(212,175,55,0.25)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', fontSize: 96, fontWeight: 900, color: GOLD, lineHeight: 1 }}>
                    {gaps}
                  </div>
                  <div style={{ display: 'flex', fontSize: 22, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 8 }}>
                    {gaps === 1 ? 'Gap — the hunt continues' : 'Gaps — the hunt continues'}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* domain bar — same treatment as GrailCard */}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          letterSpacing: '0.06em',
        }}
      >
        <span style={{ color: PAPER, fontWeight: 900 }}>Figure</span>
        <span style={{ color: GOLD, fontWeight: 900 }}>Pinner</span>
        <span style={{ color: MUTED, marginLeft: 10 }}>· figurepinner.com</span>
      </div>
    </div>
  )
}

export function FallbackOGCard() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: INK,
        fontFamily: FONT_STACK,
      }}
    >
      <div style={{ display: 'flex', fontSize: 48, fontWeight: 900, color: PAPER }}>
        <span>Figure</span>
        <span style={{ color: GOLD }}>Pinner</span>
      </div>
    </div>
  )
}
