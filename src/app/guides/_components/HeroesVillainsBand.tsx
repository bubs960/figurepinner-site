/**
 * HeroesVillainsBand — the curated good/evil feature band under the MOTU hero
 * (Gate 3, directive decision 7). Top Heroic-Warrior grails (left) face top
 * Evil-Warrior grails (right) across the seam — the duality paid off as real
 * content. Every figure → /figure/ with a real R2 photo. SSR server component.
 * This is the ONLY place the page splits good/evil by content; the lines below
 * stay organized by line.
 */

import type { HeroesVillainsPayload, HvFigure } from '../_data/fandomHubs'

function flagLabel(flag: string): string {
  switch (flag) {
    case 'VINTAGE': return "VINTAGE '82"
    case 'MOTUC': return 'MOTUC'
    case 'EXCLUSIVE': return 'EXCLUSIVE'
    case 'REISSUE': return 'REISSUE'
    default: return ''
  }
}

function HvCard({ f }: { f: HvFigure }) {
  return (
    <a href={f.url} className="fh-hv-card">
      <span className={`fh-hv-thumb${f.image ? '' : ' is-empty'}`}>
        {f.image && <img src={f.image} alt="" width={44} height={44} loading="lazy" decoding="async" />}
      </span>
      <span className="fh-hv-text">
        <span className="fh-hv-name">{f.name}</span>
        <span className="fh-hv-price">
          ${f.price.toLocaleString('en-US')}
          <span className="fh-hv-sold">{f.sold_count} sold</span>
        </span>
        {flagLabel(f.flag) && <span className="fh-hv-flag">{flagLabel(f.flag)}</span>}
      </span>
    </a>
  )
}

export default function HeroesVillainsBand({ data }: { data: HeroesVillainsPayload }) {
  if (!data.heroes.length && !data.villains.length) return null
  return (
    <section className="fh-hv" aria-labelledby="fh-hv-h">
      <div className="fh-hv-head">
        <h2 id="fh-hv-h" className="fh-hv-title">Heroes &amp; Villains of Eternia</h2>
        <p className="fh-hv-sub">The most-wanted grails on each side of the seam — real eBay sold comps.</p>
      </div>
      <div className="fh-hv-grid">
        <div className="fh-hv-side fh-hv-heroes">
          <div className="fh-hv-side-label">Heroic Warriors</div>
          {data.heroes.map(f => <HvCard key={f.figure_id} f={f} />)}
        </div>
        <div className="fh-hv-divider" aria-hidden="true" />
        <div className="fh-hv-side fh-hv-villains">
          <div className="fh-hv-side-label">Evil Warriors</div>
          {data.villains.map(f => <HvCard key={f.figure_id} f={f} />)}
        </div>
      </div>
    </section>
  )
}
