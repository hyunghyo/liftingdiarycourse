import { db } from "@/db";
import { workouts } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function createWorkout(
  userId: string,
  date: string,
  title?: string,
  startedAt?: Date,
  // completedAt?: Date,
) {
  const [workout] = await db
    .insert(workouts)
    .values({ userId, date, title, startedAt /*, completedAt */ })
    .returning();

  return workout;
}

export async function getWorkoutsForUserByDate(userId: string, date: string) {
  return db.query.workouts.findMany({
    where: and(eq(workouts.userId, userId), eq(workouts.date, date)),
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.index)],
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
  });
}

export async function getWorkoutById(userId: string, workoutId: string) {
  return db.query.workouts.findFirst({
    where: and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
  });
}

export async function getWorkoutWithExercises(userId: string, workoutId: string) {
  return db.query.workouts.findFirst({
    where: and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.index)],
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
  });
}

export async function updateWorkout(
  userId: string,
  workoutId: string,
  date: string,
  title?: string,
  startedAt?: Date,
) {
  const [workout] = await db
    .update(workouts)
    .set({ date, title, startedAt })
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning();

  return workout;
}
