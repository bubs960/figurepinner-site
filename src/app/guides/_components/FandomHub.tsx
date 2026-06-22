/**
 * FandomHub — culture-led, themed price-intel hub for one fandom.
 *
 * Hierarchy (Steve 6/20: culture drives the hub, not the price):
 *   1. Themed hero — you're IN the fandom world. Kicker + title + lore lead + figure-search.
 *   2. Intel comp table — "what's hot now", fandom-voiced, every row → figure page (the funnel).
 *   3. Editorial body — the long-form culture/value content (from the Article in articles.ts).
 *   4. CTA + further reading.
 *
 * Theming: a [data-fandom="x"] wrapper scopes a CSS-var palette + motif (globals.css).
 * No raster art above the fold (perf/LCP). All motion is reduced-motion-gated in CSS.
 * Voice pack supplies every chrome string — no generic UI copy in a themed hub.
 *
 * Intel table degrades gracefully: if the nightly precompute hasn't produced data,
 * we show the voiced empty-state + search instead of a broken/empty table.
 */

import type { Article, ArticleBlock } from '../_data/articles'
import type { HubTheme, TopCompPayload, VaultPayload, HeroesVillainsPayload } from '../_data/fandomHubs'
import SiteHeader from '@/app/components/SiteHeader'
import AdSlot from '@/app/components/AdSlot'
import FandomHubInteractive from './FandomHubInteractive'
import FandomLineSections from './FandomLineSections'
import GiJoeSeamAtmosphere from './GiJoeSeamAtmosphere'
import WweRingAtmosphere from './WweRingAtmosphere'
import SeamScrollDriver from './SeamScrollDriver'
import FandomFacts from './FandomFacts'
import HeroesVillainsBand from './HeroesVillainsBand'
import SaberClashAtmosphere from './SaberClashAtmosphere'
import FactionSeamAtmosphere from './FactionSeamAtmosphere'
import EraMapGrid from './EraMapGrid'
import FaqSection from './FaqSection'

function renderText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  const re = /\[\[(.+?)\|(.+?)\]\]/g
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={`t${match.index}`}>{text.slice(last, match.index)}</span>)
    parts.push(
      <a key={`a${match.index}`} href={match[2]} style={{ color: 'var(--fp-accent)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
        {match[1]}
      </a>,
    )
    last = match.index + match[0].length
  }
  if (parts.length === 0) return text
  if (last < text.length) parts.push(<span key="tail">{text.slice(last)}</span>)
  return <>{parts}</>
}

/**
 * SeamHeroAtmosphere — the good/evil VERTICAL SEAM behind the MOTU hero (Gate 1).
 *
 * Eternia divided down a glowing seam: He-Man's heroic side LEFT (blue→gold),
 * Skeletor's dark side RIGHT (purple→toxic-green→black), Castle Grayskull
 * silhouette left-of-seam and a Snake Mountain hint right-of-seam, both shrouded
 * in CSS mist. Everything here is DECORATIVE and aria-hidden: it layers OVER the
 * SSR'd hero copy, which stays the LCP. Pure CSS gradients + inline-SVG vector
 * silhouettes — zero raster, negligible bytes (CWV guardrail). The entry "lights
 * up" ignite + any motion is reduced-motion-gated in globals.css. No sword yet
 * (Gate 1) — the '82 two-halves Power Sword lands on the seam at Gate 2.
 *
 * The silhouettes are ORIGINAL homage shapes (an evocative fortress / a serpent
 * peak), never the trademarked Grayskull/Snake Mountain logos — formal
 * legal-compliance pass runs at Gate 2 over sword + these glyphs + the font.
 */
/**
 * PowerSwordSeam — the 1982 VINTAGE "two halves" Power Sword, rendered as
 * ORIGINAL Eternia-styled art (Gate 2), standing ON the seam.
 *
 * The five anatomy tells (directive): straight double-edged blade with a raised
 * center fuller/spine; swept-up gold wing crossguard; ribbed gold grip; round
 * amber jeweled pommel; ~4:1 blade-to-grip. The blade is split down its spine
 * into He-Man's half (left, faint cool-steel) + Skeletor's half (right, faint
 * cool-green) — the join line of the sword IS the seam of Eternia. Built as two
 * <g> halves with a small resting gap so Gate 3 can slide them apart→together on
 * scroll; here it is STATIC (no scroll wiring). Rendered via SVG gradients +
 * specular + a glowing jewel (rich, not a flat icon), zero raster, non-LCP.
 * RIGHTS: original vector art, never a traced/photoreal copy of the toy.
 */
