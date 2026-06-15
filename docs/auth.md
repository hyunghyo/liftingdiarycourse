# Auth Coding Standards

This document defines how authentication and authorization are handled in
this project. All contributors (human and AI) must follow these rules
exactly. They are not suggestions.

## 1. Clerk is the only auth system

This app uses **Clerk** (`@clerk/nextjs`) for all authentication and session
management. Do not introduce other auth libraries, hand-rolled session
handling, JWT parsing, or cookie-based auth logic.

## 2. Middleware protects routes

`src/middleware.ts` uses `clerkMiddleware()` from `@clerk/nextjs/server` to
run Clerk on every relevant request:

```ts
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/__clerk/(.*)',
    '/(api|trpc)(.*)',
  ],
}
```

Do not remove or narrow this matcher in a way that stops Clerk running on
pages, API routes, or the `/__clerk` auto-proxy path. If a route needs
custom protection logic (e.g. redirecting signed-out users), extend this
middleware rather than adding separate auth checks elsewhere.

## 3. `ClerkProvider` wraps the app

`src/app/layout.tsx` wraps the entire app in `ClerkProvider` and renders
sign-in/sign-up/user UI via Clerk's components:

```tsx
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

<ClerkProvider>
  <header className="flex items-center justify-end gap-4 px-6 py-3 border-b">
    <Show when="signed-out">
      <SignInButton mode="modal" />
      <SignUpButton mode="modal" />
    </Show>
    <Show when="signed-in">
      <UserButton />
    </Show>
  </header>
  {children}
</ClerkProvider>
```

- Use Clerk's `Show` component (`when="signed-in"` / `when="signed-out"`) to
  conditionally render UI based on auth state. Do not hand-roll this with
  `useUser()`/`useAuth()` checks and manual conditionals unless `Show`
  genuinely cannot express the case.
- Use Clerk's built-in components (`SignInButton`, `SignUpButton`,
  `UserButton`, etc.) for auth UI. Do not build custom sign-in/sign-up forms
  or account menus.

## 4. Getting the current user in Server Components

Per [`docs/data-fetching.md`](./data-fetching.md), all data fetching happens
in Server Components. Get the authenticated user there with `auth()` from
`@clerk/nextjs/server`:

```tsx
import { auth } from "@clerk/nextjs/server";
import { getWorkoutsForUserByDate } from "@/db/workouts";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null; // handled by middleware, but keep TS happy

  const workouts = await getWorkoutsForUserByDate(userId, dateKey);
  return <DashboardClient workouts={workouts} />;
}
```

- `auth()` is `async` — always `await` it.
- Guard with `if (!userId) return null;` (or redirect, if appropriate)
  immediately after calling `auth()`. The middleware is the primary
  protection, but this keeps TypeScript happy and guards against
  misconfigured matchers.
- Never read `userId` from anywhere other than `auth()` on the server
  (not from props, query params, form fields, or request bodies).

## 5. Per-user data isolation is mandatory

This is the most important rule in the codebase and is shared with
[`docs/data-fetching.md`](./data-fetching.md):

- The Clerk `userId` from `auth()` is the **only** source of truth for
  "who is the current user" when querying the database.
- Every `/src/db` helper that touches user-owned data (`workouts`,
  `workoutExercises`, `sets`, etc.) must accept `userId` as a parameter and
  filter by it — for `select`, `update`, and `delete` alike.
- Joined/nested rows (`workoutExercises`, `sets`) must be scoped via the
  parent `workouts.userId`, never trusted by their own ID alone.
- `exercises` is shared reference data and is not scoped by `userId`.

See `docs/data-fetching.md` §4 for the correct/incorrect examples — the same
rules apply to any Server Action that mutates data.

## 6. Server Actions and mutations

If a Server Action mutates user data, it must:

- Call `await auth()` itself to get `userId` — never accept `userId` as an
  argument from the client.
- Pass that `userId` into the relevant `/src/db` helper, which performs the
  scoped query as described above.

## 7. Environment variables

Clerk's standard environment variables (e.g.
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) configure the
Clerk instance. Do not hardcode keys, and do not introduce alternative
config mechanisms for auth.

## 8. Summary checklist

When adding or touching any auth-related code:

- [ ] Auth state and session handling go through Clerk (`@clerk/nextjs`,
      `@clerk/nextjs/server`) — no other auth library or custom session code.
- [ ] Route protection is via `clerkMiddleware()` in `src/middleware.ts`.
- [ ] Conditional UI uses Clerk's `Show` component and built-in
      `SignInButton` / `SignUpButton` / `UserButton`.
- [ ] `userId` is obtained via `await auth()` on the server — never from
      client input.
- [ ] Every helper/action touching user-owned tables filters by `userId`
      (see `docs/data-fetching.md` §4).
