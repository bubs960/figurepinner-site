import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'deals_disabled' },
    {
      status: 410,
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    },
  )
}
