import { deriveName, type KBFigure } from './src/data/kbTypes.ts'
import { prettifySlug } from './src/app/figure/[figure_id]/_lib/figureFormatters.ts'
import { enrichedDescription } from './src/app/figure/[figure_id]/_lib/enrichedCopy.ts'

// @ts-ignore - plain CJS data module
import { FIGURES_V2 } from './src/data/figures-reference-v2.js'

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b)
  const n = s.length
  if (n === 0) return 0
  return n % 2 === 1 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2
}

const figures: KBFigure[] = FIGURES_V2

const titleLens: number[] = []
let over60 = 0
let dupCount = 0 // titles where the line-string appears twice
const dupExamples: string[] = []
const longExamples: { fid: string; title: string; len: number }[] = []

// Description reconstruction (price-independent: worst case "no price data"
// branch, which is the SHORTEST of the three possible description variants
// -- so counts below are a floor, not an inflated number).
const descLensNoPrice: number[] = []
let descOver160NoPrice = 0
let enrichedCount = 0
let templatedCount = 0
let enrichedOver160 = 0
let templatedOver160 = 0

for (const f of figures) {
  const displayName = deriveName(f)
  const line = prettifySlug(f.product_line)

  // Root layout applies metadata.title.template = '%s | FigurePinner'
  // (src/app/layout.tsx:52-55) to every page's generateMetadata title, so
  // this is what actually reaches <title> / the SERP snippet.
  const rawTitle = `${displayName} — ${line} Price & Value`
  const title = `${rawTitle} | FigurePinner`
  titleLens.push(title.length)
  if (title.length > 60) over60++

  // crude "line string repeated inside title" check: does displayName's
  // parenthesized tail already contain the line text?
  if (displayName.includes(`(${line}`) || displayName.includes(` ${line} `) || displayName.includes(`(${line})`)) {
    dupCount++
    if (dupExamples.length < 8) dupExamples.push(`${f.figure_id} :: displayName="${displayName}" line="${line}" title="${title}"`)
  }

  if (longExamples.length < 10 && title.length > 60) {
    longExamples.push({ fid: f.figure_id, title, len: title.length })
  }

  const enriched = enrichedDescription(f)
  let desc: string
  if (enriched) {
    enrichedCount++
    desc = `${enriched} Real eBay sold prices, free on FigurePinner.`
  } else {
    templatedCount++
    desc = `${displayName} ${line} price — check what it actually sold for on eBay. FigurePinner tracks real sold comps free.`
  }
  descLensNoPrice.push(desc.length)
  if (desc.length > 160) descOver160NoPrice++
  if (enriched) {
    if (desc.length > 160) enrichedOver160++
  } else {
    if (desc.length > 160) templatedOver160++
  }
}

console.log('=== TITLE ===')
console.log('total figures:', figures.length)
console.log('titles > 60 chars:', over60, `(${(100 * over60 / figures.length).toFixed(1)}%)`)
console.log('median title length:', median(titleLens))
console.log('min/max title length:', Math.min(...titleLens), Math.max(...titleLens))
console.log('titles containing literal line-substring twice (approx dup detector):', dupCount)
console.log('\nsample duplicated titles:')
for (const e of dupExamples) console.log(' ', e)
console.log('\nsample long titles:')
for (const e of longExamples) console.log(' ', e.len, e.title)

console.log('\n=== DESCRIPTION (no-price / shortest-case branch) ===')
console.log('enriched (match_represented passed gate):', enrichedCount)
console.log('templated fallback (uses displayName+line, price-independent shortest variant):', templatedCount)
console.log('desc > 160 chars (this branch only, floor estimate):', descOver160NoPrice)
console.log('  of which enriched-branch > 160:', enrichedOver160, `/ ${enrichedCount}`)
console.log('  of which templated-branch > 160:', templatedOver160, `/ ${templatedCount}`)
console.log('median desc length (this branch):', median(descLensNoPrice))
