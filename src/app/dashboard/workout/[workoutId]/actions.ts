"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { parse } from "date-fns";
import { updateWorkout } from "@/db/workouts";
import {
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  addSet,
  removeSet,
} from "@/db/exercises";
import { revalidatePath } from "next/cache";

const uuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

const updateWorkoutSchema = z.object({
  workoutId: uuidSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().min(1).max(200).optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

function combineDateAndTime(date: string, time?: string) {
  if (!time) return undefined;
  return parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
}

export async function updateWorkoutAction(
  workoutId: string,
  date: string,
  title?: string,
  startTime?: string,
) {
  const validated = updateWorkoutSchema.parse({
    workoutId,
    date,
    title,
    startTime,
  });

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const startedAt = combineDateAndTime(validated.date, validated.startTime);

  await updateWorkout(
    userId,
    validated.workoutId,
    validated.date,
    validated.title,
    startedAt,
  );

  redirect(`/dashboard?date=${validated.date}`);
}

const addExerciseSchema = z.object({
  workoutId: uuidSchema,
  exerciseId: uuidSchema,
});

export async function addExerciseAction(workoutId: string, exerciseId: string) {
  const validated = addExerciseSchema.parse({ workoutId, exerciseId });
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await addExerciseToWorkout(userId, validated.workoutId, validated.exerciseId);
  revalidatePath(`/dashboard/workout/${validated.workoutId}`);
}

const removeExerciseSchema = z.object({
  workoutId: uuidSchema,
  workoutExerciseId: uuidSchema,
});

export async function removeExerciseAction(
  workoutId: string,
  workoutExerciseId: string,
) {
  const validated = removeExerciseSchema.parse({ workoutId, workoutExerciseId });
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await removeExerciseFromWorkout(userId, validated.workoutExerciseId);
  revalidatePath(`/dashboard/workout/${validated.workoutId}`);
}

const addSetSchema = z.object({
  workoutId: uuidSchema,
  workoutExerciseId: uuidSchema,
  reps: z.number().int().positive().optional(),
  weight: z.number().positive().optional(),
  durationSeconds: z.number().int().positive().optional(),
});

export async function addSetAction(
  workoutId: string,
  workoutExerciseId: string,
  data: { reps?: number; weight?: number; durationSeconds?: number },
) {
  const validated = addSetSchema.parse({ workoutId, workoutExerciseId, ...data });
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await addSet(userId, validated.workoutExerciseId, {
    reps: validated.reps,
    weight: validated.weight,
    durationSeconds: validated.durationSeconds,
  });
  revalidatePath(`/dashboard/workout/${validated.workoutId}`);
}

const removeSetSchema = z.object({
  workoutId: uuidSchema,
  setId: uuidSchema,
});

export async function removeSetAction(workoutId: string, setId: string) {
  const validated = removeSetSchema.parse({ workoutId, setId });
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await removeSet(userId, validated.setId);
  revalidatePath(`/dashboard/workout/${validated.workoutId}`);
}
