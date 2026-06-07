import type { Article } from './articles'
// Drafts awaiting Steve's review. The daily content engine appends here; Steve
// moves approved articles into articles.ts and deploys, then this file is emptied.
// Empty = nothing pending review.
//
// 2026-06-06: batch of 3 (ids 6, 7, 29) reviewed, fact-verified, merged into
// articles.ts, backlog flipped to published. Staging reset.
export const STAGED_DRAFTS: Article[] = []
