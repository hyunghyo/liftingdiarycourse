import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  date,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── exercises ────────────────────────────────────────────────────────────────

export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── workouts ─────────────────────────────────────────────────────────────────

export const workouts = pgTable(
  "workouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Clerk userId — opaque external string, no local FK
    userId: varchar("user_id", { length: 64 }).notNull(),
    // Stored as string "YYYY-MM-DD" — avoids timezone shifts
    date: date("date").notNull(),
    title: varchar("title", { length: 200 }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("workouts_user_id_idx").on(t.userId),
    index("workouts_user_id_date_idx").on(t.userId, t.date),
  ],
);

// ─── workout_exercises ────────────────────────────────────────────────────────

export const workoutExercises = pgTable(
  "workout_exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workoutId: uuid("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    index: integer("index").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("workout_exercises_workout_id_idx").on(t.workoutId),
    index("workout_exercises_exercise_id_idx").on(t.exerciseId),
    uniqueIndex("workout_exercises_workout_index_uidx").on(
      t.workoutId,
      t.index,
    ),
  ],
);

// ─── sets ─────────────────────────────────────────────────────────────────────

export const sets = pgTable(
  "sets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workoutExerciseId: uuid("workout_exercise_id")
      .notNull()
      .references(() => workoutExercises.id, { onDelete: "cascade" }),
    setNumber: integer("set_number").notNull(),
    reps: integer("reps"),
    // numeric() returns string in TS — use parseFloat() when displaying
    weight: numeric("weight", { precision: 8, scale: 2 }),
    durationSeconds: integer("duration_seconds"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("sets_workout_exercise_id_idx").on(t.workoutExerciseId),
    uniqueIndex("sets_workout_exercise_set_number_uidx").on(
      t.workoutExerciseId,
      t.setNumber,
    ),
  ],
);

// ─── Relations (enables db.query.* relational API) ────────────────────────────

export const workoutsRelations = relations(workouts, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const exercisesRelations = relations(exercises, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(
  workoutExercises,
  ({ one, many }) => ({
    workout: one(workouts, {
      fields: [workoutExercises.workoutId],
      references: [workouts.id],
    }),
    exercise: one(exercises, {
      fields: [workoutExercises.exerciseId],
      references: [exercises.id],
    }),
    sets: many(sets),
  }),
);

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));
