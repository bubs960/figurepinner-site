/**
 * HeroesVillainsBand — the curated good/evil feature band under the seam hero
 * (Gate 3, directive decision 7). Top hero-side grails (left) face top villain-side
 * grails (right) across the seam — the duality paid off as real content. Every
 * figure → /figure/ with a real R2 photo. SSR server component.
 *
 * Templatized (S40): the heading, sub, allegiance labels, and rarity-flag wording
 * all come from the theme's VoicePack, so each fandom speaks its own language
 * (MOTU: Heroic/Evil Warriors; GI Joe: G.I. Joe vs Cobra). No hardcoded fandom copy.
 */

import type { HeroesVillainsPayload, HvFigure, HubFlagWording } from '../_data/fandomHubs'

function flagLabel(flag: string, fw: HubFlagWording): string {
  if (flag === 'VINTAGE') return fw.vintage ?? 'VINTAGE'
  if (flag === 'MOTUC') return fw.motuc ?? 'CLASSICS'
  if (flag === 'EXCLUSIVE') return fw.exclusive ?? 'EXCLUSIVE'
  if (flag === 'REISSUE') return fw.reissue ?? 'REISSUE'
  return ''
}

function HvCard({ f, fw }: { f: HvFigure; fw: HubFlagWording }) {
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
        {flagLabel(f.flag, fw) && <span className="fh-hv-flag">{flagLabel(f.flag, fw)}</span>}
      </span>
    </a>
  )
}

export default function HeroesVillainsBand({
  data,
  title,
  sub,
  heroesLabel,
  villainsLabel,
  flag,
}: {
  data: HeroesVillainsPayload
  title: string
  sub: string
  heroesLabel: string
  villainsLabel: string
  flag: HubFlagWording
}) {
  if (!data.heroes.length && !data.villains.length) return null
  return (
    <section className="fh-hv" aria-labelledby="fh-hv-h">
      <div className="fh-hv-head">
        <h2 id="fh-hv-h" className="fh-hv-title">{title}</h2>
        <p className="fh-hv-sub">{sub}</p>
      </div>
      <div className="fh-hv-grid">
        <div className="fh-hv-side fh-hv-heroes">
          <div className="fh-hv-side-label">{heroesLabel}</div>
          {data.heroes.map(f => <HvCard key={f.figure_id} f={f} fw={flag} />)}
        </div>
        <div className="fh-hv-divider" aria-hidden="true" />
        <div className="fh-hv-side fh-hv-villains">
          <div className="fh-hv-side-label">{villainsLabel}</div>
          {data.villains.map(f => <HvCard key={f.figure_id} f={f} fw={flag} />)}
        </div>
      </div>
    </section>
  )
}
