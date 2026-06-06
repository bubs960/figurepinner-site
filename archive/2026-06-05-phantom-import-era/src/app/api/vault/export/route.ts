import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextResponse } from 'next/server'
import { isUserPro } from '@/lib/proStatus'

async function getDB() {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

/**
 * GET /api/vault/export
 * Returns vault items as a CSV file for Pro users.
 * Free users get a 402 redirect to /pro.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pro = await isUserPro()
  if (!pro) {
    return NextResponse.json(
      {
        error: 'pro_required',
        message: 'CSV export is a Pro feature. Upgrade to Pro to export your collection.',
        upgrade_url: '/pro',
      },
      { status: 402 },
    )
  }

  const db = await getDB()
  const { results } = await db
    .prepare("SELECT * FROM vault_items WHERE user_id = ? AND status = 'active' ORDER BY added_at DESC")
    .bind(userId)
    .all()

  // Build CSV
  const headers = ['Name', 'Brand', 'Line', 'Genre', 'Condition', 'Paid', 'Added']
  const rows = results.map(item => {
    const r = item as {
      name: string
      brand: string | null
      line: string | null
      genre: string | null
      condition: string
      paid: number | null
      added_at: string
    }
    return [
      csvEscape(r.name),
      csvEscape(r.brand ?? ''),
      csvEscape(r.line ?? ''),
      csvEscape(r.genre ?? ''),
      csvEscape(r.condition ?? ''),
      String(r.paid ?? 0),
      csvEscape(r.added_at ? r.added_at.split('T')[0] : ''),
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  const filename = `figurepinner-collection-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

function csvEscape(value: string): string {
  // Wrap in quotes if value contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
