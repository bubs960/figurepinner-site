import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

const ALLOWED_EVENTS = new Set([
  'landing',
  'search_submit',
  'search_result_click',
  'figure_view',
  'ebay_exit',
])

function clean(value: unknown, max = 160): string {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

function routeBucket(path: string): string {
  if (!path || path === '/') return 'home'
  if (path.startsWith('/figure/')) return 'figure'
  if (path.startsWith('/search')) return 'search'
  const part = path.split('/').filter(Boolean)[0]
  return part || 'home'
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> | null = null
  try {
    body = await request.json()
  } catch {
    return new Response(null, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const event = clean(body?.event, 40)
  if (!ALLOWED_EVENTS.has(event)) {
    return new Response(null, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const path = clean(body?.path, 180)
  const source = clean(body?.source, 80)
  const figureId = clean(body?.figureId, 120)
  const query = clean(body?.query, 100)
  const referrer = clean(body?.referrer, 120)
  const sessionId = clean(body?.sessionId, 80)
  const target = clean(body?.target, 80)

  try {
    const { env } = await getCloudflareContext()
    const analytics = (env as { FUNNEL_ANALYTICS?: AnalyticsEngineDataset }).FUNNEL_ANALYTICS
    analytics?.writeDataPoint({
      blobs: [
        event,
        source || 'unknown',
        routeBucket(path),
        path,
        figureId,
        query,
        referrer,
        target,
      ],
      doubles: [1],
      indexes: [event],
    })
  } catch {
    // Tracking must never affect the user path.
  }

  // sessionId is accepted to keep client sessions stable for future sampling,
  // but not written to Analytics Engine so the dataset stays anonymous.
  void sessionId

  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
