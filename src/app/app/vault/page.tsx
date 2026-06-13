import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { isUserPro } from '@/lib/proStatus'
import { getVaultShelfData, type HuntItem } from './_lib/vaultData'
import { thumb } from '@/lib/imageUrl'
import ScrollReveal from '@/app/components/ScrollReveal'
import VaultNav from './_components/VaultNav'
import VaultClient from './_components/VaultClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your Vault',
  robots: { index: false, follow: false },
}

const BELL_PATH_1 = 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9'
const BELL_PATH_2 = 'M13.7 21a2 2 0 0 1-3.4 0'

export default async function VaultShelfPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=/app/vault')

  const [{ items, hunt, loadFailed }, pro] = await Promise.all([
    getVaultShelfData(userId),
    isUserPro(),
  ])
  const huntShown = hunt.slice(0, 8)
  const huntMore = hunt.length - huntShown.length

  return (
    <div className="vlt">
      <style>{CSS}</style>
      <VaultNav />
      <ScrollReveal />

      {/* ── MASTHEAD + THE CASE ── */}
      <section className="vlt-hero">
        <div className="wrap">
          {loadFailed ? (
            <>
              <div className="vlt-mast-row">
                <div>
                  <span className="vlt-eyebrow">Your shelf, cataloged</span>
                  <h1>The Vault</h1>
                </div>
              </div>
              <div className="vlt-error">
                Couldn&apos;t load your vault just now &mdash; refresh to try again.
              </div>
            </>
          ) : (
            <VaultClient items={items} />
          )}
        </div>
      </section>

      {/* ── THE HUNT ── */}
      <section className="vlt-hunt fph-seam" id="hunt">
        <div className="wrap" data-fph-reveal>
          <div className="vlt-hunt-head">
            <h2>The Hunt</h2>
            <span className="vlt-hunt-sub">
              {hunt.length > 0
                ? `${hunt.length} on the wantlist — priced from real solds`
                : 'Nothing on the wantlist yet'}
            </span>
          </div>

          {huntShown.length > 0 && (
            <div className="vlt-hunt-row">
              {huntShown.map(h => <HuntCard key={h.rowId} item={h} />)}
            </div>
          )}

          <div className="vlt-hunt-foot">
            {huntMore > 0 && <a href="/app/wantlist">{huntMore} more on the hunt</a>}
            <a href="/search">Add to the hunt &rarr;</a>
            {pro && items.length > 0 && <a href="/api/vault/export" download>Export CSV</a>}
          </div>
        </div>
      </section>

      {/* ── ONE-LINE CLOSER ── */}
      <section className="vlt-refresh fph-seam">
        <div className="wrap">
          <span>Prices refresh from real eBay solds &mdash; your shelf re-values itself.</span>
          <a href="/methodology">How pricing works &rarr;</a>
        </div>
      </section>

      {/* Footer is rendered globally by the root layout. */}
    </div>
  )
}

function HuntCard({ item }: { item: HuntItem }) {
  return (
    <a className="vlt-hunt-card" href={item.href}>
      <span className="h-thumb">
        {item.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb(item.img, 96) ?? item.img} alt={item.name} loading="lazy" />
        ) : (
          <span className="h-noimg" aria-hidden>{item.name.slice(0, 2).toUpperCase()}</span>
        )}
      </span>
      <span className="h-id">
        <span className="h-name">{item.name}</span>
        {item.tag && <span className="h-line">{item.tag}</span>}
      </span>
      {item.targetHit && <span className="vlt-moved">target hit</span>}
      <span className="h-med">
        <span className="k">Median</span>
        <span className="v">{item.median != null ? `$${item.median.toFixed(2)}` : '—'}</span>
        <span className="c">{item.comps > 0 ? `${item.comps} comps` : 'no recent solds'}</span>
      </span>
      <span className="h-bell">
        <span className={`vlt-bell${item.targetHit ? ' live' : ''}`} aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d={BELL_PATH_1} /><path d={BELL_PATH_2} />
          </svg>
        </span>
        <span className="b-lbl">
          {item.targetPrice > 0 ? `under $${item.targetPrice.toFixed(0)}` : 'no target'}
        </span>
      </span>
    </a>
  )
}

