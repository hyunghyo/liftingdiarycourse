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