function PowerSwordSeam() {
  return (
    <svg className="fh-pwsword" viewBox="0 0 150 330" preserveAspectRatio="xMidYMax meet" focusable="false">
      <defs>
        {/* GLEAMING faceted steel: bright edge + mid valley + bright spine, far
            lighter than before so the blade catches the Eternia dusk (web fix #4).
            Left faintly cool-blue (He-Man). */}
        <linearGradient id="pwsSteelL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#eef2fb" />
          <stop offset="0.5" stopColor="#97a4b8" />
          <stop offset="1" stopColor="#fcfdff" />
        </linearGradient>
        {/* Right faintly cool-green (Skeletor) */}
        <linearGradient id="pwsSteelR" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fcfdff" />
          <stop offset="0.5" stopColor="#94a296" />
          <stop offset="1" stopColor="#dde6dd" />
        </linearGradient>
        <linearGradient id="pwsGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffeaa2" />
          <stop offset="0.5" stopColor="#e7bd52" />
          <stop offset="1" stopColor="#9c722a" />
        </linearGradient>
        <radialGradient id="pwsJewel" cx="0.36" cy="0.28" r="0.9">
          <stop offset="0" stopColor="#fff9ea" />
          <stop offset="0.32" stopColor="#ffd571" />
          <stop offset="0.7" stopColor="#efaf3a" />
          <stop offset="1" stopColor="#9a5a16" />
        </radialGradient>
        <radialGradient id="pwsJewelHalo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe6a0" stopOpacity="0.9" />
          <stop offset="0.4" stopColor="#f3bd48" stopOpacity="0.45" />
          <stop offset="1" stopColor="#e0a52e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* amber pommel glow halo — behind both gem halves, centered on spine.
          Brighter + larger so the gem reads as the glowing signature, not a bead. */}
      <ellipse cx="75" cy="282" rx="48" ry="48" fill="url(#pwsJewelHalo)" />

      {/* He-Man's half — left of the spine. Broader, shorter blade so the HILT
          carries the recognizability weight (web fix #3). */}
      <g className="fh-pwsword-half fh-pwsword-left">
        <path d="M75 8 L65 30 L52 56 L52 182 L75 190 Z" fill="url(#pwsSteelL)" />
        {/* full-length specular: bright outer edge + a spine sheen → it gleams */}
        <path d="M52 56 L52 182" stroke="#f2f6ff" strokeWidth="1.5" opacity="0.7" />
        <path d="M73 16 L70 56 L70 178 L73 186 Z" fill="#ffffff" opacity="0.28" />
        {/* SUBSTANTIAL swept-up wing crossguard — thick, short, rising toward the
            blade (web fix #1, the make-or-break tell) */}
        <path d="M75 207 L48 203 Q33 198 30 179 Q31 168 38 164 Q46 177 57 185 Q67 190 75 189 Z" fill="url(#pwsGold)" />
        {/* ribbed grip */}
        <path d="M64 207 L75 207 L75 262 L64 262 Z" fill="url(#pwsGold)" />
        <path d="M64 218 H75 M64 230 H75 M64 242 H75 M64 254 H75" stroke="#6b4a17" strokeWidth="1.7" opacity="0.7" />
        {/* jeweled pommel — left semicircle (round amber gem), raised into view */}
        <path d="M75 262 A20 20 0 0 0 75 302 Z" fill="url(#pwsJewel)" />
      </g>

      {/* Skeletor's half — right of the spine */}
      <g className="fh-pwsword-half fh-pwsword-right">
        <path d="M75 8 L85 30 L98 56 L98 182 L75 190 Z" fill="url(#pwsSteelR)" />
        <path d="M98 56 L98 182" stroke="#eef4ee" strokeWidth="1.5" opacity="0.6" />
        <path d="M77 16 L80 56 L80 178 L77 186 Z" fill="#ffffff" opacity="0.22" />
        <path d="M75 207 L102 203 Q117 198 120 179 Q119 168 112 164 Q104 177 93 185 Q83 190 75 189 Z" fill="url(#pwsGold)" />
        <path d="M86 207 L75 207 L75 262 L86 262 Z" fill="url(#pwsGold)" />
        <path d="M75 218 H86 M75 230 H86 M75 242 H86 M75 254 H86" stroke="#6b4a17" strokeWidth="1.7" opacity="0.7" />
        <path d="M75 262 A20 20 0 0 1 75 302 Z" fill="url(#pwsJewel)" />
      </g>

      {/* gem specular glint (bright hotspot) + crossguard center boss */}
      <circle cx="68" cy="273" r="7" fill="#fff9ea" opacity="0.9" />
      <circle cx="70" cy="276" r="3" fill="#ffffff" opacity="0.7" />
      <circle cx="75" cy="197" r="6" fill="url(#pwsGold)" />
      <circle cx="75" cy="195" r="2.3" fill="#fff1c0" opacity="0.7" />
    </svg>
  )
}

