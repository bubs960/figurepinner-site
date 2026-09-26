import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'

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

// Minimal structural type for the KV binding's list() call — same pattern as
// proStatus.ts's KVLike, which avoids depending on the global KVNamespace
// type (unreliable across this build; see that file's comment for why).
interface KVListable {
  list(opts: { prefix: string; limit: number; cursor?: string }): Promise<{
    keys: { name?: string }[]
    list_complete?: boolean
    cursor?: string
  }>
}

async function auditPrefix(kv: KVListable, prefix: string): Promise<PrefixAudit> {
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
  const denied = requireAdmin({ kind: 'allowlist', userId, emptyAllowlist: 'forbidden' })
  if (denied) return NextResponse.json(denied.body, { status: denied.status, headers: denied.headers })

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
