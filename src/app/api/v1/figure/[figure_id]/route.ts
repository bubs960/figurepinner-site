import { NextRequest, NextResponse } from 'next/server'
import { getFigureById, deriveName } from '@/data/kbDb'

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
  'x-fp-kb-source': 'd1',
}

const NOT_FOUND_HEADERS = {
  'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
  'x-fp-kb-source': 'd1',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ figure_id: string }> }
) {
  const { figure_id } = await params
  const f = await getFigureById(figure_id)

  if (!f) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NOT_FOUND_HEADERS })
  }

  const titleCase = (s: string) =>
    s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return NextResponse.json({
    figure_id: f.figure_id,
    name: deriveName(f),
    brand: titleCase(f.manufacturer),
    line: titleCase(f.product_line),
    series: f.release_wave,
    genre: f.fandom,
    year: null,
    canonical_image_url: f.canonical_image_url ?? null,
    exclusive_to: f.exclusive_to ?? null,
    pack_size: f.pack_size,
    scale: f.scale ?? null,
  }, { headers: CACHE_HEADERS })
}
