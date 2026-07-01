import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getWorkoutWithExercises } from "@/db/workouts";
import { getExercises } from "@/db/exercises";
import { EditWorkoutForm } from "./edit-workout-form";

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { workoutId } = await params;
  const [workout, exercises] = await Promise.all([
    getWorkoutWithExercises(userId, workoutId),
    getExercises(),
  ]);
  if (!workout) notFound();

  return <EditWorkoutForm workout={workout} exercises={exercises} />;
}