// ── CSS (vault-shelf mockup, .vlt- scoped; shares the shelf-v5 vars) ─────────

const CSS = `
  .vlt {
    --vlt-cream: #f2e8d5;
    --vlt-cream-dim: rgba(242,232,213,.60);
    --vlt-cream-mut: rgba(242,232,213,.38);
    --vlt-gold: #e0a83e;
    --vlt-gold-hi: #f5c462;
    --vlt-up: #79c98c;
    --vlt-down: #e08078;
    --vlt-hair: rgba(242,232,213,.10);
    --vlt-line: rgba(242,232,213,.07);
    --vlt-mount: linear-gradient(180deg,#fbf7ee 0%,#efe5d0 100%);
    background: #09090f;
    color: #EEEEF5;
    font-family: var(--font-body, var(--fp-font-body, system-ui));
    min-height: 100vh;
    overflow-x: hidden;
  }
  .vlt ::selection { background: var(--vlt-gold); color: #1a1206; }
  .vlt .wrap { max-width: 1240px; margin: 0 auto; padding: 0 32px; }
  .vlt .fph-seam { position: relative; }
  .vlt .fph-seam::before {
    content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: min(1140px, 94%); height: 1px;
    background: linear-gradient(90deg, transparent, rgba(242,232,213,.13) 28%, rgba(224,168,62,.20) 50%, rgba(242,232,213,.13) 72%, transparent);
  }
  .vlt [data-fph-reveal] { opacity: 0; transform: translateY(18px); transition: opacity .8s cubic-bezier(.22,.61,.36,1), transform .8s cubic-bezier(.22,.61,.36,1); }
  .vlt [data-fph-reveal].in { opacity: 1; transform: none; }

  /* ── nav (signed-in) ── */
  .vlt-nav {
    position: sticky; top: 0; z-index: 50;
    background: rgba(9,9,15,.78);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--vlt-line);
  }
  .vlt-nav-in {
    max-width: 1240px; margin: 0 auto; padding: 0 32px;
    height: 58px; display: flex; align-items: center; gap: 36px;
  }
  .vlt-logo {
    font-family: var(--fp-font-display); font-size: 25px; letter-spacing: .05em;
    text-decoration: none; display: flex; align-items: baseline; gap: 7px; line-height: 1;
    color: #EEEEF5;
  }
  .vlt-pin-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--vlt-gold); align-self: center;
    box-shadow: 0 0 9px rgba(224,168,62,.8);
  }
  .vlt-logo em { font-style: normal; color: var(--vlt-gold); }
  .vlt-nav-links { display: flex; gap: 30px; margin-left: 8px; }
  .vlt-nav-links a {
    font-size: 13px; font-weight: 400; color: var(--vlt-cream-dim);
    text-decoration: none; letter-spacing: .03em;
    transition: color .2s; position: relative;
  }
  .vlt-nav-links a::after {
    content: ''; position: absolute; left: 0; right: 100%; bottom: -6px; height: 1px;
    background: var(--vlt-gold); transition: right .25s cubic-bezier(.22,.61,.36,1);
  }
  .vlt-nav-links a:hover { color: var(--vlt-cream); }
  .vlt-nav-links a:hover::after { right: 0; }
  .vlt-nav-me { margin-left: auto; display: flex; align-items: center; gap: 14px; }
  .vlt-me-label {
    font-size: 13px; font-weight: 500; color: var(--vlt-gold-hi); letter-spacing: .02em;
    position: relative;
  }
  .vlt-me-label::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: -6px; height: 1px;
    background: var(--vlt-gold);
  }

  /* ── masthead ── */
  .vlt-hero {
    position: relative; padding: 28px 0 32px; overflow: hidden;
    background:
      radial-gradient(900px 500px at 72% -12%, rgba(224,168,62,.085), transparent 62%),
      radial-gradient(640px 440px at -8% 80%, rgba(0,102,255,.05), transparent 60%),
      #09090f;
  }
  .vlt-mast-row {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 18px 28px; flex-wrap: wrap;
  }
  .vlt-eyebrow {
    font-size: 11px; font-weight: 500; letter-spacing: .26em; text-transform: uppercase;
    color: var(--vlt-gold); display: inline-flex; align-items: center; gap: 11px;
  }
  .vlt-eyebrow::before { content: ''; width: 30px; height: 1px; background: var(--vlt-gold); opacity: .65; }
  .vlt h1 {
    margin: 8px 0 0; font-family: var(--fp-font-display); font-weight: 400;
    font-size: clamp(44px, 4.6vw, 60px); line-height: .95; letter-spacing: .015em;
    color: #EEEEF5;
  }
  .vlt-stats {
    display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 12px;
    font-size: 13px; font-weight: 300; color: var(--vlt-cream-dim);
    padding-bottom: 6px;
  }
  .vlt-stats .n {
    font-family: var(--fp-font-display); font-weight: 400; font-size: 23px;
    letter-spacing: .03em; color: var(--vlt-cream); line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .vlt-stats .n.gold { font-size: 27px; color: var(--vlt-gold-hi); }
  .vlt-stats .dot { color: rgba(242,232,213,.22); }
  .vlt-error {
    margin: 26px auto 0; max-width: 900px; padding: 22px 26px; text-align: center;
    border: 1px dashed rgba(242,232,213,.18); border-radius: 14px;
    font-size: 14px; font-weight: 300; color: var(--vlt-cream-dim);
  }

  /* ── the case ── */
  .vlt-case-col { margin-top: 22px; }
  .vlt-case {
    --mx: 50%; --my: 30%;
    position: relative; max-width: 900px; margin: 0 auto;
    border-radius: 18px; padding: 34px 26px 16px;
    background:
      radial-gradient(130% 95% at 50% -5%, rgba(224,168,62,.10), transparent 56%),
      linear-gradient(180deg, rgba(242,232,213,.030), rgba(242,232,213,.012) 45%, rgba(0,0,0,.10) 100%);
    border: 1px solid var(--vlt-hair);
    box-shadow: inset 0 1px 0 rgba(255,244,216,.08), inset 0 0 70px rgba(224,168,62,.045), 0 26px 70px rgba(0,0,0,.42);
    overflow: hidden;
  }
  .vlt-case::before {
    content: ''; position: absolute; inset: 0; z-index: 3; pointer-events: none;
    background: radial-gradient(260px circle at var(--mx) var(--my), rgba(255,216,140,.12), transparent 62%);
    opacity: 0; transition: opacity .5s;
  }
  .vlt-case.manual::before { opacity: 1; }
  .vlt-case::after {
    content: ''; position: absolute; top: 0; left: 10%; right: 10%; height: 2px; z-index: 2;
    background: linear-gradient(90deg, transparent, rgba(245,196,98,.75), transparent);
    box-shadow: 0 0 18px 3px rgba(245,196,98,.28); border-radius: 0 0 3px 3px;
  }
  .vlt-case-light {
    position: absolute; left: 50%; top: 38%; width: 1px; height: 1px; z-index: 3;
    pointer-events: none; opacity: 1; transition: opacity .6s;
    animation: vlt-driftX 12s ease-in-out infinite alternate;
  }
  .vlt-case-light i {
    display: block; width: 560px; height: 560px; margin: -280px 0 0 -280px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,216,140,.11), transparent 60%);
    animation: vlt-driftY 6s ease-in-out infinite alternate;
  }
  .vlt-case.manual .vlt-case-light { opacity: 0; }
  @keyframes vlt-driftX { from { transform: translateX(-170px); } to { transform: translateX(170px); } }
  @keyframes vlt-driftY { from { transform: translateY(-110px); } to { transform: translateY(110px); } }
  .vlt-case-sweep { position: absolute; inset: 0; z-index: 4; pointer-events: none; overflow: hidden; border-radius: 18px; }
  .vlt-case-sweep::before {
    content: ''; position: absolute; top: -25%; bottom: -25%; left: 0; width: 32%;
    background: linear-gradient(100deg, transparent, rgba(255,236,194,.05) 32%, rgba(255,236,194,.12) 50%, rgba(255,236,194,.05) 68%, transparent);
    transform: translateX(-130%) skewX(-18deg);
    animation: vlt-sweep 9s linear infinite;
  }
  @keyframes vlt-sweep {
    0% { transform: translateX(-130%) skewX(-18deg); }
    22% { transform: translateX(480%) skewX(-18deg); }
    100% { transform: translateX(480%) skewX(-18deg); }
  }
  .vlt-case-label {
    position: absolute; top: 13px; left: 28px; z-index: 5;
    font-size: 10px; font-weight: 500; letter-spacing: .26em; text-transform: uppercase;
    color: rgba(242,232,213,.55);
  }
  .vlt-shelf { position: relative; padding: 0 6px 13px; margin-bottom: 20px; }
  .vlt-shelf:last-child { margin-bottom: 4px; }
  .vlt-shelf::after {
    content: ''; position: absolute; left: -10px; right: -10px; bottom: 0; height: 3px; border-radius: 2px;
    background: linear-gradient(180deg, rgba(255,236,194,.34), rgba(255,236,194,.06));
    box-shadow: 0 1px 0 rgba(255,244,216,.10), 0 10px 18px rgba(0,0,0,.38), 0 0 10px rgba(255,236,194,.10);
  }
  .vlt-shelf-row { display: flex; gap: 16px; align-items: flex-end; position: relative; z-index: 1; }
  .vlt-shelf-row.short .vlt-fig { flex: 0 0 calc((100% - 48px)/4); }
  .vlt-fig {
    flex: 1 1 0; min-width: 0;
    text-decoration: none; position: relative;
    padding-bottom: 8px; color: inherit;
    animation: vlt-breathe 4.2s ease-in-out infinite alternate;
  }
  @keyframes vlt-breathe { from { transform: translateY(0); } to { transform: translateY(-2px); } }
  .vlt-shelf-row .vlt-fig:nth-child(1) { animation-delay: -.2s; }
  .vlt-shelf-row .vlt-fig:nth-child(2) { animation-delay: -1.4s; animation-duration: 3.8s; }
  .vlt-shelf-row .vlt-fig:nth-child(3) { animation-delay: -2.7s; }
  .vlt-shelf-row .vlt-fig:nth-child(4) { animation-delay: -.8s; animation-duration: 4.6s; }
  .vlt-fig:hover { animation-play-state: paused; }
  .vlt-mount {
    position: relative;
    background: var(--vlt-mount);
    border-radius: 6px 6px 3px 3px;
    padding: 5px 5px 6px;
    box-shadow: 0 10px 18px rgba(0,0,0,.42), 0 2px 4px rgba(0,0,0,.38);
    transition: transform .35s cubic-bezier(.22,.61,.36,1), box-shadow .35s;
  }
  .vlt-mount img, .vlt-noimg {
    width: 100%; aspect-ratio: 4/4.4; object-fit: cover; border-radius: 3px;
    background: #e9e0cd; display: block;
  }
  .vlt-noimg {
    display: flex; align-items: center; justify-content: center;
    font-family: var(--fp-font-display); font-size: 28px; color: #b3a585;
  }
  .vlt-fig:hover .vlt-mount {
    transform: translateY(-8px) rotate(-1.2deg);
    box-shadow: 0 22px 34px rgba(0,0,0,.55), 0 0 0 1px rgba(224,168,62,.5), 0 0 22px rgba(224,168,62,.16);
  }
  .vlt-fig .vlt-mount { box-shadow: 0 10px 18px rgba(0,0,0,.42), 0 0 0 1px rgba(224,168,62,.55), 0 0 18px rgba(224,168,62,.18); }
  .vlt-pin-mark {
    position: absolute; top: -9px; right: -8px; z-index: 5;
    width: 22px; height: 22px; border-radius: 50%;
    background: linear-gradient(180deg, #fff0d0, var(--vlt-gold-hi));
    color: #1a1206; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 3px 8px rgba(0,0,0,.45), 0 0 11px rgba(224,168,62,.6);
  }
  .vlt-pin-mark svg { width: 11px; height: 11px; }
  .vlt-remove {
    position: absolute; top: -9px; left: -8px; z-index: 6;
    width: 22px; height: 22px; border-radius: 50%; border: none; cursor: pointer;
    background: rgba(9,9,15,.85); color: var(--vlt-cream-dim);
    font-size: 11px; line-height: 1; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 3px 8px rgba(0,0,0,.45), 0 0 0 1px rgba(242,232,213,.18);
    opacity: 0; transform: scale(.7);
    transition: opacity .2s, transform .25s cubic-bezier(.34,1.56,.64,1), color .2s;
  }
  .vlt-fig:hover .vlt-remove, .vlt-remove:focus-visible { opacity: 1; transform: scale(1); }
  .vlt-remove:hover { color: var(--vlt-down); }
  .vlt-fig-name {
    margin-top: 9px; font-size: 11.5px; font-weight: 500; color: var(--vlt-cream);
    line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .vlt-fig-tag {
    margin-top: 2px; font-size: 9.5px; font-weight: 400; letter-spacing: .11em; text-transform: uppercase;
    color: var(--vlt-cream-mut); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .vlt-fig-meta { margin-top: 7px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .vlt-cond {
    font-size: 8.5px; font-weight: 500; letter-spacing: .15em; text-transform: uppercase;
    padding: 2.5px 9px; border-radius: 99px; border: 1px solid; line-height: 1.4;
    white-space: nowrap; background: transparent; cursor: pointer;
    font-family: inherit;
  }
  .vlt-cond.moc { border-color: rgba(224,168,62,.55); color: var(--vlt-gold-hi); }
  .vlt-cond.loose { border-color: rgba(242,232,213,.16); color: var(--vlt-cream-mut); }
  .vlt-cond.nm { border-color: rgba(242,232,213,.38); color: var(--vlt-cream); }
  .vlt-delta {
    font-size: 10px; font-weight: 500; letter-spacing: .02em; white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .vlt-delta i { font-style: normal; font-size: 7px; vertical-align: 1.5px; margin-right: 2px; }
  .vlt-delta.up { color: var(--vlt-up); }
  .vlt-delta.dn { color: var(--vlt-down); }
  .vlt-fig-val {
    margin-top: 4px; font-size: 10px; font-weight: 300; color: var(--vlt-cream-dim);
    letter-spacing: .01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    font-variant-numeric: tabular-nums;
  }
  .vlt-paid-btn {
    background: none; border: none; padding: 0; cursor: pointer;
    font: inherit; color: inherit; letter-spacing: inherit;
    border-bottom: 1px dotted rgba(242,232,213,.25);
  }
  .vlt-paid-btn:hover { color: var(--vlt-gold-hi); border-color: rgba(224,168,62,.5); }
  .vlt-paid-input {
    width: 64px; background: rgba(242,232,213,.06);
    border: 1px solid rgba(224,168,62,.5); border-radius: 4px;
    color: var(--vlt-cream); font: inherit; padding: 0 4px; outline: none;
  }
  /* staggered entrances — keyed to the case revealing (ScrollReveal adds .in) */
  .vlt-case[data-fph-reveal] .vlt-cond {
    opacity: 0; transform: translateY(5px);
    transition: opacity .5s ease, transform .5s cubic-bezier(.22,.61,.36,1);
    transition-delay: calc(.3s + var(--i)*.06s);
  }
  .vlt-case[data-fph-reveal].in .vlt-cond { opacity: 1; transform: none; }
  .vlt-case[data-fph-reveal] .vlt-delta {
    opacity: 0; transform: translateX(-8px);
    transition: opacity .5s ease, transform .5s cubic-bezier(.22,.61,.36,1);
    transition-delay: calc(.55s + var(--i)*.06s);
  }
  .vlt-case[data-fph-reveal].in .vlt-delta { opacity: 1; transform: none; }

  /* ── ghost slot ── */
  .vlt-fig.ghost { animation: none; padding-bottom: 8px; }
  .vlt-ghost-mount {
    aspect-ratio: 4/4.85;
    border: 1px dashed rgba(224,168,62,.28); border-radius: 6px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 9px; text-align: center; padding: 12px;
    transition: border-color .25s, background .25s;
  }
  .vlt-fig.ghost:hover .vlt-ghost-mount { border-color: rgba(224,168,62,.5); background: rgba(224,168,62,.04); }
  .vlt-ghost-mount svg { width: 16px; height: 16px; color: rgba(224,168,62,.45); }
  .vlt-ghost-mount .g1 { font-size: 10.5px; font-weight: 300; color: var(--vlt-cream-mut); line-height: 1.5; }
  .vlt-ghost-mount .g2 { font-size: 11px; font-weight: 500; color: var(--vlt-gold-hi); }

  /* ── the hunt ── */
  .vlt-hunt { padding: 24px 0 26px; }
  .vlt-hunt-head { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
  .vlt h2 {
    margin: 0; font-family: var(--fp-font-display); font-weight: 400;
    font-size: clamp(26px, 2.8vw, 34px); line-height: 1; letter-spacing: .02em; color: #EEEEF5;
  }
  .vlt-hunt-sub { font-size: 12.5px; font-weight: 400; color: rgba(242,232,213,.56); }
  .vlt-hunt-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .vlt-hunt-card {
    display: flex; align-items: center; gap: 12px; min-width: 0;
    border: 1px solid rgba(242,232,213,.10); border-radius: 14px;
    padding: 10px 14px 10px 10px; text-decoration: none; color: inherit;
    background: linear-gradient(180deg, rgba(242,232,213,.018), transparent);
    transition: border-color .25s, transform .25s, background .25s;
  }
  .vlt-hunt-card:hover { border-color: rgba(224,168,62,.42); transform: translateY(-2px); background: rgba(224,168,62,.03); }
  .vlt-hunt-card .h-thumb {
    width: 44px; height: 50px; flex: 0 0 auto; border-radius: 6px;
    background: var(--vlt-mount); padding: 2.5px;
    box-shadow: 0 5px 10px rgba(0,0,0,.4);
  }
  .vlt-hunt-card .h-thumb img, .vlt-hunt-card .h-noimg {
    width: 100%; height: 100%; object-fit: cover; border-radius: 4px; background: #e9e0cd; display: block;
  }
  .vlt-hunt-card .h-noimg {
    display: flex; align-items: center; justify-content: center;
    font-family: var(--fp-font-display); font-size: 13px; color: #b3a585;
  }
  .vlt-hunt-card .h-id { flex: 1 1 auto; min-width: 0; }
  .vlt-hunt-card .h-name { display: block; font-size: 12px; font-weight: 500; color: var(--vlt-cream); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .vlt-hunt-card .h-line { display: block; margin-top: 2px; font-size: 8.5px; font-weight: 400; letter-spacing: .12em; text-transform: uppercase; color: var(--vlt-cream-mut); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .vlt-hunt-card .h-med { flex: 0 0 auto; text-align: right; }
  .vlt-hunt-card .h-med .k { display: block; font-size: 7.5px; font-weight: 500; letter-spacing: .18em; text-transform: uppercase; color: var(--vlt-cream-mut); }
  .vlt-hunt-card .h-med .v { display: block; font-family: var(--fp-font-display); font-size: 17px; letter-spacing: .03em; color: var(--vlt-gold-hi); line-height: 1.15; font-variant-numeric: tabular-nums; }
  .vlt-hunt-card .h-med .c { display: block; font-size: 8.5px; font-weight: 300; color: var(--vlt-cream-mut); }
  .vlt-hunt-card .h-bell { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 3px; padding-left: 4px; }
  .vlt-bell { position: relative; width: 15px; height: 15px; color: var(--vlt-cream-mut); }
  .vlt-bell svg { width: 15px; height: 15px; display: block; }
  .vlt-hunt-card .b-lbl { font-size: 7.5px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: var(--vlt-cream-mut); white-space: nowrap; }
  .vlt-bell.live { color: var(--vlt-gold-hi); }
  .vlt-bell.live svg { animation: vlt-bellSwing 2.6s ease-in-out infinite; transform-origin: 50% 2px; }
  @keyframes vlt-bellSwing { 0%, 100% { transform: rotate(0); } 6% { transform: rotate(11deg); } 14% { transform: rotate(-9deg); } 22% { transform: rotate(5deg); } 30% { transform: rotate(0); } }
  .vlt-bell.live::after {
    content: ''; position: absolute; inset: -6px; border-radius: 50%;
    box-shadow: 0 0 13px rgba(224,168,62,.55);
    opacity: 0; animation: vlt-bellGlow 2.6s ease-in-out infinite; pointer-events: none;
  }
  @keyframes vlt-bellGlow { 0%, 40%, 100% { opacity: 0; } 12% { opacity: 1; } }
  .vlt-moved {
    font-size: 8px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
    color: #1a1206; background: linear-gradient(180deg, var(--vlt-gold-hi), var(--vlt-gold));
    border-radius: 3px; padding: 2px 6px; white-space: nowrap;
    animation: vlt-movedPulse 2.6s ease-in-out infinite;
  }
  @keyframes vlt-movedPulse { 0%, 100% { opacity: .78; } 12% { opacity: 1; } }
  .vlt-hunt-foot { margin-top: 11px; display: flex; justify-content: flex-end; gap: 22px; }
  .vlt-hunt-foot a {
    font-size: 12.5px; font-weight: 500; color: var(--vlt-gold-hi); text-decoration: none;
    border-bottom: 1px solid rgba(224,168,62,.35); transition: border-color .2s;
  }
  .vlt-hunt-foot a:hover { border-color: var(--vlt-gold-hi); }

  /* ── closer ── */
  .vlt-refresh { padding: 16px 0 20px; }
  .vlt-refresh .wrap {
    display: flex; align-items: baseline; justify-content: center; gap: 8px; flex-wrap: wrap;
    font-size: 13px; font-weight: 300; color: var(--vlt-cream-dim); text-align: center; line-height: 1.6;
  }
  .vlt-refresh a {
    color: var(--vlt-gold-hi); text-decoration: none; font-weight: 400; white-space: nowrap;
    border-bottom: 1px solid rgba(224,168,62,.35); transition: border-color .2s;
  }
  .vlt-refresh a:hover { border-color: var(--vlt-gold-hi); }

  /* ── reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .vlt [data-fph-reveal] { opacity: 1; transform: none; transition: none; }
    .vlt-fig { animation: none !important; }
    .vlt-case-light, .vlt-case-sweep { display: none; }
    .vlt-case::before { display: none; }
    .vlt-case[data-fph-reveal] .vlt-cond, .vlt-case[data-fph-reveal] .vlt-delta { opacity: 1; transform: none; transition: none; }
    .vlt-bell.live svg { animation: none !important; }
    .vlt-bell.live::after { display: none; }
    .vlt-moved { animation: none !important; opacity: 1; }
  }

  /* ── responsive ── */
  @media (max-width: 1020px) {
    .vlt-hunt-row { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .vlt .wrap { padding: 0 20px; }
    .vlt-nav-in { padding: 0 20px; gap: 20px; height: 56px; }
    .vlt-nav-links { display: none; }
    .vlt-hero { padding: 24px 0 30px; }
    .vlt-stats .n { font-size: 20px; }
    .vlt-stats .n.gold { font-size: 23px; }
    .vlt-case-col { margin-top: 18px; }
    .vlt-case { padding: 30px 14px 14px; }
    .vlt-case-label { left: 18px; }
    .vlt-shelf { padding: 0 2px 13px; }
    .vlt-shelf-row { overflow-x: auto; scrollbar-width: none; padding-top: 12px; margin-top: -12px; }
    .vlt-shelf-row::-webkit-scrollbar { display: none; }
    .vlt-fig, .vlt-shelf-row.short .vlt-fig { flex: 0 0 146px; }
    .vlt-fig-val { font-size: 9px; }
    .vlt-remove { opacity: 1; transform: scale(1); }
    .vlt-hunt { padding: 22px 0 24px; }
    .vlt-hunt-row { grid-template-columns: 1fr; }
    .vlt-refresh { padding: 16px 0 18px; }
  }
`
