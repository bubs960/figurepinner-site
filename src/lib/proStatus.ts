/**
 * Pro status helpers.
 * Pro flag is stored in Clerk publicMetadata.isPro (set by Stripe webhook).
 *
 * isUserPro() works in two modes:
 *   1. Browser session (web dashboard): currentUser() returns the user directly.
 *   2. Bearer JWT (mobile app): currentUser() returns null, so we fall back to
 *      clerkClient().users.getUser(userId) using the userId from auth().
 *
 * Both paths ultimately read publicMetadata.isPro from Clerk's backend.
 */

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'

/**
 * Returns true if the currently authenticated user has Pro.
 * Works with both Clerk session cookies (web) and Bearer JWT (mobile).
 * Call this inside API routes only (server-side).
 */
export async function isUserPro(): Promise<boolean> {
  // Fast path: session cookie — currentUser() works directly
  const user = await currentUser()
  if (user) {
    return user.publicMetadata?.isPro === true
  }

  // Fallback: Bearer JWT — auth() has validated the token and gives us userId,
  // but currentUser() returns null because there's no session cookie.
  // Use clerkClient to fetch the full user record from Clerk's backend API.
  const { userId } = await auth()
  if (!userId) return false

  try {
    const client = await clerkClient()
    const fullUser = await client.users.getUser(userId)
    return fullUser.publicMetadata?.isPro === true
  } catch {
    // If Clerk backend call fails, fail closed (treat as free)
    return false
  }
}

/** Free-tier limits — single source of truth */
export const FREE_LIMITS = {
  VAULT: 25,
  ALERTS: 3,
  LIST_IT_MONTHLY: 5,
  SEARCHES_MONTHLY: 100,
} as const
