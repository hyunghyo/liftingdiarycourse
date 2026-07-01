import { db } from "@/db";
import { workoutExercises, sets, workouts } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function getExercises() {
  return db.query.exercises.findMany({
    orderBy: (exercises, { asc }) => [asc(exercises.name)],
  });
}

export async function addExerciseToWorkout(
  userId: string,
  workoutId: string,
  exerciseId: string,
) {
  const workout = await db.query.workouts.findFirst({
    where: and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
  });
  if (!workout) throw new Error("Workout not found");

  const [{ nextIndex }] = await db
    .select({ nextIndex: sql<number>`coalesce(max(${workoutExercises.index}), -1) + 1` })
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId));

  const [row] = await db
    .insert(workoutExercises)
    .values({ workoutId, exerciseId, index: nextIndex })
    .returning();

  return row;
}

export async function removeExerciseFromWorkout(
  userId: string,
  workoutExerciseId: string,
) {
  const row = await db.query.workoutExercises.findFirst({
    where: eq(workoutExercises.id, workoutExerciseId),
    with: { workout: true },
  });
  if (!row || row.workout.userId !== userId) throw new Error("Not found");

  await db.delete(workoutExercises).where(eq(workoutExercises.id, workoutExerciseId));
}

export async function addSet(
  userId: string,
  workoutExerciseId: string,
  data: { reps?: number; weight?: number; durationSeconds?: number },
) {
  const row = await db.query.workoutExercises.findFirst({
    where: eq(workoutExercises.id, workoutExerciseId),
    with: { workout: true, sets: true },
  });
  if (!row || row.workout.userId !== userId) throw new Error("Not found");

  const nextSetNumber = row.sets.length > 0
    ? Math.max(...row.sets.map((s) => s.setNumber)) + 1
    : 1;

  const [set] = await db
    .insert(sets)
    .values({
      workoutExerciseId,
      setNumber: nextSetNumber,
      reps: data.reps,
      weight: data.weight?.toString(),
      durationSeconds: data.durationSeconds,
    })
    .returning();

  return set;
}

export async function removeSet(userId: string, setId: string) {
  const set = await db.query.sets.findFirst({
    where: eq(sets.id, setId),
    with: {
      workoutExercise: {
        with: { workout: true },
      },
    },
  });
  if (!set || set.workoutExercise.workout.userId !== userId)
    throw new Error("Not found");

  await db.delete(sets).where(eq(sets.id, setId));
}