function SeamHeroAtmosphere() {
  return (
    <div className="fh-seam-atmos" aria-hidden="true">
      <div className="fh-sky fh-sky-left" />
      <div className="fh-sky fh-sky-right" />
      <div className="fh-mist" />
      <div className="fh-seam" />
      <div className="fh-seam-bloom" />

      {/* Castle Grayskull — original fortress homage, heroic (left) side.
          Gradient body (lifts toward the seam) + a seam-facing gold rim-light +
          base mist so it sits IN Eternia rather than reading as a flat cutout. */}
      <svg className="fh-castle" viewBox="0 0 220 150" preserveAspectRatio="xMidYMax meet" focusable="false">
        <defs>
          <linearGradient id="castleFill" x1="0" y1="0" x2="1" y2="0.25">
            <stop offset="0" stopColor="#070603" />
            <stop offset="0.62" stopColor="#0d0b07" />
            <stop offset="1" stopColor="#2a2113" />
          </linearGradient>
          <linearGradient id="castleRim" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor="#f4c85e" stopOpacity="0.9" />
            <stop offset="0.16" stopColor="#caa23e" stopOpacity="0.4" />
            <stop offset="0.42" stopColor="#caa23e" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="castleMist" cx="0.5" cy="1" r="0.85">
            <stop offset="0" stopColor="#ecdaa6" stopOpacity="0.2" />
            <stop offset="1" stopColor="#ecdaa6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          className="fh-castle-body"
          d="M0 150 V96 H16 V82 H24 V96 H32 V82 H40 V96 H58 V64 H72 V44 L86 30 V44 H98 V20 L110 6 L122 20 V44 H134 V44 L148 30 V64 H162 V96 H180 V82 H188 V96 H196 V82 H204 V96 H220 V150 Z"
          fill="url(#castleFill)"
        />
        <path className="fh-castle-gate" d="M96 150 V112 Q110 92 124 112 V150 Z" fill="#06100d" />
        <path
          d="M0 150 V96 H16 V82 H24 V96 H32 V82 H40 V96 H58 V64 H72 V44 L86 30 V44 H98 V20 L110 6 L122 20 V44 H134 V44 L148 30 V64 H162 V96 H180 V82 H188 V96 H196 V82 H204 V96 H220 V150 Z"
          fill="none" stroke="url(#castleRim)" strokeWidth="1.6"
        />
        <rect x="0" y="92" width="220" height="58" fill="url(#castleMist)" />
        {/* Windows that ignite on entry */}
        <rect className="fh-castle-win" x="104" y="48" width="12" height="18" rx="2" />
        <rect className="fh-castle-win" x="62" y="74" width="7" height="12" rx="1.5" />
        <rect className="fh-castle-win" x="151" y="74" width="7" height="12" rx="1.5" />
      </svg>

      {/* Snake Mountain — original serpent-peak homage, dark (right) side.
          Seam-facing (left) edge rim-lit toxic-green from the seam glow. */}
      <svg className="fh-snake" viewBox="0 0 200 150" preserveAspectRatio="xMidYMax meet" focusable="false">
        <defs>
          <linearGradient id="snakeFill" x1="1" y1="0" x2="0" y2="0.2">
            <stop offset="0" stopColor="#050607" />
            <stop offset="0.6" stopColor="#080a0a" />
            <stop offset="1" stopColor="#13251a" />
          </linearGradient>
          <linearGradient id="snakeRim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8fd24a" stopOpacity="0.7" />
            <stop offset="0.18" stopColor="#5f8f24" stopOpacity="0.3" />
            <stop offset="0.44" stopColor="#5f8f24" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="snakeMist" cx="0.5" cy="1" r="0.85">
            <stop offset="0" stopColor="#7fae52" stopOpacity="0.16" />
            <stop offset="1" stopColor="#7fae52" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path className="fh-snake-peak" d="M0 150 L40 92 L70 116 L104 40 L132 96 L160 70 L200 150 Z" fill="url(#snakeFill)" />
        <path d="M0 150 L40 92 L70 116 L104 40 L132 96 L160 70 L200 150 Z" fill="none" stroke="url(#snakeRim)" strokeWidth="1.5" />
        {/* the rising serpent silhouette over the peak */}
        <path
          className="fh-snake-coil"
          d="M104 44 C112 30 96 18 110 8 C126 0 138 14 130 26 C124 35 134 40 132 48"
          fill="none"
        />
        <rect x="0" y="96" width="200" height="54" fill="url(#snakeMist)" />
      </svg>

      <PowerSwordSeam />
    </div>
  )
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case 'h2':
      return <h2 className="fh-h2">{block.text}</h2>
    case 'h3':
      return <h3 className="fh-h3">{block.text}</h3>
    case 'ul':
      return (
        <ul className="fh-ul">
          {block.items.map((it, i) => <li key={i}>{renderText(it)}</li>)}
        </ul>
      )
    case 'callout':
      return <p className="fh-callout">{renderText(block.text)}</p>
    case 'p':
    default:
      return <p className="fh-p">{renderText(block.text)}</p>
  }
}

