import { NextRequest, NextResponse } from 'next/server'
import { getAllFigures, deriveName } from '@/data/kb'

/**
 * GET /api/v1/search?q=<query>&limit=<n>
 *
 * Searches local KB (figures-reference-v2.js) and returns ranked results.
 * Returns figure_id, image (canonical_image_url), and slug fields so the
 * client can build deep links and show thumbnails without a second request.
 *
 * Falls back to empty array if KB import fails — never throws.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '8'), 60)

  if (q.length < 2) {
    return NextResponse.json({ figures: [] })
  }

  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)

  try {
    const all = getAllFigures()

    const results = all
      .map(f => {
        const char = f.character_canonical.toLowerCase()
        const name = deriveName(f).toLowerCase()
        const line = f.product_line.toLowerCase().replace(/-/g, ' ')
        const brand = f.manufacturer.toLowerCase()
        const variant = (f.character_variant ?? '').toLowerCase()

        let score = 0
        for (const token of tokens) {
          if (char.startsWith(token)) score += 5
          else if (char.includes(token)) score += 3
          else if (name.includes(token)) score += 2
          else if (variant.includes(token)) score += 1.5
          else if (line.includes(token)) score += 1
          else if (brand.includes(token)) score += 0.5
          else return null // token matched nothing — exclude
        }
        return { f, score }
      })
      .filter((x): x is { f: ReturnType<typeof getAllFigures>[number]; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ f }) => ({
        figure_id:          f.figure_id,
        name:               deriveName(f),
        brand:              f.manufacturer.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        line:               f.product_line.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        series:             f.release_wave,
        genre:              f.fandom,
        year:               null,
        image:              f.canonical_image_url ?? null,
        // Raw slugs — used by the client to build keyword-rich pretty URLs
        fandom_slug:        f.fandom,
        line_slug:          f.product_line,
        character_slug:     f.character_canonical,
      }))

    return NextResponse.json({ figures: results })
  } catch {
    return NextResponse.json({ figures: [] })
  }
}

