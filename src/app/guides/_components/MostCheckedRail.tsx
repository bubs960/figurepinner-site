// MostCheckedRail — Phase 8 of the guides conversion redesign (design brief:
// "Most-checked rail replaces the Babyfaces/Heels grail wall as the first tile
// surface. Demand-ranked tiles match what value-checkers actually look up —
// a visitor's common figure can appear here; it never appears in a
// price-ranked grail wall."). Steve, 2026-08-15: greenlit with the explicit
// expectation that surfacing real lookup demand also reveals data gaps at
// scale — so unlike every other tile surface on this hub, a figure with no
// price yet is NOT dropped, it renders honestly ("Not yet priced").
//
// Reuses HeroesVillainsBand's card visual (fh-hv-* classes) for zero new CSS
// on the tile itself — only the wrapping grid (fh-mc-grid, single flowing
// rank-ordered list instead of a two-column hero/villain split) is new.

import type { MostCheckedPayload, MostCheckedFigure, HubFlagWording } from '../_data/fandomHubs'

function flagLabel(flag: string, fw: HubFlagWording): string {
  if (flag === 'VINTAGE') return fw.vintage ?? 'VINTAGE'
  if (flag === 'MOTUC') return fw.motuc ?? 'CLASSICS'
  if (flag === 'EXCLUSIVE') return fw.exclusive ?? 'EXCLUSIVE'
  if (flag === 'REISSUE') return fw.reissue ?? 'REISSUE'
  return ''
}

function McCard({ f, fw, rank }: { f: MostCheckedFigure; fw: HubFlagWording; rank: number }) {
  return (
    <a href={f.url} className="fh-hv-card fh-mc-card">
      <span className="fh-intel-rank" aria-hidden="true">{rank}</span>
      <span className={`fh-hv-thumb${f.image ? '' : ' is-empty'}`}>
        {f.image && <img src={f.image} alt="" width={44} height={44} loading="lazy" decoding="async" />}
      </span>
      <span className="fh-hv-text">
        <span className="fh-hv-name">{f.name}</span>
        {f.price != null ? (
          <span className="fh-hv-price">
            ${f.price.toLocaleString('en-US')}
            <span className="fh-hv-sold">{f.sold_count} sold</span>
          </span>
        ) : (
          <span className="fh-hv-sold fh-mc-unpriced">Not yet priced</span>
        )}
        {flagLabel(f.flag, fw) && <span className="fh-hv-flag">{flagLabel(f.flag, fw)}</span>}
      </span>
    </a>
  )
}

export default function MostCheckedRail({
  data,
  title = 'Most Checked',
  sub = "What collectors are actually looking up right now — real lookup demand, not just price.",
  flag,
}: {
  data: MostCheckedPayload
  title?: string
  sub?: string
  flag: HubFlagWording
}) {
  if (!data.figures.length) return null
  return (
    <section className="fh-mc" aria-labelledby="fh-mc-h">
      <div className="fh-hv-head">
        <h2 id="fh-mc-h" className="fh-hv-title">{title}</h2>
        <p className="fh-hv-sub">{sub}</p>
      </div>
      <div className="fh-mc-grid">
        {data.figures.map((f, i) => <McCard key={f.figure_id} f={f} fw={flag} rank={i + 1} />)}
      </div>
    </section>
  )
}
