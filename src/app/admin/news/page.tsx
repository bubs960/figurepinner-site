import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import NewsForm from './_components/NewsForm'

/**
 * /admin/news — minimal authoring UI.
 *
 * Server-side guard: Clerk auth required (handled by middleware), AND
 * userId must appear in FP_ADMIN_USER_IDS. Anyone else gets a 403 page.
 *
 * Form lives in a client component (NewsForm). Recent events are server-
 * fetched and rendered alongside so we can see the last 10 we posted.
 */

export const metadata = {
  title: 'News Admin — FigurePinner',
  robots: { index: false, follow: false },
}

interface RecentEvent {
  id: string
  title: string
  genre: string | null
  pinned: number
  published_at: string
}

async function fetchRecent(): Promise<RecentEvent[]> {
  try {
    const { env } = await getCloudflareContext()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (env as any).DB as D1Database | undefined
    if (!db) return []
    const { results } = await db
      .prepare(`
        SELECT id, title, genre, pinned, published_at
        FROM news_events
        ORDER BY published_at DESC
        LIMIT 10
      `)
      .all()
    return results as unknown as RecentEvent[]
  } catch {
    return []
  }
}

export default async function AdminNewsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=/admin/news')

  const allowList = (process.env.FP_ADMIN_USER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (allowList.length === 0) {
    return (
      <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '1rem' }}>
            Admin Endpoint Not Configured
          </h1>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            Set the <code style={{ background: 'var(--s2)', padding: '2px 6px', borderRadius: 4 }}>FP_ADMIN_USER_IDS</code> secret on the worker
            (comma-separated list of Clerk user IDs allowed to post news).
          </p>
          <pre style={{ background: 'var(--s1)', padding: '1rem', borderRadius: 8, marginTop: '1rem', fontSize: '0.85rem', overflow: 'auto' }}>
{`npx wrangler secret put FP_ADMIN_USER_IDS --name figurepinner-site
# paste: user_2abc...`}
          </pre>
        </div>
      </main>
    )
  }

  if (!allowList.includes(userId)) {
    return (
      <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '1rem' }}>403 — Forbidden</h1>
          <p style={{ color: 'var(--muted)' }}>
            Your account ({userId.slice(0, 16)}…) isn&apos;t in the admin allowlist.
          </p>
        </div>
      </main>
    )
  }

  const recent = await fetchRecent()

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{
          display: 'inline-block', fontSize: '0.7rem', fontWeight: 800,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--orange)',
          marginBottom: 12,
        }}>
          Admin · News
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '2.25rem',
          letterSpacing: '0.03em', lineHeight: 1.05, marginBottom: '0.5rem',
        }}>
          Post News Event
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          Posts immediately to <a href="/news" style={{ color: 'var(--blue)', textDecoration: 'none' }}>/news</a>.
          Set published_at to a future ISO timestamp to schedule.
        </p>

        <NewsForm />

        {recent.length > 0 && (
          <section style={{ marginTop: '3rem' }}>
            <h2 style={{
              fontSize: '0.8rem', fontWeight: 800, color: 'var(--muted)',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem',
            }}>
              Last 10 Posted
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recent.map((e) => (
                <li key={e.id} style={{
                  background: 'var(--s1)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '0.875rem 1rem',
                  display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem',
                }}>
                  {e.pinned === 1 && (
                    <span style={{ fontSize: '0.65rem', color: '#FFB800' }} title="Pinned">📌</span>
                  )}
                  <span style={{ flex: 1, color: 'var(--text)', fontWeight: 600 }}>{e.title}</span>
                  {e.genre && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {e.genre}
                    </span>
                  )}
                  <time style={{ fontSize: '0.7rem', color: 'var(--dim)' }}>
                    {new Date(e.published_at.replace(' ', 'T') + 'Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </time>
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>
    </main>
  )
}
