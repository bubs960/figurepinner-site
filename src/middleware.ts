import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Only protect these routes — everything else is public
// All authenticated screens live under /app — vault, settings, wantlist, alerts are all /app/*
const isProtectedRoute = createRouteMatcher([
  '/app(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
