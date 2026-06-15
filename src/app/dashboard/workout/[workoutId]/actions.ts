"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { parse } from "date-fns";
import { updateWorkout } from "@/db/workouts";

const updateWorkoutSchema = z.object({
  workoutId: z.string().uuid(),
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
