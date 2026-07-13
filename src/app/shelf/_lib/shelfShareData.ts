/**
 * shelfShareData.ts — public-safe lookup for the Claiming Ritual Phase C
 * share page. Deliberately narrow: a share token resolves ONLY to grail/gap
 * COUNTS, never the underlying figure list, prices, or the user_id itself.
 * Anyone with a share link can see "N grails, M gaps" — that's the whole
 * point of sharing it — but nothing else about the account.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare'

async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

export type ShelfShareStats = { grails: number; gaps: number }

/** null = token doesn't exist (unknown/revoked share link) -> caller 404s. */
export async function getShelfShareStats(token: string): Promise<ShelfShareStats | null> {
  const db = await getDB()

  const share = await db
    .prepare('SELECT user_id FROM shelf_shares WHERE token = ?')
    .bind(token)
    .first<{ user_id: string }>()
  if (!share) return null

  const [v, w] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS c FROM vault_items WHERE user_id = ? AND status = 'active'")
      .bind(share.user_id).first<{ c: number }>(),
    db.prepare("SELECT COUNT(*) AS c FROM wantlist_items WHERE user_id = ? AND status = 'active'")
      .bind(share.user_id).first<{ c: number }>(),
  ])

  return { grails: v?.c ?? 0, gaps: w?.c ?? 0 }
}
