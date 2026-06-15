# Routing Standards

This document defines how routes are organized and protected in this
project. All contributors (human and AI) must follow these rules exactly.
They are not suggestions.

## 1. All application routes live under `/dashboard`

Every feature route in this app must be nested under `src/app/dashboard/`,
so its URL is `/dashboard` or a sub-path of it (e.g. `/dashboard/workout/new`,
`/dashboard/workout/[workoutId]`).

- Do not add feature pages at the root of `src/app/` (alongside `page.tsx`
  for `/`).
- The root route (`/`, `src/app/page.tsx`) is the only route outside
  `/dashboard` and must remain a public marketing/landing page — it must not
  perform any data fetching or render user-owned data.
- New routes are added by creating a new folder under
  `src/app/dashboard/...` with a `page.tsx` (and colocated `actions.ts`,
  form components, etc. per [`docs/data-mutations.md`](./data-mutations.md)).

## 2. `/dashboard` and all sub-routes are protected

Every route under `/dashboard` (including `/dashboard` itself) requires a
signed-in user. There is no "preview" or partially-public version of any
dashboard route.

## 3. Route protection is enforced in Proxy (not per-page checks)

> **Next.js 16 terminology note:** Next.js 16 renamed the `middleware.ts`
> file convention to `proxy.ts` (the exported function is now `proxy`
> instead of `middleware`). "Proxy" is the current name for what was
> previously called "Middleware" — see
> `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
> This document uses "Proxy" to refer to that file convention.

Route protection for `/dashboard` and its sub-routes must be implemented in
the project's Proxy file using `clerkMiddleware()` from
`@clerk/nextjs/server`, redirecting signed-out users away from
`/dashboard/*`.

```ts
// src/proxy.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for Clerk's auto-proxy path
    '/__clerk/(.*)',
    '/(api|trpc)(.*)',
  ],
}
```

- `auth.protect()` redirects signed-out users to the sign-in flow before any
  `/dashboard/*` page renders.
- Do not implement redirect-based protection by hand-rolling `auth()` checks
  and `redirect()` calls inside individual `page.tsx` files. The Proxy is the
  single place this logic lives.
- Every `page.tsx` under `/dashboard` should still call `await auth()` and
  guard with `if (!userId) return null;` as described in
  [`docs/auth.md`](./auth.md) §4 — this is a defense-in-depth/TypeScript
  convenience measure, not the primary protection mechanism.

## 4. Existing `src/middleware.ts` needs migration

The current `src/middleware.ts` (and the example in
[`docs/auth.md`](./auth.md) §2) use the pre-Next.js-16 `middleware.ts`
convention with a bare `export default clerkMiddleware()` and no route
protection logic. When this file is next touched, it should be:

1. Renamed to `src/proxy.ts`, with the exported function renamed from
   `middleware`/default-anonymous to `proxy` (or kept as a default export
   per the Proxy convention).
2. Updated to use `createRouteMatcher(['/dashboard(.*)'])` and
   `auth.protect()` as shown above, so signed-out users are redirected away
   from `/dashboard/*`.

`docs/auth.md` §2 should be updated to match once this migration happens.

## 5. Summary checklist

When adding a new route:

- [ ] The route lives under `src/app/dashboard/...` (not at the app root).
- [ ] No route-specific sign-in/redirect logic is added outside the Proxy —
      protection comes from the `/dashboard(.*)` matcher in `src/proxy.ts`.
- [ ] The page still calls `await auth()` and guards with
      `if (!userId) return null;` per [`docs/auth.md`](./auth.md).
- [ ] Data fetching/mutations follow
      [`docs/data-fetching.md`](./data-fetching.md) and
      [`docs/data-mutations.md`](./data-mutations.md).
