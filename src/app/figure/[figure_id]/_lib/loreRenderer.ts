/**
 * loreRenderer.ts
 * Pure content engine — generates lore band sentences from figure data.
 * Must remain side-effect free. Reused on mobile app.
 *
 * Unit test cases (run separately):
 *  1. All three fields (line_attributes + character_notes + release_year) → 3 sentences
 *  2. Only line_attributes → 1 sentence
 *  3. Only character_notes (no line_attributes) → 0 sentences, hasContent: false
 *  4. Neither → 0 sentences, hasContent: false
 *  5. release_year present → uses exact year
 *  6. release_year null, line.years present → uses range
 *  7. character_slug only (no character_notes) → prettified slug in sentence 1
 */

import { prettifySlug } from './figureFormatters'

export interface LineAttributes {
  display_name: string
  years: [number, number]
  era_label: string
  flavor: string | null
  predecessor_line_key: string | null
  successor_line_key: string | null
  peak_demand: 'very_high' | 'high' | 'medium' | 'low'
  articulation_level: string
  packaging_style: string
}

export interface CharacterNotes {
  display_name: string
  notes: string
  peak_years: [number, number]
  also_known_as: string[]
}

export interface LoreInput {
  character_slug: string
  brand: string
  line_attributes: LineAttributes | null
  character_notes: CharacterNotes | null
  release_year: number | null
}

export interface LoreResult {
  /** Raw sentence strings; asterisks denote <em> (line name emphasis) */
  sentences: string[]
  hasContent: boolean
}

/**
 * Render lore band sentences from figure data.
 * Returns empty result when critical fields are absent.
 */
export function renderLoreBand(input: LoreInput): LoreResult {
  const sentences: string[] = []
  const { line_attributes: line, character_notes: char, release_year, character_slug, brand } = input

  // Sentence 1 — identity + era (requires line_attributes)
  if (line) {
    const characterName = char?.display_name ?? prettifySlug(character_slug)
    const yearPhrase = release_year
      ? `released in ${release_year}`
      : `released circa ${line.years[0]}–${line.years[1]}`
    sentences.push(
      `${characterName} from ${brand}'s *${line.display_name}* line (${line.era_label}), ${yearPhrase}.`
    )

    // Sentence 2 — line flavor (requires sentence 1 to have fired)
    if (line.flavor) {
      sentences.push(line.flavor)
    }
  }

  // Sentence 3 — character notes (independent of line, but only renders if sentence 1 already present)
  if (char?.notes && sentences.length > 0) {
    sentences.push(char.notes)
  }

  return {
    sentences,
    hasContent: sentences.length > 0,
  }
}

/**
 * Render sentences to HTML-safe strings.
 * Converts *word* → <em>word</em>. No full markdown parser needed.
 */
export function renderSentenceToHtml(sentence: string): string {
  return sentence.replace(/\*([^*]+)\*/g, '<em>$1</em>')
}
