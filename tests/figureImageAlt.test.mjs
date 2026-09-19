import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Bing Webmaster Tools flagged figure photos rendered with alt="" (2026-09-18).
// These public, crawlable surfaces show a NAMED figure, so the photo carries
// "<name> action figure". Genuinely decorative images stay alt="" and are not
// listed here: the aria-hidden thumb collage on /[genre], the nameless sample
// strips on line/character hubs, and the aria-hidden QuickLook hover portal.
const NAMED_FIGURE_SURFACES = [
  'src/app/components/DepthHallHero.tsx',
  'src/app/components/SpotlightVitrine.tsx',
  'src/app/page.tsx',
  'src/app/guides/_components/FandomHubInteractive.tsx',
  'src/app/guides/_components/FandomLineSections.tsx',
  'src/app/guides/_components/HeroesVillainsBand.tsx',
  'src/app/guides/_components/MostCheckedRail.tsx',
]

test('named-figure surfaces never render an empty alt', () => {
  for (const file of NAMED_FIGURE_SURFACES) {
    const src = readFileSync(new URL('../' + file, import.meta.url), 'utf8')
    const code = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
    assert.ok(!/alt=(""|\{''\}|\{""\})/.test(code), file + ' has an empty alt on a figure image')
  }
})

test('dense hub cards pass a named alt to FigureThumbStatic', () => {
  for (const file of ['src/app/[genre]/[line]/_lib/lineHub.tsx', 'src/app/[genre]/character/_lib/characterHub.tsx']) {
    const src = readFileSync(new URL('../' + file, import.meta.url), 'utf8')
    const tags = src.match(/<FigureThumbStatic\b[^>]*\/>/g) ?? []
    assert.ok(tags.length > 0, file + ': no FigureThumbStatic found')
    for (const t of tags) assert.ok(/\balt=\{`/.test(t), file + ': ' + t)
  }
})
