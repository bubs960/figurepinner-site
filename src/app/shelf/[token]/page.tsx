import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getShelfShareStats } from '../_lib/shelfShareData'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const stats = await getShelfShareStats(token)
  if (!stats) return { title: 'Shelf not found', robots: { index: false, follow: false } }

  const title = `My Shelf — ${stats.grails} ${stats.grails === 1 ? 'Grail' : 'Grails'}${stats.gaps > 0 ? `, ${stats.gaps} ${stats.gaps === 1 ? 'Gap' : 'Gaps'}` : ''}`
  return {
    title,
    description: 'A collector’s shelf on FigurePinner — real figures, real gaps, real hunt.',
    // Ephemeral personal share artifact, not indexed content (same call as
    // the private vault page itself — this is its public-safe mirror, not
    // a new SEO surface).
    robots: { index: false, follow: false },
    openGraph: { title },
  }
}

export default async function ShelfSharePage({ params }: Props) {
  const { token } = await params
  const stats = await getShelfShareStats(token)
  if (!stats) notFound()

  const { grails, gaps } = stats

  return (
    <div className="shs">
      <style>{CSS}</style>
      <div className="shs-card">
        <span className="shs-pin" aria-hidden />
        <div className="shs-eyebrow">My Shelf</div>
        {grails === 0 ? (
          <div className="shs-empty">Every grail starts as a gap on the shelf.</div>
        ) : (
          <div className="shs-stats">
            <div className="shs-stat">
              <div className="shs-n">{grails}</div>
              <div className="shs-label">{grails === 1 ? 'Grail' : 'Grails'}</div>
            </div>
            {gaps > 0 && (
              <div className="shs-stat">
                <div className="shs-n gold">{gaps}</div>
                <div className="shs-label">{gaps === 1 ? 'Gap — the hunt continues' : 'Gaps — the hunt continues'}</div>
              </div>
            )}
          </div>
        )}
        <a className="shs-cta" href="/sign-up">Start your own shelf &rarr;</a>
      </div>
      <a className="shs-home" href="/">FigurePinner &mdash; the collector&apos;s price guide</a>
    </div>
  )
}

const CSS = `
  .shs {
    min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 28px; padding: 40px 20px;
    background:
      radial-gradient(900px 500px at 50% -12%, rgba(224,168,62,.10), transparent 62%),
      #09090f;
    color: #EEEEF5;
    font-family: var(--font-body, var(--fp-font-body, system-ui));
  }
  .shs-card {
    position: relative; display: flex; flex-direction: column; align-items: center; gap: 18px;
    width: min(560px, 92vw); padding: 48px 32px 36px;
    border-radius: 24px; border: 2px solid rgba(212,175,55,.35);
    background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.012) 60%, transparent);
    box-shadow: 0 26px 70px rgba(0,0,0,.42);
    text-align: center;
  }
  .shs-pin {
    width: 40px; height: 40px; border-radius: 20px;
    background: linear-gradient(180deg, #fff0d0, #D4AF37);
    box-shadow: 0 0 16px rgba(212,175,55,.5);
  }
  .shs-eyebrow {
    font-size: 13px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: #D4AF37;
  }
  .shs-empty { font-family: var(--fp-font-display); font-size: 22px; font-weight: 400; color: #EEEEF5; max-width: 34ch; }
  .shs-stats { display: flex; align-items: center; gap: 40px; }
  .shs-stat { display: flex; flex-direction: column; align-items: center; }
  .shs-n { font-family: var(--fp-font-display); font-size: 64px; font-weight: 400; color: #EEEEF5; line-height: 1; font-variant-numeric: tabular-nums; }
  .shs-n.gold { color: #f5c462; }
  .shs-label { margin-top: 8px; font-size: 12px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; color: rgba(242,232,213,.5); }
  .shs-cta {
    margin-top: 10px; padding: 12px 26px; border-radius: 999px; text-decoration: none;
    font-size: 14px; font-weight: 600; color: #1a1206;
    background: linear-gradient(180deg, #f5c462, #e0a83e);
  }
  .shs-home { font-size: 13px; color: rgba(242,232,213,.5); text-decoration: none; }
  .shs-home:hover { color: #f5c462; }
`
