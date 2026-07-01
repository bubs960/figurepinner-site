'use client'

const CLERK_SESSION_COOKIE = /(?:^|;\s*)__session(?:=|_[^=;]+=)/

export function hasClientClerkSession(): boolean {
  if (typeof document === 'undefined') return false
  return CLERK_SESSION_COOKIE.test(document.cookie)
}
