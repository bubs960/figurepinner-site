// SpotlightView — shared server-rendered (zero client JS) UI for both
// /today (self-canonical, always current) and /today/[date] (archive,
// canonicalizes to the figure page). Same gold/ink museum aesthetic as the
// /shelf share page, deliberately reused rather than a third visual system.

import { getFigureById, deriveName, prettyFigureUrl } from '@/data/kb'
import { thumb } from '@/lib/imageUrl'
import { prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'
import type { SpotlightRow } from '../_lib/dailySpotlight'

export function SpotlightView({
  row,
  isToday,
}: {
  row: SpotlightRow
  /** true on /today itself (adds a permalink to the dated archive URL);
   *  false on /today/[date] (adds a link back to the live /today instead). */
  isToday: boolean
}) {
  const figure = getFigureById(row.figureId)
  // Defensive only — the pool is hardcoded/verified and D1 rows only ever
  // come from that same pool, so this should never actually fire.
  if (!figure) return <EmptyState />

  const name = deriveName(figure)
  const line = prettifySlug(figure.product_line)
  const fandom = prettifySlug(figure.fandom)
  const image = figure.canonical_image_url ? thumb(figure.canonical_image_url, 480) : null
  const up = row.trendPct >= 0
  const pctLabel = `${up ? '+' : ''}${row.trendPct.toFixed(0)}%`

  return (
    <div className="tds">
      <style>{CSS}</style>
      <div className="tds-card">
        <span className="tds-pin" aria-hidden />
        <div className="tds-eyebrow">{isToday ? "Today's Grail Spotlight" : `Grail Spotlight — ${row.date}`}</div>

        <div className="tds-mount">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name} />
          ) : (
            <span className="tds-noimg" aria-hidden>{name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>

        <div className="tds-name">{name}</div>
        <div className="tds-line">{fandom} — {line}</div>

        <div className={`tds-trend ${up ? 'up' : 'dn'}`}>
          <span className="tds-arrow">{up ? '▲' : '▼'}</span>
          <span className="tds-pct">{pctLabel}</span>
          <span className="tds-window">over 90 days</span>
        </div>
        <div className="tds-comps">{row.compCount} real sold comps behind this read</div>

        <a className="tds-cta" href={prettyFigureUrl(figure)}>See full price history &rarr;</a>

        {isToday ? (
          <a className="tds-sub" href={`/today/${row.date}`}>Permalink for today &rarr;</a>
        ) : (
          <a className="tds-sub" href="/today">See today's spotlight &rarr;</a>
        )}
      </div>
      <a className="tds-home" href="/">FigurePinner &mdash; the collector&apos;s price guide</a>
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="tds">
      <style>{CSS}</style>
      <div className="tds-card">
        <span className="tds-pin" aria-hidden />
        <div className="tds-eyebrow">Today's Grail Spotlight</div>
        <div className="tds-empty">
          Nothing cleared the bar for a real momentum read today — check back tomorrow.
        </div>
        <a className="tds-cta" href="/search">Browse figures &rarr;</a>
      </div>
      <a className="tds-home" href="/">FigurePinner &mdash; the collector&apos;s price guide</a>
    </div>
  )
}

const CSS = `
  .tds {
    min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 28px; padding: 40px 20px;
    background:
      radial-gradient(900px 500px at 50% -12%, rgba(224,168,62,.10), transparent 62%),
      #09090f;
    color: #EEEEF5;
    font-family: var(--font-body, var(--fp-font-body, system-ui));
  }
  .tds-card {
    position: relative; display: flex; flex-direction: column; align-items: center; gap: 12px;
    width: min(520px, 92vw); padding: 44px 32px 32px;
    border-radius: 24px; border: 2px solid rgba(212,175,55,.35);
    background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.012) 60%, transparent);
    box-shadow: 0 26px 70px rgba(0,0,0,.42);
    text-align: center;
  }
  .tds-pin {
    width: 40px; height: 40px; border-radius: 20px; margin-bottom: 4px;
    background: linear-gradient(180deg, #fff0d0, #D4AF37);
    box-shadow: 0 0 16px rgba(212,175,55,.5);
  }
  .tds-eyebrow { font-size: 13px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: #D4AF37; }
  .tds-mount {
    width: 180px; height: 180px; border-radius: 14px; margin-top: 6px;
    background: linear-gradient(180deg,#fbf7ee 0%,#efe5d0 100%);
    display: flex; align-items: center; justify-content: center; overflow: hidden;
  }
  .tds-mount img { width: 100%; height: 100%; object-fit: contain; }
  .tds-noimg { font-family: var(--fp-font-display); font-size: 40px; color: #8a7e63; }
  .tds-name { font-family: var(--fp-font-display); font-size: 26px; font-weight: 400; color: #EEEEF5; margin-top: 6px; }
  .tds-line { font-size: 12px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; color: rgba(242,232,213,.5); }
  .tds-trend { display: flex; align-items: baseline; gap: 8px; margin-top: 10px; }
  .tds-arrow { font-size: 18px; }
  .tds-pct { font-family: var(--fp-font-display); font-size: 30px; font-variant-numeric: tabular-nums; }
  .tds-window { font-size: 12px; color: rgba(242,232,213,.5); }
  .tds-trend.up .tds-arrow, .tds-trend.up .tds-pct { color: #79c98c; }
  .tds-trend.dn .tds-arrow, .tds-trend.dn .tds-pct { color: #e08078; }
  .tds-comps { font-size: 12px; color: rgba(242,232,213,.5); }
  .tds-empty { font-family: var(--fp-font-display); font-size: 20px; color: #EEEEF5; max-width: 34ch; margin: 8px 0; }
  .tds-cta {
    margin-top: 14px; padding: 12px 26px; border-radius: 999px; text-decoration: none;
    font-size: 14px; font-weight: 600; color: #1a1206;
    background: linear-gradient(180deg, #f5c462, #e0a83e);
  }
  .tds-sub { margin-top: 4px; font-size: 12.5px; color: rgba(242,232,213,.5); text-decoration: none; }
  .tds-sub:hover { color: #f5c462; }
  .tds-home { font-size: 13px; color: rgba(242,232,213,.5); text-decoration: none; }
  .tds-home:hover { color: #f5c462; }
`
