import { NextRequest, NextResponse } from 'next/server'
import { getAllFigures, deriveName } from '@/data/kb'

/**
 * Search proxy — always uses local KB scan so results always include
 * figure_id (for detail page links) and canonical_image_url.
 *
 * Falls back gracefully: if KB import fails for any reason, returns empty.
 *
 * Note: the API worker's public search omits figure_id and image intentionally
 * ("iceberg" strategy), so we search locally and get complete results.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '8'), 20)

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
        figure_id: f.figure_id,
        name: deriveName(f),
        brand: f.manufacturer.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        line: f.product_line.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        series: f.release_wave,
        genre: f.fandom,
        year: null,
        image: f.canonical_image_url ?? null,
      }))

    return NextResponse.json({ figures: results })
  } catch {
    return NextResponse.json({ figures: [] })
  }
}

