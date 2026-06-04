import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// Proxy UPCitemdb free trial — avoids CORS from browser, keeps key server-side.
// Free tier: 100 lookups/day, no API key required.
export async function GET(req: NextRequest) {
  const upc = req.nextUrl.searchParams.get('upc')?.replace(/\D/g, '')
  if (!upc || upc.length < 8) {
    return NextResponse.json({ error: 'Invalid UPC' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000),
      }
    )
    if (!res.ok) return NextResponse.json({ error: 'UPC not found' }, { status: 404 })
    const data = await res.json() as {
      code: string
      total: number
      items?: Array<{ title?: string; brand?: string; description?: string }>
    }
    if (!data.items?.length) return NextResponse.json({ error: 'UPC not found' }, { status: 404 })

    const item = data.items[0]
    return NextResponse.json({
      upc,
      title: item.title ?? null,
      brand: item.brand ?? null,
    }, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    })
  } catch {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 502 })
  }
}
