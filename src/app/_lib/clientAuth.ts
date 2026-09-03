'use client'

// hasClientClerkSession — "is there probably a signed-in session?" for client
// components that must not fetch for anonymous visitors (AdSlot's Pro check,
// PersonalizedShelf, WaveProgress, HeroCtaRail).
//
// 2026-09-03 FIX: this used to test document.cookie for `__session`. Clerk's
// `__session` cookie is HttpOnly in production, so it is invisible to
// document.cookie — observed on Steve's signed-in Chrome 9/3 (document.cookie
// = `__client_uat` + `__client_uat_<suffix>` only). Every consumer above was
// therefore treating signed-in visitors as anonymous: no personalised shelf,
// no wave progress, no Pro ad suppression, hero CTA in its signed-out state.
// The non-HttpOnly `__client_uat` cookie is the signal Clerk actually leaves
// for JS; sessionHint.ts reads it (tested in tests/sessionHint.test.mjs).
// One parser for the whole site — this is now a thin alias.

import { readSessionHint } from './sessionHint'

export function hasClientClerkSession(): boolean {
  return readSessionHint()
}
