'use client'
/**
 * GenreTaxonomy.tsx
 * Landing page genre/line selector.
 * Client component — handles active-genre state with zero external deps.
 *
 * UX flow:
 *   1. User sees genre pills across the top (scrollable).
 *   2. Clicking a genre animates-in a grid of its product lines.
 *   3. Each line card links to the genre page.
 *   4. "Browse all →" pill takes to the full genre page.
 */

import { useState } from 'react'

// ─── Data ────────────────────────────────────────────────────────────────────

interface Line {
  name: string
  slug: string          // product_line slug in KB
  count: string
  years: string
  badge?: 'hot' | 'vintage' | 'new' | 'premium'
  desc?: string         // one short clause
}

interface Genre {
  slug: string          // fandom slug
  name: string
  emoji: string
  totalCount: string
  accent: string        // CSS color
  lines: Line[]
}

const GENRES: Genre[] = [
  {
    slug: 'wrestling',
    name: 'Wrestling',
    emoji: '🤼',
    totalCount: '8,000+',
    accent: '#0066FF',
    lines: [
      { name: 'WWE Elite Collection',   slug: 'elite',               count: '3,200+', years: '2010–present', badge: 'hot',     desc: 'The standard bearer of modern WWE collecting' },
      { name: 'Ultimate Edition',       slug: 'ultimate-edition',    count: '80+',    years: '2019–present', badge: 'premium', desc: 'Premium articulation, best sculpts in the line' },
      { name: 'Mattel Basic Series',    slug: 'basic',               count: '1,800+', years: '2010–present',                   desc: 'Entry-level with full roster depth' },
      { name: 'Deluxe Aggression',      slug: 'deluxe-aggression',   count: '420+',   years: '2006–2010',    badge: 'vintage', desc: 'Ruthless Aggression-era Jakks pinnacle' },
      { name: 'Ruthless Aggression',    slug: 'ruthless-aggression', count: '280+',   years: '2002–2007',                      desc: 'Attitude Era crossover collection' },
      { name: 'Legends Series',         slug: 'legends',             count: '200+',   years: '2010–2022',                      desc: 'Hall of Famers and iconic moments' },
      { name: 'Mattel Retro Series',    slug: 'retro',               count: '120+',   years: '2018–present',                   desc: 'Hasbro-style sculpts on modern bodies' },
      { name: 'Classic Superstars',     slug: 'classic-superstars',  count: '160+',   years: '2004–2010',    badge: 'vintage', desc: 'Jakks tribute to WWF golden era talent' },
      { name: 'Hasbro WWF',             slug: 'hasbro-wwf',          count: '110+',   years: '1990–1994',    badge: 'vintage', desc: 'The original wrestling toy line, endlessly nostalgic' },
      { name: 'LJN WWF',               slug: 'ljn-wwf',             count: '70+',    years: '1984–1989',    badge: 'vintage', desc: 'Rubber giants — the founding generation' },
      { name: 'Defining Moments',       slug: 'defining-moments',    count: '60+',    years: '2010–2015',    badge: 'premium', desc: 'Iconic match gear, premium price, strong secondary' },
    ],
  },
  {
    slug: 'marvel',
    name: 'Marvel',
    emoji: '🦸',
    totalCount: '3,800+',
    accent: '#E62429',
    lines: [
      { name: 'Marvel Legends (Hasbro)',  slug: 'marvel-legends',        count: '2,800+', years: '2007–present', badge: 'hot',     desc: 'The dominant 6-inch scale since 2007' },
      { name: 'Marvel Legends (ToyBiz)', slug: 'toybiz-marvel-legends', count: '400+',   years: '2002–2007',    badge: 'vintage', desc: 'The originals — Build-A-Figure era grails' },
      { name: 'Marvel Retro Collection', slug: 'marvel-retro',          count: '120+',   years: '2018–present',                   desc: 'Kenner-style cardbacks on modern figures' },
      { name: 'Marvel Select',           slug: 'marvel-select',         count: '200+',   years: '2003–present',                   desc: "DST's 7-inch scale deep cuts" },
      { name: 'Marvel One:12',           slug: 'marvel-one12',          count: '80+',    years: '2016–present', badge: 'premium', desc: 'Mezco cloth-and-resin premium tier' },
    ],
  },
  {
    slug: 'star-wars',
    name: 'Star Wars',
    emoji: '⚔️',
    totalCount: '2,600+',
    accent: '#FFE300',
    lines: [
      { name: 'The Black Series',          slug: 'black-series',         count: '1,200+', years: '2013–present', badge: 'hot',     desc: '6-inch scale, film-accurate, the collector standard' },
      { name: 'The Vintage Collection',    slug: 'vintage-collection',   count: '600+',   years: '2010–present', badge: 'premium', desc: 'Kenner-style cardback with modern articulation' },
      { name: 'Power of the Force',        slug: 'power-of-the-force',   count: '180+',   years: '1995–2000',    badge: 'vintage', desc: "The 90s comeback wave, everyone's first Star Wars figs" },
      { name: 'Original Kenner (1977–85)', slug: 'kenner-star-wars',     count: '120+',   years: '1977–1985',    badge: 'vintage', desc: 'The originals — Telescoping Saber Vader, rocket Fett' },
      { name: 'Mission Fleet / Micro',     slug: 'mission-fleet',        count: '180+',   years: '2020–present',                   desc: '2.5-inch scale, vehicle-friendly, fast rotation' },
    ],
  },
  {
    slug: 'dc',
    name: 'DC',
    emoji: '🦇',
    totalCount: '1,900+',
    accent: '#1565C0',
    lines: [
      { name: 'DC Multiverse (McFarlane)', slug: 'dc-multiverse',        count: '700+',   years: '2020–present', badge: 'hot',     desc: 'The new standard — 7-inch scale across all DC media' },
      { name: 'DC Universe Classics',      slug: 'dc-universe-classics', count: '400+',   years: '2007–2015',    badge: 'vintage', desc: "Mattel's C&C era, deep roster, strong secondary" },
      { name: 'DC Icons / Essentials',     slug: 'dc-icons',             count: '120+',   years: '2015–2020',                      desc: 'Artist tribute line, beautiful packaging' },
      { name: 'Kenner Super Powers',       slug: 'super-powers',         count: '90+',    years: '1984–1987',    badge: 'vintage', desc: 'The DC equivalent of vintage Star Wars' },
    ],
  },
  {
    slug: 'transformers',
    name: 'Transformers',
    emoji: '🤖',
    totalCount: '2,100+',
    accent: '#E65100',
    lines: [
      { name: 'Masterpiece',         slug: 'masterpiece',     count: '180+',   years: '2003–present', badge: 'premium', desc: 'Screen-accurate alt modes, the holy grail tier' },
      { name: 'Studio Series',       slug: 'studio-series',   count: '280+',   years: '2018–present', badge: 'hot',     desc: 'Film-accurate, shared scale across the timeline' },
      { name: 'Generations / Legacy', slug: 'generations',    count: '600+',   years: '2010–present',                   desc: 'Core collector line — Selects, Deluxe, Voyager' },
      { name: 'G1 Original (1984)',   slug: 'g1-transformers', count: '180+',   years: '1984–1990',    badge: 'vintage', desc: 'The Diaclone-origin classics — Optimus, Megatron, Starscream' },
    ],
  },
  {
    slug: 'gijoe',
    name: 'G.I. Joe',
    emoji: '🪖',
    totalCount: '1,400+',
    accent: '#4CAF50',
    lines: [
      { name: 'Classified Series',      slug: 'classified-series',          count: '300+',   years: '2020–present', badge: 'hot',     desc: '6-inch scale comeback, updated character takes' },
      { name: 'A Real American Hero',   slug: 'a-real-american-hero',       count: '800+',   years: '1982–1994',    badge: 'vintage', desc: 'The 3.75" originals — the deepest roster in the hobby' },
      { name: 'Dollar General Exclusive', slug: 'dg-exclusive',             count: '60+',    years: '2012–2015',                      desc: 'Vintage-style retail exclusives, high secondary value' },
    ],
  },
  {
    slug: 'masters-of-the-universe',
    name: 'MOTU',
    emoji: '⚡',
    totalCount: '800+',
    accent: '#9C27B0',
    lines: [
      { name: 'Masterverse',              slug: 'masterverse',                         count: '200+',   years: '2021–present', badge: 'hot',     desc: 'Modern proportions, deep Netflix/classic roster' },
      { name: 'Origins',                  slug: 'origins',                             count: '150+',   years: '2020–present',                   desc: 'Vintage-compatible scale, 5.5" retro feel' },
      { name: 'Classics (Club Grayskull)', slug: 'masters-of-the-universe-classics',   count: '200+',   years: '2009–2017',    badge: 'premium', desc: 'Subscription-era grails, complete runs are rare' },
      { name: 'Original Mattel (1982)',   slug: 'original-motu',                       count: '80+',    years: '1982–1988',    badge: 'vintage', desc: 'The big-back cards — He-Man and Skeletor as cultural artifacts' },
    ],
  },
  {
    slug: 'teenage-mutant-ninja-turtles',
    name: 'TMNT',
    emoji: '🐢',
    totalCount: '900+',
    accent: '#4CAF50',
    lines: [
      { name: 'NECA TMNT',             slug: 'neca-tmnt',       count: '120+',   years: '2012–present', badge: 'premium', desc: 'Cartoon and Archie comic accurate, limited runs' },
      { name: 'Playmates Classic',     slug: 'playmates-tmnt',  count: '600+',   years: '1988–present',                   desc: 'The ubiquitous line — from vintage giants to modern basics' },
      { name: 'Super7 ReAction TMNT',  slug: 'super7-tmnt',     count: '60+',    years: '2018–present',                   desc: '3.75" retro-kenner style, tight Mondo aesthetic' },
    ],
  },
  {
    slug: 'power-rangers',
    name: 'Power Rangers',
    emoji: '🦕',
    totalCount: '1,200+',
    accent: '#F44336',
    lines: [
      { name: 'Lightning Collection',   slug: 'lightning-collection', count: '300+',   years: '2019–present', badge: 'hot',     desc: 'Hasbro 6-inch collector standard, deep ranger roster' },
      { name: 'Legacy Collection',      slug: 'legacy-collection',    count: '100+',   years: '2013–2019',    badge: 'vintage', desc: 'Bandai America premium tier before Lightning' },
      { name: 'Bandai 5" Classics',     slug: 'bandai-power-rangers', count: '500+',   years: '1993–2018',                      desc: 'The original run — every single ranger era' },
    ],
  },
  {
    slug: 'neca',
    name: 'Horror & Film',
    emoji: '🎬',
    totalCount: '700+',
    accent: '#B71C1C',
    lines: [
      { name: 'NECA Ultimate',         slug: 'neca-ultimate',         count: '300+', years: '2012–present', badge: 'hot',     desc: 'Maximum accessories, maximum articulation, cult licenses' },
      { name: 'NECA Reel Toys (7")',   slug: 'neca-reel-toys',        count: '200+', years: '2003–present',                   desc: 'The original NECA scale — film horror icons' },
      { name: 'NECA Retro Cloth',      slug: 'neca-retro',            count: '80+',  years: '2019–present',                   desc: 'Mego-style horror classics with cloth costumes' },
    ],
  },
  {
    slug: 'indiana-jones',
    name: 'Indiana Jones',
    emoji: '🎩',
    totalCount: '400+',
    accent: '#795548',
    lines: [
      { name: 'Adventure Series (Hasbro)', slug: 'adventure-series', count: '100+', years: '2023–present', badge: 'new',  desc: 'Modern Black-Series-quality, full film span' },
      { name: 'Kenner 12-back (1984)',     slug: 'kenner-indy',      count: '80+',  years: '1982–1984',    badge: 'vintage', desc: 'Temple of Doom era originals, strong secondary' },
      { name: 'Hasbro Original (2008)',    slug: 'hasbro-indy-2008', count: '150+', years: '2008–2010',                      desc: 'Crystal Skull era, wide distribution' },
    ],
  },
  {
    slug: 'ghostbusters',
    name: 'Ghostbusters',
    emoji: '👻',
    totalCount: '600+',
    accent: '#00BCD4',
    lines: [
      { name: 'Plasma Series (Hasbro)',      slug: 'plasma-series',       count: '80+',  years: '2020–present', badge: 'hot',     desc: 'Modern 6-inch premium standard, all four busters' },
      { name: 'Mattel Ghostbusters (6")',    slug: 'mattel-ghostbusters', count: '80+',  years: '2009–2014',    badge: 'vintage', desc: 'DiC-cartoon style, Club Ecto-1 subscription era' },
      { name: 'Kenner The Real Ghostbusters', slug: 'real-ghostbusters', count: '300+', years: '1986–1991',    badge: 'vintage', desc: 'Cartoon tie-in — the definitive nostalgia play' },
    ],
  },
  {
    slug: 'mythic-legions',
    name: 'Mythic Legions',
    emoji: '🗡️',
    totalCount: '500+',
    accent: '#607D8B',
    lines: [
      { name: 'Mythic Legions (4H)',  slug: 'mythic-legions',  count: '400+', years: '2016–present', badge: 'premium', desc: 'Four Horsemen universe — fully interchangeable armor system' },
      { name: 'Necronominus',         slug: 'necronominus',    count: '60+',  years: '2021–present',                   desc: 'Undead faction expansion, high secondary velocity' },
    ],
  },
  {
    slug: 'thundercats',
    name: 'Thundercats',
    emoji: '🐱',
    totalCount: '200+',
    accent: '#FF6F00',
    lines: [
      { name: 'Super7 Ultimates',          slug: 'super7-thundercats', count: '80+',  years: '2019–present', badge: 'premium', desc: 'Most detailed Thundercats figures ever made' },
      { name: 'LJN Thundercats (1985)',    slug: 'ljn-thundercats',    count: '60+',  years: '1985–1988',    badge: 'vintage', desc: 'The originals — Mumm-Ra and Lion-O in rubber magnificence' },
      { name: 'Bandai Thundercats (2011)', slug: 'bandai-thundercats', count: '50+',  years: '2011–2012',                      desc: 'Reboot era, strong articulation for the scale' },
    ],
  },
  {
    slug: 'action-force',
    name: 'Action Force',
    emoji: '🎖️',
    totalCount: '150+',
    accent: '#546E7A',
    lines: [
      { name: 'Action Force (Palitoy)',  slug: 'palitoy-action-force', count: '100+', years: '1982–1988', badge: 'vintage', desc: 'UK-market G.I. Joe cousin — rare outside British collections' },
      { name: 'Valaverse Action Force',  slug: 'valaverse',            count: '50+',  years: '2021–present', badge: 'new', desc: 'Modern 6-inch revival with elite UK collector following' },
    ],
  },
  {
    slug: 'dungeons-dragons',
    name: 'D&D',
    emoji: '🐉',
    totalCount: '350+',
    accent: '#7B1FA2',
    lines: [
      { name: 'Golden Archive (Hasbro)', slug: 'golden-archive', count: '60+',  years: '2023–present', badge: 'new',     desc: '6-inch scale, Honor Among Thieves era' },
      { name: 'LJN D&D (1983)',         slug: 'ljn-dd',         count: '100+', years: '1983–1985', badge: 'vintage',     desc: 'The original cartoon tie-in, highly collectible' },
      { name: 'Dungeons & Dragons Cartoon Classic', slug: 'dd-cartoon', count: '80+', years: '2023–present', desc: 'Hasbro cartoon-accurate, nostalgia-driven collector play' },
    ],
  },
  {
    slug: 'spawn',
    name: 'Spawn',
    emoji: '🦇',
    totalCount: '300+',
    accent: '#37474F',
    lines: [
      { name: 'McFarlane Toys Spawn',   slug: 'mcfarlane-spawn', count: '200+', years: '1994–2006', badge: 'vintage', desc: 'The figures that changed the industry — detail-first philosophy' },
      { name: 'Spawn Ultimates',        slug: 'spawn-ultimates', count: '60+',  years: '2021–present', badge: 'hot',  desc: 'Modern revival — updated articulation on classic sculpts' },
    ],
  },
]

