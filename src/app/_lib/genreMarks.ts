export const GENRE_MARKS: Record<string, string> = {
  'wrestling': 'WR',
  'marvel': 'MV',
  'star-wars': 'SW',
  'dc': 'DC',
  'transformers': 'TF',
  'gijoe': 'GI',
  'masters-of-the-universe': 'MO',
  'teenage-mutant-ninja-turtles': 'TM',
  'power-rangers': 'PR',
  'indiana-jones': 'IJ',
  'ghostbusters': 'GB',
  'mythic-legions': 'ML',
  'thundercats': 'TC',
  'action-force': 'AF',
  'dungeons-dragons': 'DD',
  'dungeons-and-dragons': 'DD',
  'neca': 'HF',
  'spawn': 'SP',
}

export function genreMark(genre: string | null | undefined, fallback = 'FP'): string {
  if (!genre) return fallback
  return GENRE_MARKS[genre] ?? labelMark(genre, fallback)
}

export function labelMark(label: string | null | undefined, fallback = 'FP'): string {
  const words = (label ?? '').replace(/[^A-Za-z0-9 ]/g, '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return fallback
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}
