export function composeImageSlug({ character, line, series, brand }: {
  character: string; line: string; series: number | null; brand: string
}): string {
  return [character, line, series, brand].filter(Boolean).join('-').toLowerCase().replace(/\s+/g, '-')
}

export function seoImageUrl(imageUrl: string, _slug: string): string {
  return imageUrl
}