// ─── Badge config ─────────────────────────────────────────────────────────────

const BADGE_CONFIG = {
  hot:     { label: '🔥 Hot',     bg: 'rgba(255,95,0,0.12)',   color: '#FF5F00', border: 'rgba(255,95,0,0.3)' },
  vintage: { label: '📼 Vintage', bg: 'rgba(255,184,0,0.1)',   color: '#FFB800', border: 'rgba(255,184,0,0.3)' },
  new:     { label: '✦ New',      bg: 'rgba(0,200,112,0.1)',   color: '#00C870', border: 'rgba(0,200,112,0.3)' },
  premium: { label: '★ Premium',  bg: 'rgba(200,160,255,0.1)', color: '#C89BFF', border: 'rgba(200,160,255,0.3)' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GenreTaxonomy() {
  const [activeSlug, setActiveSlug] = useState<string>(GENRES[0].slug)
  const activeGenre = GENRES.find(g => g.slug === activeSlug) ?? GENRES[0]

  return (
    <div>
      {/* ── Genre pill selector ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        padding: '0 0 1rem',
        marginBottom: '1.75rem',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {GENRES.map(g => {
          const isActive = g.slug === activeSlug
          return (
            <button
              key={g.slug}
              onClick={() => setActiveSlug(g.slug)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexShrink: 0,
                padding: '0.5rem 1rem',
                border: isActive ? `1px solid ${g.accent}` : '1px solid var(--border)',
                borderRadius: '9999px',
                background: isActive ? `${g.accent}18` : 'var(--s1)',
                color: isActive ? g.accent : 'var(--muted)',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                outline: 'none',
              }}
            >
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>{g.emoji}</span>
              {g.name}
              <span style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                color: isActive ? g.accent : 'var(--dim)',
                letterSpacing: '0.04em',
              }}>
                {g.totalCount}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Active genre header ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>{activeGenre.emoji}</span>
          <div>
            <span style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              color: 'var(--text)',
              letterSpacing: '-0.01em',
            }}>
              {activeGenre.name}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--dim)', marginLeft: '0.5rem' }}>
              {activeGenre.totalCount} figures · {activeGenre.lines.length} lines
            </span>
          </div>
        </div>
        <a
          href={`/${activeGenre.slug}`}
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: activeGenre.accent,
            textDecoration: 'none',
            padding: '0.375rem 0.875rem',
            border: `1px solid ${activeGenre.accent}44`,
            borderRadius: '9999px',
            background: `${activeGenre.accent}0D`,
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Browse All {activeGenre.name} →
        </a>
      </div>

      {/* ── Product line grid ────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '0.625rem',
      }}>
        {activeGenre.lines.map(line => {
          const badge = line.badge ? BADGE_CONFIG[line.badge] : null
          return (
            <a
              key={line.slug}
              href={`/${activeGenre.slug}/${line.slug}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                padding: '0.875rem 1rem',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.borderColor = `${activeGenre.accent}55`
                el.style.background = `${activeGenre.accent}08`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.borderColor = 'var(--border)'
                el.style.background = 'var(--bg)'
              }}
            >
              {/* Top row: name + badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  lineHeight: 1.3,
                  flex: 1,
                  minWidth: 0,
                }}>
                  {line.name}
                </span>
                {badge && (
                  <span style={{
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    padding: '0.1875rem 0.5rem',
                    borderRadius: '9999px',
                    background: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`,
                    flexShrink: 0,
                  }}>
                    {badge.label}
                  </span>
                )}
              </div>

              {/* Stats row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.6875rem',
                color: 'var(--dim)',
              }}>
                <span style={{ fontWeight: 700, color: activeGenre.accent }}>{line.count} figs</span>
                <span>·</span>
                <span>{line.years}</span>
              </div>

              {/* Desc */}
              {line.desc && (
                <div style={{
                  fontSize: '0.6875rem',
                  color: 'var(--muted)',
                  lineHeight: 1.5,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {line.desc}
                </div>
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}
