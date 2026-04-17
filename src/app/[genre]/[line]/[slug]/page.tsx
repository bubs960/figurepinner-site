// DEPRECATED — superseded by /figure/[figure_id]
// The canonical figure URL is /figure/:figure_id (stable, KB-native).
// This route is kept as a 404 fallback in case of old deep links.
// Once the KB has figure_id in search results, all links will use /figure/:figure_id.

import { redirect } from 'next/navigation'

export const runtime = 'edge'

export default function LegacyFigurePage() {
  redirect('/')
}
