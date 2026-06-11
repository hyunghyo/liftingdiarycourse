# Data Fetching Standards

This document defines how data is fetched and queried in this project. All
contributors (human and AI) must follow these rules exactly. They are not
suggestions.

## 1. Server Components only

**ALL data fetching must happen in React Server Components.**

This means data fetching must **NOT** be done via:

- Route Handlers (`src/app/**/route.ts`)
- Client Components (`"use client"` files), including `useEffect`,
  `fetch`, SWR, React Query, etc.
- Server Actions used purely to load data for display
- Any other mechanism

If a page or section needs data, fetch it directly in its `page.tsx` (or
other server component) by calling a helper function from `/src/db` (see
below). Pass the resulting data down to client components as props if
interactivity is needed — do not have client components fetch their own
data.

## 2. All queries go through `/src/db` helper functions

Every database query must be implemented as a helper function inside
`src/db/` (e.g. `src/db/workouts.ts`, `src/db/exercises.ts`). Server
components call these helpers — they must never import `db` or construct
queries directly inline in `page.tsx`.

```ts
// src/db/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function getWorkoutsForUser(userId: string) {
  return db.query.workouts.findMany({
    where: eq(workouts.userId, userId),
    with: { workoutExercises: { with: { sets: true, exercise: true } } },
  });
}
```

```tsx
// src/app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { getWorkoutsForUser } from "@/db/workouts";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null; // handled by middleware, but keep TS happy

  const workouts = await getWorkoutsForUser(userId);

  return (/* ... */);
}
```

## 3. Drizzle ORM only — no raw SQL

All queries must be written using **Drizzle ORM**'s query builder or
relational query API (`db.query.*`, `db.select()`, `db.insert()`,
`db.update()`, `db.delete()`).

- Do **not** use `db.execute(sql\`...\`)` or any other raw/templated SQL.
- Do **not** construct SQL strings by hand, even for "simple" queries.
- Use Drizzle operators (`eq`, `and`, `or`, `gte`, `lte`, etc.) from
  `drizzle-orm` for filtering.

## 4. Per-user data isolation is mandatory

This app uses Clerk for authentication. Every table that stores user data
(e.g. `workouts`) has a `userId` column holding the Clerk user ID.

**A logged-in user must only ever be able to read, update, or delete their
own rows.** This is one of the most important rules in this codebase.

To enforce this:

- Every helper function in `/src/db` that touches user-owned data
  (`workouts`, `workoutExercises`, `sets`, etc.) **must accept the
  authenticated `userId` as a parameter** and **must include it in the
  `where` clause** of the query — including for `update` and `delete`
  operations, not just `select`.
- Get the `userId` in the server component via `auth()` from
  `@clerk/nextjs/server`. Never trust a `userId` passed from the client
  (e.g. via form fields, query params, or request bodies) for scoping a
  query.
- Joined/nested data (e.g. `workoutExercises`, `sets`) must be scoped by
  filtering on the parent `workouts.userId` — never fetch a
  `workoutExercise` or `set` by its own ID alone without verifying the
  parent `workout.userId` matches the current user.
- `exercises` is shared reference data (not user-owned) and may be queried
  without a `userId` filter.

### Example: correct vs incorrect

```ts
// CORRECT — scoped to the authenticated user
export async function getWorkoutById(userId: string, workoutId: string) {
  return db.query.workouts.findFirst({
    where: and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
  });
}
```

```ts
// INCORRECT — any user could fetch any workout by guessing/iterating IDs
export async function getWorkoutById(workoutId: string) {
  return db.query.workouts.findFirst({
    where: eq(workouts.id, workoutId),
  });
}
```

## 5. Summary checklist

When adding a new data-driven page or feature:

- [ ] Data is fetched in a Server Component (`page.tsx` or similar), not a
      route handler or client component.
- [ ] The query lives in a helper function in `src/db/`.
- [ ] The helper uses Drizzle ORM (`db.query.*` / query builder) — no raw
      SQL.
- [ ] The helper takes `userId` and filters by it for any user-owned table.
- [ ] `userId` comes from `auth()` on the server, never from client input.
