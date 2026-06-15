# Data Mutation Standards

This document defines how data is written (created, updated, deleted) in
this project. All contributors (human and AI) must follow these rules
exactly. They are not suggestions.

See also [`docs/data-fetching.md`](./data-fetching.md) for read-path rules —
the same per-user data isolation requirements apply to mutations.

## 1. All mutations go through `/src/db` helper functions

Every database write (`insert`, `update`, `delete`) must be implemented as a
helper function inside `src/db/` (e.g. `src/db/workouts.ts`,
`src/db/exercises.ts`), using Drizzle ORM's query builder.

- Do **not** call `db.insert(...)`, `db.update(...)`, or `db.delete(...)`
  directly from a server action or anywhere outside `src/db/`.
- Do **not** use `db.execute(sql\`...\`)` or any other raw/templated SQL.
- Co-locate mutation helpers with the query helpers for the same table
  (e.g. `getWorkoutsForUserByDate` and `createWorkout` both live in
  `src/db/workouts.ts`).

```ts
// src/db/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function createWorkout(userId: string, date: string) {
  const [workout] = await db
    .insert(workouts)
    .values({ userId, date })
    .returning();

  return workout;
}

export async function deleteWorkout(userId: string, workoutId: string) {
  return db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
}
```

## 2. All mutations go through Server Actions in colocated `actions.ts` files

**ALL data mutations must be performed via Server Actions** defined in a
file named `actions.ts`, colocated with the route/feature that uses them
(e.g. `src/app/dashboard/actions.ts`).

- Mark the file with `"use server"` at the top.
- Do **not** perform mutations in Route Handlers (`route.ts`), Client
  Components, or directly inside `page.tsx`.
- Do **not** inline mutation logic in a component — always call a Server
  Action, which in turn calls a helper from `src/db/`.

```ts
// src/app/dashboard/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { createWorkout } from "@/db/workouts";

export async function addWorkout(date: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return createWorkout(userId, date);
}
```

## 3. Server Action parameters must be typed — never `FormData`

Every Server Action must declare **explicit, typed parameters**.

- Do **not** type a Server Action parameter as `FormData`.
- Do **not** use the `<form action={...}>` pattern that relies on Server
  Actions receiving `FormData`.
- Call Server Actions directly from Client Components with plain typed
  arguments (e.g. via an `onClick`/`onSubmit` handler that calls the action
  with explicit values).

```ts
// CORRECT
export async function addWorkout(date: string) {
  /* ... */
}
```

```ts
// INCORRECT — FormData parameter
export async function addWorkout(formData: FormData) {
  const date = formData.get("date");
  /* ... */
}
```

## 4. All Server Action arguments must be validated with Zod

Every Server Action must validate its incoming arguments using **Zod**
before passing them to a `src/db/` helper.

- Define a Zod schema for the action's parameters (inline or imported from a
  shared schema module).
- Parse/validate the arguments at the top of the action using `.parse()` or
  `.safeParse()` before doing anything else.
- Never pass unvalidated client input directly to a `src/db/` helper.

```ts
// src/app/dashboard/actions.ts
"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createWorkout } from "@/db/workouts";

const addWorkoutSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function addWorkout(date: string) {
  const { date: validatedDate } = addWorkoutSchema.parse({ date });

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return createWorkout(userId, validatedDate);
}
```

> **Note:** `zod` is not yet a dependency of this project. Add it
> (`npm install zod`) before writing the first Server Action.

## 5. Per-user data isolation is mandatory

Just like queries, every mutation that touches user-owned data
(`workouts`, `workoutExercises`, `sets`, etc.) must be scoped to the
authenticated user:

- Get `userId` via `auth()` from `@clerk/nextjs/server` **inside the Server
  Action** — never trust a `userId` passed as an argument from the client.
- Every `src/db/` mutation helper for user-owned tables must accept `userId`
  and include it in the `where` clause for `update` and `delete` operations
  — not just `select`.
- For nested rows (`workoutExercises`, `sets`), scope `update`/`delete` by
  verifying the parent `workouts.userId` matches the current user (e.g. via
  a join or a prior ownership check) before mutating.

```ts
// CORRECT — scoped to the authenticated user
export async function updateWorkoutTitle(
  userId: string,
  workoutId: string,
  title: string,
) {
  return db
    .update(workouts)
    .set({ title })
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
}
```

```ts
// INCORRECT — any user could update any workout by guessing/iterating IDs
export async function updateWorkoutTitle(workoutId: string, title: string) {
  return db
    .update(workouts)
    .set({ title })
    .where(eq(workouts.id, workoutId));
}
```

## 6. Summary checklist

When adding a new mutation:

- [ ] The write (`insert`/`update`/`delete`) is implemented as a helper
      function in `src/db/`, using Drizzle ORM — no raw SQL.
- [ ] The mutation is triggered via a Server Action in a colocated
      `actions.ts` file (`"use server"`).
- [ ] The Server Action's parameters are explicitly typed — **not**
      `FormData`.
- [ ] The Server Action validates its arguments with a Zod schema
      (`.parse()` / `.safeParse()`) before calling the `src/db/` helper.
- [ ] `userId` comes from `auth()` inside the Server Action, never from a
      client-supplied argument.
- [ ] The `src/db/` helper takes `userId` and filters by it (including for
      nested rows scoped via their parent `workout`).
