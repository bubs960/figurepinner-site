import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type PrefixAudit = {
  prefix: string
  count: number
  truncated: boolean
  samples: string[]
}

const PREFIXES = ['isr-cache', 'pro:', '']
const PAGE_LIMIT = 1000
const MAX_KEYS_PER_PREFIX = 5000

function isAllowedAdmin(userId: string | null) {
  if (!userId) return false
  const allowList = (process.env.FP_ADMIN_USER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return allowList.length > 0 && allowList.includes(userId)
}

async function auditPrefix(kv: any, prefix: string): Promise<PrefixAudit> {
  let cursor: string | undefined
  let count = 0
  const samples: string[] = []

  do {
    const page = await kv.list({ prefix, limit: PAGE_LIMIT, cursor })
    const keys = Array.isArray(page?.keys) ? page.keys : []
    count += keys.length
    for (const key of keys) {
      if (samples.length >= 20) break
      samples.push(String(key?.name ?? ''))
    }
    cursor = page?.list_complete ? undefined : page?.cursor
    if (count >= MAX_KEYS_PER_PREFIX) break
  } while (cursor)

  return {
    prefix: prefix || '(all)',
    count,
    truncated: Boolean(cursor),
    samples,
  }
}

export async function GET() {
  const { userId } = await auth()
  if (!isAllowedAdmin(userId)) {
    return NextResponse.json({ error: userId ? 'Forbidden' : 'Unauthorized' }, { status: userId ? 403 : 401 })
  }

  try {
    const { env } = await getCloudflareContext()
    const kv = (env as any).PRO_KV
    if (!kv) {
      return NextResponse.json({ error: 'PRO_KV binding not found' }, { status: 503 })
    }

    const prefixes = []
    for (const prefix of PREFIXES) {
      prefixes.push(await auditPrefix(kv, prefix))
    }

    return NextResponse.json(
      {
        ok: true,
        ts: new Date().toISOString(),
        namespace: 'PRO_KV / NEXT_INC_CACHE_KV shared namespace',
        note: 'Counts keys only. Cloudflare KV list does not expose value byte size here; use billing for storage GB-months.',
        prefixes,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (e) {
    return NextResponse.json({ error: 'kv_audit_failed', detail: String(e) }, { status: 500 })
  }
}