function flagLabel(flag: string, theme: HubTheme): string {
  const v = theme.voice.flag
  if (flag === 'VINTAGE') return v.vintage ?? 'VINTAGE'
  if (flag === 'MOTUC') return v.motuc ?? 'CLASSICS'
  if (flag === 'EXCLUSIVE') return v.exclusive ?? 'EXCLUSIVE'
  if (flag === 'REISSUE') return v.reissue ?? 'REISSUE'
  return ''
}

function IntelTable({ data, theme }: { data: TopCompPayload | null; theme: HubTheme }) {
  const v = theme.voice
  return (
    <section className="fh-intel" aria-labelledby="fh-intel-h">
      <div className="fh-intel-head">
        <h2 id="fh-intel-h" className="fh-intel-title">{v.intelHeader}</h2>
        <p className="fh-intel-sub">{v.intelSub}</p>
      </div>
      {data && data.figures.length > 0 ? (
        <>
          <ol className="fh-intel-list">
            {data.figures.map((f, i) => (
              <li key={f.figure_id} className="fh-intel-row">
                <a href={f.url} className="fh-intel-link">
                  <span className="fh-intel-rank" aria-hidden="true">{i + 1}</span>
                  <span className="fh-intel-name">
                    {f.name}
                    <span className="fh-intel-line">{f.line}</span>
                  </span>
                  {flagLabel(f.flag, theme) && <span className="fh-intel-flag">{flagLabel(f.flag, theme)}</span>}
                  <span className="fh-intel-price">
                    ${f.price.toLocaleString('en-US')}
                    {f.last_sold && <span className="fh-intel-date">{f.last_sold}</span>}
                  </span>
                </a>
              </li>
            ))}
          </ol>
          <p className="fh-intel-foot">
            Updated {new Date(data.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · real eBay sold comps
          </p>
        </>
      ) : (
        <p className="fh-intel-empty">{v.emptyState}</p>
      )}
    </section>
  )
}

export default function FandomHub({
  article,
  theme,
  topComps,
  vaults,
  heroesVillains,
  moreGuides,
}: {
  article: Article
  theme: HubTheme
  topComps: TopCompPayload | null
  vaults: VaultPayload | null
  heroesVillains?: HeroesVillainsPayload | null
  moreGuides: { slug: string; title: string; readingMinutes: number }[]
}) {
  const v = theme.voice
  // Seam hero is the atmospheric centerpiece pattern MOTU proved (Gate 1) and
  // GI Joe templatized (S40). theme.seam opts a fandom in; theme.centerpiece
  // picks which inline-SVG hero it renders.
  const isSeam = theme.seam

  // "By the numbers" stats — all derived from real data (no fabrication).
  const totalFigs = vaults ? vaults.vaults.reduce((s, x) => s + x.count, 0) : 0
  const pricedFigs = vaults ? vaults.vaults.reduce((s, x) => s + x.priced_count, 0) : 0
  const lineCount = vaults ? vaults.vaults.length : 0
  const topGrail = topComps && topComps.figures.length ? Math.max(...topComps.figures.map(f => f.price)) : 0

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription,
    dateModified: article.updated,
    author: { '@type': 'Organization', name: 'FigurePinner' },
    publisher: { '@type': 'Organization', name: 'FigurePinner' },
    mainEntityOfPage: `https://figurepinner.com/guides/${article.slug}`,
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Guides', item: 'https://figurepinner.com/guides' },
      { '@type': 'ListItem', position: 2, name: article.title, item: `https://figurepinner.com/guides/${article.slug}` },
    ],
  }

  return (
    <main data-fandom={theme.fandom} className="fh-main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <SiteHeader crumbs={[{ label: 'Guides', href: '/guides' }, { label: article.title }]} />

      <section className={`fh-hero${isSeam ? ' fh-hero--seam' : ''}`}>
        {isSeam &&
          (theme.centerpiece === 'pwsword' ? (
            <SeamHeroAtmosphere />
          ) : theme.centerpiece === 'wwe-ring' ? (
            <WweRingAtmosphere />
          ) : theme.centerpiece === 'saber-clash' ? (
            <SaberClashAtmosphere />
          ) : theme.centerpiece === 'faction-seam' ? (
            <FactionSeamAtmosphere />
          ) : (
            <GiJoeSeamAtmosphere />
          ))}
        {isSeam && <SeamScrollDriver />}
        <div className="fh-hero-inner">
          <div className="fh-kicker">{v.kicker}</div>
          <h1 className="fh-title">{article.title}</h1>
          <p className="fh-lead">{v.heroLead}</p>
          <form action="/search" method="get" className="fh-search" role="search">
            <input
              type="search"
              name="q"
              className="fh-search-input"
              placeholder={v.searchPlaceholder}
              aria-label={v.searchPlaceholder}
            />
            <button type="submit" className="fh-search-btn">{v.ctaLabel}</button>
          </form>
        </div>
      </section>

      <article className="fh-body">
        {isSeam && totalFigs > 0 && (
          <div className="fh-stats" aria-label={v.statsAria}>
            <div className="fh-stat"><span className="fh-stat-num">{totalFigs.toLocaleString('en-US')}</span><span className="fh-stat-label">figures cataloged</span></div>
            <div className="fh-stat"><span className="fh-stat-num">{pricedFigs.toLocaleString('en-US')}</span><span className="fh-stat-label">with live comps</span></div>
            <div className="fh-stat"><span className="fh-stat-num">{lineCount}</span><span className="fh-stat-label">{v.statsLinesLabel}</span></div>
            <div className="fh-stat"><span className="fh-stat-num">{theme.era.start}<span className="fh-stat-dash">–</span>{theme.era.end ?? 'now'}</span><span className="fh-stat-label">{theme.era.label}</span></div>
            {topGrail > 0 && <div className="fh-stat"><span className="fh-stat-num">${topGrail.toLocaleString('en-US')}</span><span className="fh-stat-label">top grail</span></div>}
          </div>
        )}

        {/* PARENT-page stat strip (general wrestling-hub): the parent has no vaults, so
            its "by the numbers" come from theme.parentStats + the grails roll-up. */}
        {isSeam && theme.parentStats && theme.parentStats.length > 0 && (
          <div className="fh-stats" aria-label={v.statsAria}>
            {theme.parentStats.map((s) => (
              <div className="fh-stat" key={s.label}><span className="fh-stat-num">{s.num}</span><span className="fh-stat-label">{s.label}</span></div>
            ))}
            {topGrail > 0 && <div className="fh-stat"><span className="fh-stat-num">${topGrail.toLocaleString('en-US')}</span><span className="fh-stat-label">top grail</span></div>}
          </div>
        )}

        <div className="fh-ad"><AdSlot slot="leaderboard" /></div>

        {/* PARENT-page era map (general wrestling-hub): links DOWN to child hubs + scoped
            searches instead of re-listing figures (cannibalization law). */}
        {theme.eraMap && theme.eraMap.length > 0 && (
          <EraMapGrid title={theme.eramapTitle ?? 'Pick your era'} sub={theme.eramapSub ?? ''} cards={theme.eraMap} />
        )}

        {isSeam && heroesVillains && (
          <HeroesVillainsBand
            data={heroesVillains}
            title={v.hvTitle}
            sub={v.hvSub}
            heroesLabel={v.heroesLabel}
            villainsLabel={v.villainsLabel}
            flag={v.flag}
          />
        )}

        {/* Seam hub (R2): the Heroes-vs-Villains split is the figure module; keep
            ONLY the price-checker tool here (the ranked "Power Level" intel table
            was redundant with the split — dropped). Other fandoms keep the full table. */}
        {isSeam ? (
          <FandomHubInteractive
            figures={theme.intelMode === 'table' ? (topComps?.figures ?? []) : []}
            generatedAt={topComps?.generated_at ?? ''}
            checkerOnly={theme.intelMode === 'checker'}
            voice={{
              intelHeader: v.intelHeader,
              intelSub: v.intelSub,
              emptyState: v.emptyState,
              searchPlaceholder: v.searchPlaceholder,
              ctaLabel: v.ctaLabel,
              flag: v.flag,
              checkerTitle: v.checkerTitle,
              checkerSub: v.checkerSub,
              checkerLoading: v.checkerLoading,
              checkerMiss: v.checkerMiss,
              checkerError: v.checkerError,
            }}
          />
        ) : topComps && topComps.figures.length > 0 ? (
          <FandomHubInteractive
            figures={topComps.figures}
            generatedAt={topComps.generated_at}
            voice={{
              intelHeader: v.intelHeader,
              intelSub: v.intelSub,
              emptyState: v.emptyState,
              searchPlaceholder: v.searchPlaceholder,
              ctaLabel: v.ctaLabel,
              flag: v.flag,
              checkerTitle: v.checkerTitle,
              checkerSub: v.checkerSub,
              checkerLoading: v.checkerLoading,
              checkerMiss: v.checkerMiss,
              checkerError: v.checkerError,
            }}
          />
        ) : (
          <IntelTable data={topComps} theme={theme} />
        )}

        <div className="fh-ad"><AdSlot slot="rectangle" /></div>

        {vaults && vaults.vaults.length > 0 ? (
          <FandomLineSections
            vaults={vaults.vaults}
            lore={theme.lore}
            genre={theme.genre ?? theme.fandom}
            title={v.linesTitle}
            sub={v.linesSub}
            flag={v.flag}
          />
        ) : (
          article.body.map((block, i) => <Block key={i} block={block} />)
        )}

        {/* R3: in-content ad (below fold). adsterra-banner is the site's live unit
            (no approval gate, same as other guide pages); the bottom leaderboard is
            the AdSense slot that activates once Google approves. AdSlot reserves
            height + is Pro-aware (ad-free for Pro), so no CLS for free users. */}
        <div className="fh-ad fh-ad-reserve"><AdSlot slot="adsterra-banner" /></div>

        {isSeam && <FaqSection faqs={theme.faqs} />}

        <div className="fh-cta-wrap">
          <a href="/search" className="fh-cta">{v.ctaLabel}</a>
        </div>

        {isSeam && (
          <FandomFacts
            facts={theme.facts.items}
            promptIdle={theme.facts.promptIdle}
            promptMore={theme.facts.promptMore}
            glyph={theme.facts.glyph}
          />
        )}

        {/* Story expander only when the body wasn't already rendered inline above
            (vault hubs swap the body slot for the line accordion; the parent page
            renders the full body inline, so no collapsed re-render — avoids dup). */}
        {vaults && vaults.vaults.length > 0 && article.body.length > 0 && (
          <details className="fh-story">
            <summary>{v.storyLabel}</summary>
            <div className="fh-story-body">
              {article.body.slice(0, 2).map((block, i) => <Block key={i} block={block} />)}
            </div>
          </details>
        )}

        <div className="fh-ad"><AdSlot slot="leaderboard" /></div>

        {moreGuides.length > 0 && (
          <div className="fh-more">
            <div className="fh-more-label">More guides</div>
            <div className="fh-more-grid">
              {moreGuides.map(g => (
                <a key={g.slug} href={`/guides/${g.slug}`} className="fh-more-card">
                  {g.title}
                  <span className="fh-more-min">{g.readingMinutes} min read</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </article>
    </main>
  )
}
