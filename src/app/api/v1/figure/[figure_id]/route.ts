import { NextRequest, NextResponse } from 'next/server'
import { getFigureById, deriveName } from '@/data/kb'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ figure_id: string }> }
) {
  const { figure_id } = await params
  const f = getFigureById(figure_id)

  if (!f) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
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
  })
}
