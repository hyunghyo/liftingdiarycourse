"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { parse } from "date-fns";
import { createWorkout } from "@/db/workouts";

const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .optional();

const createWorkoutSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().min(1).max(200).optional(),
  startTime: timeSchema,
  // completedTime: timeSchema,
});

function combineDateAndTime(date: string, time?: string) {
  if (!time) return undefined;
  return parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
}

export async function createWorkoutAction(
  date: string,
  title?: string,
  startTime?: string,
  // completedTime?: string,
) {
  const validated = createWorkoutSchema.parse({
    date,
    title,
    startTime,
    // completedTime,
  });

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const startedAt = combineDateAndTime(validated.date, validated.startTime);
  // const completedAt = combineDateAndTime(
  //   validated.date,
  //   validated.completedTime,
  // );

  await createWorkout(
    userId,
    validated.date,
    validated.title,
    startedAt,
    // completedAt,
  );

  redirect(`/dashboard?date=${validated.date}`);
}
